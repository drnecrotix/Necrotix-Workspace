"use server";

import { revalidatePath } from "next/cache";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const taskStatuses = new Set(Object.values(TaskStatus));

export async function moveTask(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "") as TaskStatus;
  if (!taskId || !projectId || !taskStatuses.has(status)) return;
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task || task.status === status) return;
  await prisma.$transaction([prisma.task.update({ where: { id: taskId }, data: { status } }), prisma.projectEvent.create({ data: { projectId, type: "TASK_MOVED", message: `${task.title} moved to ${status.replaceAll("_", " ")}` } })]);
  revalidatePath(`/dashboard/projects/${projectId}`); revalidatePath("/dashboard");
}

export async function createMilestone(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (!projectId || !title) return;
  await prisma.$transaction([prisma.milestone.create({ data: { projectId, title } }), prisma.projectEvent.create({ data: { projectId, type: "MILESTONE_CREATED", message: `Milestone created: ${title}` } })]);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function createClientAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 180);
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  if (!projectId || !title) return;
  await prisma.$transaction([prisma.clientAction.create({ data: { projectId, title, description: description || null } }), prisma.projectEvent.create({ data: { projectId, type: "CLIENT_ACTION_CREATED", message: `Client action requested: ${title}` } })]);
  revalidatePath(`/dashboard/projects/${projectId}`); revalidatePath("/dashboard");
}

export async function createComment(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const visibleToClient = formData.get("visibleToClient") === "on";
  if (!projectId || !body) return;
  await prisma.$transaction([prisma.comment.create({ data: { projectId, authorName: "NecrotixLab", body, visibleToClient } }), prisma.projectEvent.create({ data: { projectId, type: "COMMENT_CREATED", message: visibleToClient ? "A client-visible comment was added" : "An internal note was added" } })]);
  revalidatePath(`/dashboard/projects/${projectId}`);
}
