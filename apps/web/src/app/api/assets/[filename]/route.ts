import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

function sanitizeFileName(raw: string): string | null {
  const decoded = decodeURIComponent(raw);
  // Basic traversal/shell-safe allowlist: timestamp-uuid.ext format from upload route.
  if (!/^[a-zA-Z0-9._-]+$/.test(decoded)) {
    return null;
  }
  if (decoded.includes("..") || decoded.includes("/") || decoded.includes("\\")) {
    return null;
  }
  return decoded;
}

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  const safeName = sanitizeFileName(filename);
  if (!safeName) {
    return NextResponse.json({ error: "invalid_filename" }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, safeName);
  const data = await fs.readFile(filePath).catch(() => null);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ext = path.extname(safeName).slice(1).toLowerCase();
  const contentType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : ext === "svg"
              ? "image/svg+xml"
              : "application/octet-stream";

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
