import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import {
  CompleteResultVerificationBody,
  CompleteResultVerificationResponse,
  CreateStaffSessionBody,
  CreateStaffSessionResponse,
  GetVerifiedResultResponse,
  ListStaffResultsResponse,
  StartResultVerificationBody,
  StartResultVerificationResponse,
  UpdateResultStatusBody,
  UpdateResultStatusParams,
  UpdateResultStatusResponse,
} from "@workspace/api-zod";
import {
  analysisReportsTable,
  db,
  resultStatusAuditTable,
  resultVerificationChallengesTable,
  type AnalysisReport,
} from "@workspace/db";

const router: IRouter = Router();

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const PATIENT_TOKEN_TTL_MS = 15 * 60 * 1000;
const STAFF_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_STARTS_PER_WINDOW = 5;

type ResultStatus = "pending" | "ready" | "unavailable";

type SignedTokenKind = "patient" | "staff";

type SignedTokenPayload = {
  kind: SignedTokenKind;
  expiresAt: number;
  reportId?: number;
  staffId?: string;
};

const startAttempts = new Map<string, number[]>();

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function normalizeAnalysisNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isResultStatus(value: string): value is ResultStatus {
  return value === "pending" || value === "ready" || value === "unavailable";
}

function hashVerificationCode(code: string): string {
  const pepper = process.env.SESSION_SECRET;
  if (!pepper) {
    throw new Error("SESSION_SECRET must be set for result verification");
  }

  return createHmac("sha256", pepper).update(code).digest("hex");
}

function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function signTokenPayload(encodedPayload: string): string {
  const pepper = process.env.SESSION_SECRET;
  if (!pepper) {
    throw new Error("SESSION_SECRET must be set for result verification");
  }

  return createHmac("sha256", pepper)
    .update(`lab-results:${encodedPayload}`)
    .digest("base64url");
}

