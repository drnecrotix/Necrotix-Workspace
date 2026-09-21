import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const HANDOFF_MAX_AGE_SECONDS = 300;

export const handoffSchema = z.object({
  version: z.literal(1),
  serviceRequestId: z.string().min(1).max(128),
  reference: z.string().min(1).max(64),
  nonce: z.string().min(16).max(128),
  issuedAt: z.string().datetime(),
  client: z.object({
    name: z.string().min(1).max(160),
    email: z.string().email().max(320),
    company: z.string().max(160).nullish(),
    phone: z.string().max(64).nullish(),
  }),
  project: z.object({
    title: z.string().min(1).max(200),
    category: z.string().max(100).nullish(),
    description: z.string().max(10_000).nullish(),
    selectedServices: z.array(z.object({
      id: z.string().max(128),
      name: z.string().min(1).max(200),
      quantity: z.number().int().positive().max(100).default(1),
      options: z.record(z.string(), z.unknown()).optional(),
    })).min(1).max(50),
    requirements: z.record(z.string(), z.unknown()).optional(),
    budget: z.number().nonnegative().max(10_000_000).nullish(),
    currency: z.string().length(3).default("EUR"),
    sourceUrl: z.string().url().nullish(),
  }),
});

export type HandoffPayload = z.infer<typeof handoffSchema>;

export function payloadHash(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function signPayload(rawBody: string, timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export function verifyHandoff(input: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  now?: Date;
}) {
  if (!input.timestamp || !input.signature) return { ok: false as const, reason: "missing_signature" };
  const timestampMs = Number(input.timestamp) * 1000;
  if (!Number.isFinite(timestampMs)) return { ok: false as const, reason: "invalid_timestamp" };

  const age = Math.abs((input.now ?? new Date()).getTime() - timestampMs) / 1000;
  if (age > HANDOFF_MAX_AGE_SECONDS) return { ok: false as const, reason: "expired" };

  const expected = signPayload(input.rawBody, input.timestamp, input.secret);
  const actualBuffer = Buffer.from(input.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return { ok: false as const, reason: "invalid_signature" };
  }
  return { ok: true as const };
}
