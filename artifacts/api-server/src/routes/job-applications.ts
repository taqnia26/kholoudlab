import { Router, type IRouter } from "express";
import { Resend } from "resend";
import {
  CreateJobApplicationBody,
  CreateJobApplicationResponse,
} from "@workspace/api-zod";
import { db, jobApplicationsTable } from "@workspace/db";

const router: IRouter = Router();
const attempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TO_EMAIL =
  process.env.JOB_APPLICATION_TO_EMAIL ??
  process.env.BOOKING_TO_EMAIL ??
  "info@kholoudlab.com";
const FROM_EMAIL =
  process.env.JOB_APPLICATION_FROM_EMAIL ??
  process.env.BOOKING_FROM_EMAIL ??
  "info@kholoudlab.com";
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const current = attempts.get(clientKey);

  if (!current || current.resetAt <= now) {
    attempts.set(clientKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function isExpectedFileSignature(file: Buffer, fileType: string): boolean {
  if (fileType === "application/pdf") {
    return file.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return file[0] === 0x50 && file[1] === 0x4b;
  }

  return (
    file.length >= 8 &&
    file[0] === 0xd0 &&
    file[1] === 0xcf &&
    file[2] === 0x11 &&
    file[3] === 0xe0
  );
}

router.post("/job-applications", async (req, res): Promise<void> => {
  const parsed = CreateJobApplicationBody.safeParse(req.body);

  if (!parsed.success) {
    req.log.warn("Invalid job application request");
    res.status(400).json({ error: "يرجى التأكد من بيانات طلب التوظيف." });
    return;
  }

  const clientKey = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(clientKey)) {
    req.log.warn("Job application rate limit exceeded");
    res
      .status(429)
      .json({ error: "تم إرسال عدة طلبات. يرجى المحاولة لاحقًا." });
    return;
  }

  const {
    name,
    email,
    phone,
    position,
    coverLetter,
    fileName,
    fileType,
    fileData,
  } = parsed.data;
  const normalizedBase64 = fileData.replace(/\s/g, "");

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
    res.status(400).json({ error: "ملف السيرة الذاتية غير صالح." });
    return;
  }

  const attachment = Buffer.from(normalizedBase64, "base64");
  if (attachment.byteLength > MAX_FILE_BYTES) {
    res
      .status(413)
      .json({ error: "حجم السيرة الذاتية يجب ألا يتجاوز 5 ميجابايت." });
    return;
  }

  if (!isExpectedFileSignature(attachment, fileType)) {
    res
      .status(400)
      .json({ error: "نوع ملف السيرة الذاتية غير مطابق لمحتواه." });
    return;
  }

  const safeName = escapeHtml(name.trim());
  const safeEmail = escapeHtml(email.trim());
  const safePhone = escapeHtml(phone.trim());
  const safePosition = escapeHtml(position?.trim() || "طلب توظيف عام");
  const safeCoverLetter = escapeHtml(coverLetter?.trim() || "لا توجد رسالة إضافية.");
  const safeFileName = fileName
    .replace(/[^\p{L}\p{N}._ -]/gu, "_")
    .slice(0, 160);
  const subjectName = name.replace(/[\r\n]+/g, " ").trim();

  // Keep a record (with the CV) in the database; a DB failure must not block the email flow.
  let saved = false;
  try {
    await db.insert(jobApplicationsTable).values({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      position: position?.trim() ?? "",
      coverLetter: coverLetter?.trim() ?? "",
      fileName: safeFileName,
      fileType,
      fileSize: attachment.byteLength,
      fileData: attachment,
    });
    saved = true;
  } catch (dbError) {
    req.log.error({ err: dbError }, "Failed to save job application to database");
  }
  const savedMessage = {
    success: true,
    message:
      "تم استلام طلبك بنجاح، وسيقوم فريق التوظيف بمراجعته. سنتواصل معك عند توافق مؤهلاتك مع إحدى الفرص المتاحة.",
  };

  try {
    if (!resend) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const { error } = await resend.emails.send({
      from: `التوظيف - مختبر خلود <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      replyTo: email.trim(),
      subject: `طلب توظيف جديد - ${subjectName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #2f2530;">
          <h2 style="color: #a02060;">طلب توظيف جديد</h2>
          <p>تم إرسال طلب جديد من صفحة خدمات مختبر خلود.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px; border: 1px solid #eadde4; font-weight: bold;">الاسم</td><td style="padding: 10px; border: 1px solid #eadde4;">${safeName}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #eadde4; font-weight: bold;">البريد الإلكتروني</td><td style="padding: 10px; border: 1px solid #eadde4;">${safeEmail}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #eadde4; font-weight: bold;">رقم الجوال</td><td dir="ltr" style="padding: 10px; border: 1px solid #eadde4; text-align: right;">${safePhone}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #eadde4; font-weight: bold;">الوظيفة المطلوبة</td><td style="padding: 10px; border: 1px solid #eadde4;">${safePosition}</td></tr>
          </table>
          <h3 style="margin-top: 22px; color: #a02060;">رسالة المتقدم</h3>
          <p style="white-space: pre-wrap;">${safeCoverLetter}</p>
        </div>
      `,
      text: [
        "طلب توظيف جديد",
        `الاسم: ${name.trim()}`,
        `البريد الإلكتروني: ${email.trim()}`,
        `رقم الجوال: ${phone.trim()}`,
        `الوظيفة المطلوبة: ${position?.trim() || "طلب توظيف عام"}`,
        `الرسالة: ${coverLetter?.trim() || "لا توجد رسالة إضافية."}`,
      ].join("\n"),
      attachments: [
        {
          filename: safeFileName,
          content: attachment,
          contentType: fileType,
        },
      ],
    });

    if (error) {
      req.log.error({ resendError: error }, "Resend rejected job application");
      if (saved) {
        res.json(CreateJobApplicationResponse.parse(savedMessage));
        return;
      }
      res
        .status(502)
        .json({ error: "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى." });
      return;
    }

    req.log.info("Job application email sent");
    res.json(
      CreateJobApplicationResponse.parse({
        success: true,
        message:
          "تم استلام طلبك بنجاح، وسيقوم فريق التوظيف بمراجعته. سنتواصل معك عند توافق مؤهلاتك مع إحدى الفرص المتاحة.",
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to send job application email");
    if (saved) {
      res.json(CreateJobApplicationResponse.parse(savedMessage));
      return;
    }
    res
      .status(502)
      .json({ error: "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى." });
  }
});

export default router;