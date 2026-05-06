import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const maybeFile = form.get("file");
  if (!(maybeFile instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const mime = maybeFile.type || "application/octet-stream";
  const ext = MIME_EXT[mime];
  if (!ext) {
    return NextResponse.json({ error: "unsupported_file_type" }, { status: 415 });
  }

  if (!Number.isFinite(maybeFile.size) || maybeFile.size <= 0 || maybeFile.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "file_too_large", maxBytes: MAX_IMAGE_BYTES }, { status: 413 });
  }

  const bytes = new Uint8Array(await maybeFile.arrayBuffer());
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(filePath, bytes);

  return NextResponse.json({
    ok: true,
    url: `/api/assets/${encodeURIComponent(fileName)}`,
    name: maybeFile.name,
    type: mime,
    size: maybeFile.size,
  });
}
