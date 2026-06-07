import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.UPLOAD_DIR ?? "uploads",
);

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

// Keep a file extension only if it's a simple, safe suffix.
function safeExtension(name: string): string {
  const ext = path.extname(name);
  return /^\.[a-zA-Z0-9]{1,10}$/.test(ext) ? ext.toLowerCase() : "";
}

export type SavedFile = {
  storedName: string;
  size: number;
};

export async function saveUpload(file: File): Promise<SavedFile> {
  await ensureUploadDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  const storedName = `${randomUUID()}${safeExtension(file.name)}`;
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return { storedName, size: buffer.byteLength };
}

// Resolves a stored file path, guarding against path traversal.
function resolveStored(storedName: string): string {
  const full = path.resolve(UPLOAD_DIR, storedName);
  if (full !== path.join(UPLOAD_DIR, path.basename(storedName))) {
    throw new Error("Invalid file path");
  }
  return full;
}

export async function readUpload(storedName: string): Promise<Buffer> {
  return readFile(resolveStored(storedName));
}

export async function deleteUpload(storedName: string): Promise<void> {
  try {
    await unlink(resolveStored(storedName));
  } catch {
    /* already gone — ignore */
  }
}
