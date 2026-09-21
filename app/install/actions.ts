"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { INSTALLATION_KEY, isInstalled } from "@/lib/installation";
import { prisma } from "@/lib/prisma";

function matchesSecret(value: string, expected: string) {
  const left = createHash("sha256").update(value).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

const templates = [
  { slug: "website", name: "Website delivery", category: "Web", description: "Discovery, design, build, review and launch.", tasks: ["Discovery and scope", "Information architecture", "UI design", "Development", "Quality review", "Launch"] },
  { slug: "redesign", name: "Website redesign", category: "Web", description: "Audit and rebuild an existing experience.", tasks: ["Current-site audit", "Content inventory", "Visual direction", "Responsive rebuild", "Migration and launch"] },
  { slug: "security-audit", name: "Security audit", category: "Security", description: "Review, remediation and verification.", tasks: ["Asset discovery", "Configuration review", "Vulnerability analysis", "Remediation plan", "Verification"] },
  { slug: "engineering-cnc", name: "Engineering / CNC", category: "Engineering", description: "CAD preparation, toolpath planning and delivery.", tasks: ["Technical brief", "Drawing preparation", "Toolpath planning", "Simulation and checks", "Production package"] },
] as const;

export async function installCms(formData: FormData) {
  if (await isInstalled()) redirect("/login");
  const configuredToken = process.env.INSTALL_TOKEN ?? "";
  const submittedToken = String(formData.get("installToken") ?? "");
  const siteName = String(formData.get("siteName") ?? "Necrotix Workspace").trim().slice(0, 100);
  if (configuredToken.length < 32 || !matchesSecret(submittedToken, configuredToken)) redirect("/install?error=invalid" as never);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.systemSetting.findUnique({ where: { key: INSTALLATION_KEY } });
    if (existing) return;
    for (const template of templates) {
      await tx.projectTemplate.upsert({
        where: { slug: template.slug },
        create: { slug: template.slug, name: template.name, category: template.category, description: template.description, tasks: { create: template.tasks.map((title, sortOrder) => ({ title, sortOrder })) } },
        update: { active: true },
      });
    }
    await tx.systemSetting.create({ data: { key: INSTALLATION_KEY, value: { siteName: siteName || "Necrotix Workspace", installedAt: new Date().toISOString(), version: process.env.npm_package_version ?? "0.2.0" } as Prisma.InputJsonValue } });
  });
  redirect("/login?installed=1");
}
