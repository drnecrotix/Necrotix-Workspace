import { prisma } from "@/lib/prisma";

export const INSTALLATION_KEY = "cms.installation";

export async function getInstallation() {
  return prisma.systemSetting.findUnique({ where: { key: INSTALLATION_KEY } });
}

export async function isInstalled() {
  return Boolean(await getInstallation());
}
