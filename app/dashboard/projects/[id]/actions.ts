"use server";

import { revalidatePath } from "next/cache";
import { ChangeRequestStatus, TaskStatus } from "@prisma/client";
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

export async function moveTaskToStatus(projectId: string, taskId: string, status: TaskStatus) {
  if (!taskStatuses.has(status)) return;
  const data = new FormData(); data.set("projectId", projectId); data.set("taskId", taskId); data.set("status", status);
  await moveTask(data);
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

export async function applyProjectTemplate(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? ""); const templateId = String(formData.get("templateId") ?? "");
  const template = await prisma.projectTemplate.findFirst({ where: { id: templateId, active: true }, include: { tasks: { orderBy: { sortOrder: "asc" } } } });
  if (!projectId || !template) return;
  const offset = await prisma.task.count({ where: { projectId } });
  await prisma.$transaction([...template.tasks.map((task, index) => prisma.task.create({ data: { projectId, title: task.title, description: task.description, visibleToClient: task.visibleToClient, sortOrder: offset + index } })), prisma.projectEvent.create({ data: { projectId, type: "TEMPLATE_APPLIED", message: `Template applied: ${template.name}` } })]);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

const changeStatuses = new Set(Object.values(ChangeRequestStatus));
export async function reviewChangeRequest(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? ""); const requestId = String(formData.get("requestId") ?? ""); const status = String(formData.get("status") ?? "") as ChangeRequestStatus;
  const response = String(formData.get("response") ?? "").trim().slice(0, 3000); const amountText = String(formData.get("amount") ?? ""); const daysText = String(formData.get("days") ?? "");
  if (!projectId || !requestId || !changeStatuses.has(status)) return;
  const request = await prisma.changeRequest.findFirst({ where: { id: requestId, projectId } }); if (!request) return;
  const amount = amountText ? Number(amountText) : null; const days = daysText ? Number.parseInt(daysText, 10) : null;
  await prisma.$transaction([prisma.changeRequest.update({ where: { id: requestId }, data: { status, adminResponse: response || null, estimatedAmount: Number.isFinite(amount) ? amount : null, estimatedDays: Number.isFinite(days) ? days : null } }), prisma.projectEvent.create({ data: { projectId, type: "CHANGE_REQUEST_UPDATED", message: `Change request ${request.title} is now ${status.replaceAll("_", " ")}` } })]);
  revalidatePath(`/dashboard/projects/${projectId}`);
}
