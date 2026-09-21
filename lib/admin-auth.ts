import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_VALUE = "necrotix-workspace-admin-v1";

export function adminCookie(secret: string) {
  return `${COOKIE_VALUE}.${createHmac("sha256", secret).update(COOKIE_VALUE).digest("hex")}`;
}

export function verifyAdminCookie(value: string | undefined, secret: string) {
  if (!value || secret.length < 24) return false;
  const expected = Buffer.from(adminCookie(secret));
  const actual = Buffer.from(value);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
