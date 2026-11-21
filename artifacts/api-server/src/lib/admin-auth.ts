import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

// Same signing scheme as the staff results portal (see routes/results.ts) so one
// admin login can also open /staff/results without a second login.
const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

type TokenKind = "admin" | "staff";
type TokenPayload = { kind: TokenKind; expiresAt: number; staffId: string };

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET must be set");
  return value;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret()).update(`lab-results:${encodedPayload}`).digest("base64url");
}

export function equalSecrets(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function createToken(payload: TokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function readToken(token: string | null, kind: TokenKind): TokenPayload | null {
  if (!token) return null;
  const [encoded, signature, ...extra] = token.split(".");
  if (!encoded || !signature || extra.length > 0) return null;
  if (!equalSecrets(signature, sign(encoded))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<TokenPayload>;
    if (
      payload.kind !== kind ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now() ||
      typeof payload.staffId !== "string" ||
      payload.staffId.length < 2
    ) {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

/** LAB_ADMIN_ACCOUNTS is JSON: {"adminId":"accessCode"} (code >= 8 chars). */
export function getAdminAccessCode(adminId: string): string | null {
  const configured = process.env.LAB_ADMIN_ACCOUNTS;
  if (!configured) return null;
  try {
    const accounts = JSON.parse(configured) as Record<string, unknown>;
    const code = accounts[adminId];
    return typeof code === "string" && code.length >= 8 ? code : null;
  } catch {
    return null;
  }
}

export function createAdminSession(adminId: string) {
  const expiresAt = Date.now() + ADMIN_TOKEN_TTL_MS;
  return {
    sessionToken: createToken({ kind: "admin", staffId: adminId, expiresAt }),
    // Lets the admin open the existing /staff/results page already signed in.
    staffToken: createToken({ kind: "staff", staffId: `admin:${adminId}`, expiresAt }),
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = readToken(getBearerToken(req), "admin");
  if (!session) {
    res.status(401).json({ error: "Admin authentication is required" });
    return;
  }
  res.locals.adminId = session.staffId;
  next();
}
