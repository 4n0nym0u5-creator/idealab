import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type WriteMode = "open" | "locked" | "unlocked" | "unconfigured";

const COOKIE = "idealab_admin";

export function adminCookieName() {
  return COOKIE;
}

export function passwordMatches(given: string, expected: string) {
  const left = createHash("sha256").update(given).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function adminToken(password: string) {
  return createHmac("sha256", password).update("idealab-admin-v1").digest("base64url");
}

export function tokenMatches(given: string, password: string) {
  const expected = adminToken(password);
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
