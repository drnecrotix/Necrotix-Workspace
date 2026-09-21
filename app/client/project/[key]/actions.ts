"use server";

import { revalidatePath } from "next/cache";
import { hashAccessToken } from "@/lib/access";
import { prisma } from "@/lib/prisma";

async function authorizedProject(key: string, token: string) {
  if (!key || !token) return null;
  return prisma.project.findFirst({ where: { key, accessTokens: { some: { tokenHash: hashAccessToken(token), revokedAt: null, expiresAt: { gt: new Date() } } } }, select: { id: true, client: { select: { name: true } } } });
}

export async function completeClientAction(formData: FormData) {
  const key = String(formData.get("key") ?? ""); const token = String(formData.get("token") ?? ""); const actionId = String(formData.get("actionId") ?? "");
  const project = await authorizedProject(key, token); if (!project || !actionId) return;
  const action = await prisma.clientAction.findFirst({ where: { id: actionId, projectId: project.id, status: "OPEN" } }); if (!action) return;
  await prisma.$transaction([prisma.clientAction.update({ where: { id: action.id }, data: { status: "COMPLETED", completedAt: new Date() } }), prisma.projectEvent.create({ data: { projectId: project.id, type: "CLIENT_ACTION_COMPLETED", message: `Client completed: ${action.title}` } })]);
  revalidatePath(`/client/project/${key}`); revalidatePath("/dashboard"); revalidatePath(`/dashboard/projects/${project.id}`);
}

export async function addClientComment(formData: FormData) {
  const key = String(formData.get("key") ?? ""); const token = String(formData.get("token") ?? ""); const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const project = await authorizedProject(key, token); if (!project || !body) return;
  await prisma.$transaction([prisma.comment.create({ data: { projectId: project.id, authorName: project.client.name, body, visibleToClient: true } }), prisma.projectEvent.create({ data: { projectId: project.id, type: "CLIENT_COMMENT", message: "Client added a comment" } })]);
  revalidatePath(`/client/project/${key}`); revalidatePath(`/dashboard/projects/${project.id}`);
}
