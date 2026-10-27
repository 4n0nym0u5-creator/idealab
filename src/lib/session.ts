import { cookies, headers } from "next/headers";
import { adminCookieName, adminToken, passwordMatches, tokenMatches, type WriteMode } from "./access";

const MONTH = 60 * 60 * 24 * 30;

async function cookieSecure() {
  if (process.env.VERCEL) return true;
  const headerList = await headers();
  return headerList.get("x-forwarded-proto") === "https";
}

export async function writeMode(): Promise<WriteMode> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) return "open";
    return "unconfigured";
  }
  const jar = await cookies();
  const token = jar.get(adminCookieName())?.value;
  if (token && tokenMatches(token, password)) return "unlocked";
  return "locked";
}

export async function assertCanWrite(): Promise<void> {
  const mode = await writeMode();
  if (mode === "open" || mode === "unlocked") return;
  if (mode === "unconfigured") {
    throw new Error("Editing is locked. Set ADMIN_PASSWORD on the deployment, then unlock from the header.");
  }
  throw new Error("Editing is locked. Enter the admin password in the header.");
}

export async function unlockSession(password: string): Promise<void> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set on this deployment.");
  if (!passwordMatches(password, expected)) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    throw new Error("That password does not match.");
  }
  const jar = await cookies();
  jar.set(adminCookieName(), adminToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieSecure(),
    path: "/",
    maxAge: MONTH,
  });
}

export async function lockSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(adminCookieName());
}
