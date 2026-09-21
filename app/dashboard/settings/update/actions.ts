"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkForUpdate } from "@/lib/update";

export async function requestDeployment() {
  const check = await checkForUpdate();
  if (check.state !== "available" || !check.manifest) return;
  const hook = process.env.WORKSPACE_DEPLOY_HOOK_URL;
  if (!hook) {
    await prisma.systemSetting.upsert({ where: { key: "cms.update" }, create: { key: "cms.update", value: { state: "error", message: "Deployment hook is not configured.", updatedAt: new Date().toISOString() } }, update: { value: { state: "error", message: "Deployment hook is not configured.", updatedAt: new Date().toISOString() } } });
    revalidatePath("/dashboard/settings/update"); return;
  }
  const response = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ version: check.manifest.version, source: "necrotix-workspace" }), cache: "no-store" });
  const state = response.ok ? "deploying" : "error";
  const message = response.ok ? `Deployment for ${check.manifest.version} was requested.` : `Deployment hook returned HTTP ${response.status}.`;
  await prisma.systemSetting.upsert({ where: { key: "cms.update" }, create: { key: "cms.update", value: { state, message, targetVersion: check.manifest.version, updatedAt: new Date().toISOString() } }, update: { value: { state, message, targetVersion: check.manifest.version, updatedAt: new Date().toISOString() } } });
  revalidatePath("/dashboard/settings/update");
}
