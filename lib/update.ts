export type UpdateManifest = { version: string; minimumNode?: string; releasedAt?: string; notes?: string[] };
export const currentVersion = "0.2.0";

function parts(version: string) { return version.replace(/^v/, "").split(".").map(value => Number.parseInt(value, 10) || 0); }
export function isNewerVersion(candidate: string, current = currentVersion) {
  const next = parts(candidate); const installed = parts(current);
  for (let index = 0; index < Math.max(next.length, installed.length); index += 1) {
    if ((next[index] ?? 0) > (installed[index] ?? 0)) return true;
    if ((next[index] ?? 0) < (installed[index] ?? 0)) return false;
  }
  return false;
}

export async function checkForUpdate(): Promise<{ state: "current" | "available" | "error"; message: string; manifest?: UpdateManifest }> {
  const url = process.env.WORKSPACE_UPDATE_MANIFEST_URL;
  if (!url) return { state: "error", message: "Update manifest URL is not configured." };
  try {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return { state: "error", message: `Manifest returned HTTP ${response.status}.` };
    const manifest = await response.json() as UpdateManifest;
    if (!manifest.version) return { state: "error", message: "Update manifest has no version." };
    return isNewerVersion(manifest.version) ? { state: "available", message: `Version ${manifest.version} is ready to deploy.`, manifest } : { state: "current", message: `Version ${currentVersion} is up to date.`, manifest };
  } catch { return { state: "error", message: "The update manifest could not be reached." }; }
}
