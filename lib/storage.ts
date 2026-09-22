import { createHash, randomUUID } from "node:crypto";
import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export type StoredFile = { checksum: string; mimeType: string; sizeBytes: number; storageKey: string; version: number };

export function storageLimitBytes() {
  const configured = Number.parseInt(process.env.WORKSPACE_MAX_FILE_BYTES ?? "", 10);
  return Number.isSafeInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_BYTES;
}

export function safeFileName(value: string) {
  const base = path.basename(value.replaceAll("\\", "/")).normalize("NFKC");
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-").replace(/\s+/g, " ").trim();
  return (cleaned || "download").slice(0, 180);
}

export function isPublicAddress(address: string) {
  if (address === "::1" || address === "0.0.0.0" || address === "127.0.0.1") return false;
  if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return false;
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
  const ipv4 = mapped ?? (isIP(address) === 4 ? address : null);
  if (!ipv4) return isIP(address) === 6;
  const [a, b] = ipv4.split(".").map(Number);
  return !(a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224);
}

async function assertRemoteUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Only public HTTP(S) URLs are allowed.");
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error("Private and local network addresses are not allowed.");
  return url;
}

function rootPath() { return path.resolve(process.env.WORKSPACE_STORAGE_PATH ?? path.join(process.cwd(), "storage")); }

function physicalPath(storageKey: string, version: number) {
  const root = rootPath();
  const target = path.resolve(root, `${storageKey}.v${version}`);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid storage key.");
  return target;
}

export async function saveLocalFile(projectId: string, fileName: string, bytes: Buffer, mimeType: string, version: number): Promise<StoredFile> {
  if (!projectId || bytes.length === 0 || bytes.length > storageLimitBytes()) throw new Error("File is empty or exceeds the configured size limit.");
  const name = safeFileName(fileName);
  const storageKey = path.posix.join(projectId, name);
  const target = physicalPath(storageKey, version);
  const temporary = `${target}.${randomUUID()}.tmp`;
  await mkdir(path.dirname(target), { recursive: true });
  try { await writeFile(temporary, bytes, { flag: "wx", mode: 0o600 }); await rename(temporary, target); }
  catch (error) { await unlink(temporary).catch(() => undefined); throw error; }
  return { checksum: createHash("sha256").update(bytes).digest("hex"), mimeType: mimeType || "application/octet-stream", sizeBytes: bytes.length, storageKey, version };
}

export async function readLocalFile(storageKey: string, version: number) { return readFile(physicalPath(storageKey, version)); }

export async function downloadRemoteFile(value: string) {
  let url = await assertRemoteUrl(value);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { "user-agent": "Necrotix-Workspace/0.3" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("Remote file redirected too many times.");
      url = await assertRemoteUrl(new URL(location, url).toString()); continue;
    }
    if (!response.ok || !response.body) throw new Error(`Remote server returned ${response.status}.`);
    const declaredSize = Number(response.headers.get("content-length") ?? 0); const limit = storageLimitBytes();
    if (declaredSize > limit) throw new Error("Remote file exceeds the configured size limit.");
    const chunks: Buffer[] = []; let size = 0; const reader = response.body.getReader();
    while (true) { const { done, value } = await reader.read(); if (done) break; const buffer = Buffer.from(value); size += buffer.length; if (size > limit) { await reader.cancel(); throw new Error("Remote file exceeds the configured size limit."); } chunks.push(buffer); }
    const dispositionName = response.headers.get("content-disposition")?.match(/filename\*?=(?:UTF-8''|\")?([^";]+)/i)?.[1];
    const urlName = url.pathname.split("/").filter(Boolean).at(-1);
    return { bytes: Buffer.concat(chunks), fileName: safeFileName(decodeURIComponent(dispositionName ?? urlName ?? "download")), mimeType: response.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream", sourceUrl: url.toString() };
  }
  throw new Error("Unable to download remote file.");
}