function createSignedToken(payload: SignedTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signTokenPayload(encodedPayload)}`;
}

function readSignedToken(
  token: string | null,
  expectedKind: SignedTokenKind,
): SignedTokenPayload | null {
  if (!token) return null;

  const [encodedPayload, signature, ...extra] = token.split(".");
  if (!encodedPayload || !signature || extra.length > 0) return null;
  if (!equalSecrets(signature, signTokenPayload(encodedPayload))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<SignedTokenPayload>;
    if (
      payload.kind !== expectedKind ||
      typeof payload.expiresAt !== "number" ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    if (expectedKind === "patient" && (
      typeof payload.reportId !== "number" || !Number.isInteger(payload.reportId)
    )) {
      return null;
    }

    if (expectedKind === "staff" && (
      typeof payload.staffId !== "string" || payload.staffId.length < 2
    )) {
      return null;
    }

    return payload as SignedTokenPayload;
  } catch {
    return null;
  }
}

function getBearerToken(req: Request): string | null {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function canStartChallenge(req: Request): boolean {
  const key = req.ip || "unknown";
  const now = Date.now();
  const recent = (startAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recent.length >= MAX_STARTS_PER_WINDOW) {
    startAttempts.set(key, recent);
    return false;
  }

  recent.push(now);
  startAttempts.set(key, recent);
  return true;
}

function equalSecrets(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function toStaffResult(report: AnalysisReport) {
  return {
    id: report.id,
    analysisNumber: report.analysisNumber,
    patientName: report.patientName,
    sampleDate: report.sampleDate,
    status: report.status,
    updatedAt: report.updatedAt,
    canMarkReady: report.resultValues.length > 0,
  };
}

function getStaffAccessCode(staffId: string): string | null {
  const configuredAccounts = process.env.LAB_STAFF_ACCOUNTS;
  if (configuredAccounts) {
    try {
      const accounts = JSON.parse(configuredAccounts) as Record<string, unknown>;
      const accessCode = accounts[staffId];
      return typeof accessCode === "string" && accessCode.length >= 6
        ? accessCode
        : null;
    } catch {
      return null;
    }
  }

  if (isDevelopment() && staffId === "lab-demo") {
    return "KHOLOUD-STAFF";
  }

  return null;
}

router.post("/results/verification/start", async (req, res): Promise<void> => {
  const parsed = StartResultVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn("Rejected invalid result verification request");
    res.status(400).json({ error: "Invalid verification details" });
    return;
  }

  if (!canStartChallenge(req)) {
    req.log.warn("Rate limit reached for result verification");
    res.status(429).json({ error: "Please wait before trying again" });
    return;
  }

  const { analysisNumber, dateOfBirth, phoneLast4 } = parsed.data;
  const [report] = await db
    .select()
    .from(analysisReportsTable)
    .where(
      and(
        eq(analysisReportsTable.analysisNumber, normalizeAnalysisNumber(analysisNumber)),
        eq(analysisReportsTable.dateOfBirth, toDateOnly(dateOfBirth)),
        eq(analysisReportsTable.phoneLast4, phoneLast4),
      ),
    )
    .limit(1);

  const challengeId = randomBytes(32).toString("base64url");
  await db.insert(resultVerificationChallengesTable).values({
    tokenHash: hashOpaqueToken(challengeId),
    reportId: report?.id ?? null,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
  const demoCode = isDevelopment() ? "2026" : null;

  req.log.info("Started result verification challenge");
  res.status(202).json(
    StartResultVerificationResponse.parse({
      challengeId,
      maskedPhone: "•••• ••••",
      expiresInSeconds: CHALLENGE_TTL_MS / 1000,
      demoCode,
    }),
  );
});

router.post("/results/verification/complete", async (req, res): Promise<void> => {
  const parsed = CompleteResultVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn("Rejected invalid verification completion request");
    res.status(401).json({ error: "Verification could not be completed" });
    return;
  }

  const now = new Date();
  const [challenge] = await db
    .update(resultVerificationChallengesTable)
    .set({ usedAt: now })
    .where(
      and(
        eq(resultVerificationChallengesTable.tokenHash, hashOpaqueToken(parsed.data.challengeId)),
        isNull(resultVerificationChallengesTable.usedAt),
        gt(resultVerificationChallengesTable.expiresAt, now),
      ),
    )
    .returning();

  if (
    !challenge ||
    typeof challenge.reportId !== "number"
  ) {
    req.log.warn("Result verification was not completed");
    res.status(401).json({ error: "Verification could not be completed" });
    return;
  }

  const [report] = await db
    .select()
    .from(analysisReportsTable)
    .where(eq(analysisReportsTable.id, challenge.reportId))
    .limit(1);

  if (
    !report ||
    !isResultStatus(report.status) ||
    !equalSecrets(report.verificationCodeHash, hashVerificationCode(parsed.data.code))
  ) {
    req.log.warn("Verified report was unavailable");
    res.status(401).json({ error: "Verification could not be completed" });
    return;
  }

  if (report.status !== "ready") {
    req.log.info("Verified a report that is not ready");
    res.json(
      CompleteResultVerificationResponse.parse({
        status: report.status,
        accessToken: null,
        expiresAt: null,
      }),
    );
    return;
  }

  const accessToken = createSignedToken({
    kind: "patient",
    reportId: report.id,
    expiresAt: Date.now() + PATIENT_TOKEN_TTL_MS,
  });
  const expiresAt = new Date(Date.now() + PATIENT_TOKEN_TTL_MS);

  req.log.info("Completed result verification");
  res.json(
    CompleteResultVerificationResponse.parse({
      status: "ready",
      accessToken,
      expiresAt,
    }),
  );
});

router.get("/results/me", async (req, res): Promise<void> => {
  const access = readSignedToken(getBearerToken(req), "patient");
  if (!access || typeof access.reportId !== "number") {
    res.status(401).json({ error: "Verification is required to view this report" });
    return;
  }

  const [report] = await db
    .select()
    .from(analysisReportsTable)
    .where(eq(analysisReportsTable.id, access.reportId))
    .limit(1);

  if (!report || report.status !== "ready") {
    res.status(404).json({ error: "Report is not available" });
    return;
  }

  res.json(
    GetVerifiedResultResponse.parse({
      analysisNumber: report.analysisNumber,
      patientName: report.patientName,
      sampleDate: report.sampleDate,
      approvedAt: report.approvedAt,
      results: report.resultValues,
    }),
  );
});

router.post("/staff/session", async (req, res): Promise<void> => {
  const parsed = CreateStaffSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Invalid staff access code" });
    return;
  }

  const staffAccessCode = getStaffAccessCode(parsed.data.staffId);

  if (!staffAccessCode || !equalSecrets(staffAccessCode, parsed.data.accessCode)) {
    req.log.warn("Rejected staff session request");
    res.status(401).json({ error: "Invalid staff access code" });
    return;
  }

  const sessionToken = createSignedToken({
    kind: "staff",
    staffId: parsed.data.staffId,
    expiresAt: Date.now() + STAFF_TOKEN_TTL_MS,
  });
  const expiresAt = new Date(Date.now() + STAFF_TOKEN_TTL_MS);

  req.log.info("Created staff session");
  res.json(CreateStaffSessionResponse.parse({ sessionToken, expiresAt }));
});

router.get("/staff/results", async (req, res): Promise<void> => {
  if (!readSignedToken(getBearerToken(req), "staff")) {
    res.status(401).json({ error: "Staff authentication is required" });
    return;
  }

  const reports = await db
    .select()
    .from(analysisReportsTable)
    .orderBy(asc(analysisReportsTable.id));

  res.json(ListStaffResultsResponse.parse(reports.map(toStaffResult)));
});

router.patch("/staff/results/:id/status", async (req, res): Promise<void> => {
  const staffSession = readSignedToken(getBearerToken(req), "staff");
  if (!staffSession || typeof staffSession.staffId !== "string") {
    res.status(401).json({ error: "Staff authentication is required" });
    return;
  }
  const staffId = staffSession.staffId;

  const params = UpdateResultStatusParams.safeParse(req.params);
  const body = UpdateResultStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid report status" });
    return;
  }

  const [existingReport] = await db
    .select()
    .from(analysisReportsTable)
    .where(eq(analysisReportsTable.id, params.data.id))
    .limit(1);

  if (!existingReport) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  if (body.data.status === "ready" && existingReport.resultValues.length === 0) {
    res.status(400).json({ error: "A report without result values cannot be approved" });
    return;
  }

  const approvedAt = body.data.status === "ready" ? new Date() : null;
  const updatedReport = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(analysisReportsTable)
      .set({
        status: body.data.status,
        approvedAt,
        approvedBy: body.data.status === "ready" ? staffId : null,
      })
      .where(eq(analysisReportsTable.id, params.data.id))
      .returning();

    if (!updated) {
      throw new Error("Report disappeared during status update");
    }

    await tx.insert(resultStatusAuditTable).values({
      reportId: updated.id,
      staffId,
      previousStatus: existingReport.status,
      nextStatus: body.data.status,
    });
    return updated;
  });

  req.log.info({ status: body.data.status, staffId }, "Updated report status");
  res.json(UpdateResultStatusResponse.parse(toStaffResult(updatedReport)));
});

export default router;