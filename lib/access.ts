import { createHash, randomBytes } from "node:crypto";

export function createAccessToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashAccessToken(token) };
}

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
