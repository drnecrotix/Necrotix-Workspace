import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createAccessToken } from "@/lib/access";
import { handoffSchema, payloadHash, verifyHandoff } from "@/lib/handoff";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function projectKey(reference: string) {
  return reference.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export async function POST(request: Request) {
  const secret = process.env.NECROTIX_HANDOFF_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "Integration is not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const verification = verifyHandoff({
    rawBody,
    timestamp: request.headers.get("x-necrotix-timestamp"),
    signature: request.headers.get("x-necrotix-signature"),
    secret,
  });
  if (!verification.ok) return NextResponse.json({ error: verification.reason }, { status: 401 });

  let json: unknown;
  try { json = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = handoffSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 });
  }

  const payload = parsed.data;
  const existing = await prisma.project.findUnique({ where: { externalServiceRequestId: payload.serviceRequestId } });
  if (existing) {
    return NextResponse.json({ projectId: existing.id, projectKey: existing.key, duplicate: true });
  }

  const token = createAccessToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const project = await prisma.$transaction(async (tx) => {
    await tx.integrationReceipt.create({ data: {
      nonce: payload.nonce,
      serviceRequestId: payload.serviceRequestId,
      payloadHash: payloadHash(rawBody),
      expiresAt: new Date(new Date(payload.issuedAt).getTime() + 10 * 60 * 1000),
    }});
    const client = await tx.client.upsert({
      where: { email: payload.client.email.toLowerCase() },
      create: { ...payload.client, email: payload.client.email.toLowerCase() },
      update: { name: payload.client.name, company: payload.client.company, phone: payload.client.phone },
    });
    return tx.project.create({ data: {
      key: projectKey(`${payload.reference}-${payload.nonce.slice(0, 6)}`),
      externalServiceRequestId: payload.serviceRequestId,
      reference: payload.reference,
      clientId: client.id,
      title: payload.project.title,
      category: payload.project.category,
      description: payload.project.description,
      selectedServices: payload.project.selectedServices as Prisma.InputJsonValue,
      requirements: payload.project.requirements as Prisma.InputJsonValue | undefined,
      budget: payload.project.budget,
      currency: payload.project.currency.toUpperCase(),
      sourceUrl: payload.project.sourceUrl,
      tasks: { create: payload.project.selectedServices.map((service, index) => ({
        title: service.name,
        sortOrder: index,
        description: `Imported from NecrotixLab service request ${payload.reference}`,
      })) },
      milestones: { create: { title: "Project setup", status: "ACTIVE", sortOrder: 0 } },
      clientActions: { create: { title: "Review the imported project scope", description: "Confirm that the selected services and project requirements are correct." } },
      accessTokens: { create: { tokenHash: token.hash, expiresAt } },
      events: { create: { type: "HANDOFF_RECEIVED", message: "Project created from NecrotixLab Services" } },
    }});
  });

  const baseUrl = process.env.WORKSPACE_BASE_URL ?? new URL(request.url).origin;
  return NextResponse.json({
    projectId: project.id,
    projectKey: project.key,
    clientPortalUrl: `${baseUrl}/client/project/${project.key}?token=${token.token}`,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 });
}
