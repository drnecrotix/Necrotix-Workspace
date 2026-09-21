import assert from "node:assert/strict";
import test from "node:test";
import { signPayload, verifyHandoff } from "../lib/handoff.ts";

const secret = "a-secure-test-secret-that-is-over-32-characters";
const rawBody = JSON.stringify({ example: true });
const now = new Date("2026-09-21T12:00:00.000Z");
const timestamp = String(now.getTime() / 1000);

test("accepts a fresh matching signature", () => {
  assert.deepEqual(verifyHandoff({ rawBody, timestamp, signature:signPayload(rawBody,timestamp,secret), secret, now }), { ok:true });
});

test("rejects a changed payload", () => {
  assert.equal(verifyHandoff({ rawBody:"changed", timestamp, signature:signPayload(rawBody,timestamp,secret), secret, now }).reason, "invalid_signature");
});

test("rejects an expired timestamp", () => {
  const oldTimestamp = String((now.getTime()-301_000)/1000);
  assert.equal(verifyHandoff({ rawBody, timestamp:oldTimestamp, signature:signPayload(rawBody,oldTimestamp,secret), secret, now }).reason, "expired");
});
