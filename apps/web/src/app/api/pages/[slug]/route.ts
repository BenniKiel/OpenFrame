import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { pageRepository } from "@/lib/persistence/server";
import { isSafePageSlug } from "@/lib/persistence/slug";

export const runtime = "nodejs";

function zodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
  }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  if (!isSafePageSlug(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const result = pageRepository.getPageBySlug(slug);

  if (result.ok) {
    return NextResponse.json(result.data);
  }

  if (result.error === "not_found") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (result.error === "invalid_json") {
    return NextResponse.json({ error: "invalid_stored_json" }, { status: 422 });
  }

  return NextResponse.json(
    { error: "invalid_stored_document", issues: zodIssues(result.zodError) },
    { status: 422 },
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  if (!isSafePageSlug(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  const result = pageRepository.upsertPageFromInput(slug, body);

  if (!result.ok) {
    return NextResponse.json({ issues: zodIssues(result.zodError) }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
