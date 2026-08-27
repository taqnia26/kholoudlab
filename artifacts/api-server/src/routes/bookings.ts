import { Router, type IRouter } from "express";
import { Resend } from "resend";
import {
  CreateBookingBody,
  CreateBookingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const bookingAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const BOOKING_TO_EMAIL =
  process.env.BOOKING_TO_EMAIL ?? "info@kholoudlab.com";
const BOOKING_FROM_EMAIL =
  process.env.BOOKING_FROM_EMAIL ?? "info@kholoudlab.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasExceededRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const current = bookingAttempts.get(clientKey);

  if (!current || current.resetAt <= now) {
    bookingAttempts.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

router.post("/bookings", async (req, res): Promise<void> => {
  const normalizedBody =
    req.body && typeof req.body === "object"
      ? {
          ...req.body,
          name:
            typeof req.body.name === "string" ? req.body.name.trim() : req.body.name,
          phone:
            typeof req.body.phone === "string"
              ? req.body.phone.trim()
              : req.body.phone,
          testType:
            typeof req.body.testType === "string"
              ? req.body.testType.trim()
              : req.body.testType,
        }
      : req.body;
  const parsed = CreateBookingBody.safeParse(normalizedBody);

  if (!parsed.success) {
    req.log.warn("Invalid booking request");
    res.status(400).json({ error: "يرجى التأكد من بيانات الحجز المدخلة." });
    return;
  }

  const { name, phone, testType, website } = parsed.data;

  // A filled hidden field indicates an automated spam submission.
  if (website) {
    res.json(
      CreateBookingResponse.parse({
        success: true,
        message: "تم استلام طلبك وسنتواصل معك قريبًا.",
      }),
    );
    return;
  }

  const clientKey = req.ip || req.socket.remoteAddress || "unknown";
  if (hasExceededRateLimit(clientKey)) {
    req.log.warn("Booking request rate limit exceeded");
    res
      .status(429)
      .json({ error: "تم إرسال عدة طلبات. يرجى المحاولة بعد بضع دقائق." });
    return;
  }

  const safeName = escapeHtml(name.trim());
  const safePhone = escapeHtml(phone.trim());
  const safeTestType = escapeHtml(testType.trim());

  const emailSubjectName = name.replace(/[\r\n]+/g, " ").trim();

  try {
    if (!resend) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const { error: resendError } = await resend.emails.send({
      from: `موقع مختبر خلود <${BOOKING_FROM_EMAIL}>`,
      to: [BOOKING_TO_EMAIL],
      subject: `طلب حجز موعد جديد - ${emailSubjectName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #2f2530;">
          <h2 style="color: #a02060;">طلب حجز موعد جديد</h2>
          <p>تم إرسال طلب جديد من نموذج موقع مختبر خلود.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #eadde4; font-weight: bold;">الاسم الكامل</td>
              <td style="padding: 10px; border: 1px solid #eadde4;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eadde4; font-weight: bold;">رقم الجوال</td>
              <td dir="ltr" style="padding: 10px; border: 1px solid #eadde4; text-align: right;">${safePhone}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #eadde4; font-weight: bold;">نوع الفحص</td>
              <td style="padding: 10px; border: 1px solid #eadde4;">${safeTestType}</td>
            </tr>
          </table>
        </div>
      `,
      text: [
        "طلب حجز موعد جديد",
        `الاسم الكامل: ${name.trim()}`,
        `رقم الجوال: ${phone.trim()}`,
        `نوع الفحص: ${testType.trim()}`,
      ].join("\n"),
    });

    if (resendError) {
      req.log.error(
        { resendError },
        "Resend rejected booking email",
      );
      res
        .status(502)
        .json({ error: "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى." });
      return;
    }

    req.log.info("Booking request email sent");
    res.json(
      CreateBookingResponse.parse({
        success: true,
        message: "تم إرسال طلبك بنجاح، وسيتواصل معك فريقنا قريبًا.",
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Failed to send booking request email");
    res
      .status(502)
      .json({ error: "تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى." });
  }
});

export default router;