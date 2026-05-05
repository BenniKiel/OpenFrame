import { NextResponse } from "next/server";

import { pageRepository } from "@/lib/persistence/server";

export const runtime = "nodejs";

export function GET() {
  const slugs = pageRepository.listPageSlugs();
  return NextResponse.json({ slugs });
}
