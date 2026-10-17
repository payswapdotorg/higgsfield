/**
 * Minimal HS256 JWT (Clerk-style session token shape per §1d: `workspace_id` + `sub` claims).
 * Local dev fixture only — the signing secret is a fixed local constant, not a real credential.
 */
import crypto from "node:crypto";

const SECRET = process.env.HF_AUTH_SECRET ?? "hf-studio-local-dev-secret";

export interface SessionClaims {
  sub: string;
  workspace_id: string;
  iat: number;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
}

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function signSession(sub: string, workspaceId: string): string {
  const now = Math.floor(Date.now() / 1000); // token bookkeeping only — never influences generation outputs
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({ sub, workspace_id: workspaceId, iat: now, exp: now + SESSION_TTL_SECONDS })
  );
  const signingInput = `${header}.${payload}`;
  return `${signingInput}.${sign(signingInput)}`;
}

export function verifySession(token: string): SessionClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(fromB64url(payload).toString("utf8")) as SessionClaims;
    if (typeof claims.sub !== "string") return null;
    if (typeof claims.exp === "number" && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}
