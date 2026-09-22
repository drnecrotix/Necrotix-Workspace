import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { hashAccessToken } from "@/lib/access";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { readLocalFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id }, include: { project: { select: { key: true } } } });
  if (!attachment) return new Response("Not found", { status: 404 });
  const admin = verifyAdminCookie((await cookies()).get("nw-admin")?.value, process.env.ADMIN_ACCESS_KEY ?? "");
  const token = request.nextUrl.searchParams.get("token") ?? ""; const key = request.nextUrl.searchParams.get("key") ?? "";
  const client = attachment.visibleToClient && key === attachment.project.key && !!token && !!(await prisma.clientAccessToken.findFirst({ where: { projectId: attachment.projectId, tokenHash: hashAccessToken(token), revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } }));
  if (!admin && !client) return new Response("Not found", { status: 404 });
  try { const bytes = await readLocalFile(attachment.storageKey, attachment.version); return new Response(bytes, { headers: { "content-type": attachment.mimeType, "content-length": String(bytes.length), "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } }); }
  catch { return new Response("File unavailable", { status: 404 }); }
}
