import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { pageRepository } from "@/lib/persistence/server";
import { isSafePageSlug } from "@/lib/persistence/slug";
import { PageShell } from "@/lib/preview/render-page-shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string | string[] }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  if (!slug || !isSafePageSlug(slug)) {
    return { title: "Page" };
  }
  const result = pageRepository.getPageBySlug(slug);
  if (!result.ok) {
    return { title: slug };
  }
  const m = result.data.meta;
  const title = m?.title?.trim() ? m.title.trim() : slug;
  const description = m?.description?.trim() || undefined;
  const og = m?.ogImage?.trim();
  return {
    title,
    description,
    ...(og
      ? {
          openGraph: {
            title,
            description,
            images: [{ url: og }],
          },
        }
      : {}),
  };
}

export default async function PublicPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug || !isSafePageSlug(slug)) {
    notFound();
  }

  const result = pageRepository.getPageBySlug(slug);
  if (!result.ok) {
    if (result.error === "not_found") {
      notFound();
    }
    return <BadDocumentPanel slug={slug} reason={result.error} />;
  }

  return <PageShell document={result.data} />;
}

function BadDocumentPanel({ slug, reason }: { slug: string; reason: "invalid_json" | "invalid_stored" }) {
  const detail =
    reason === "invalid_json"
      ? "The stored document JSON could not be parsed."
      : "The stored document failed schema validation.";
  return (
    <main className="mx-auto max-w-2xl space-y-3 px-6 py-12 text-zinc-900">
      <h1 className="text-lg font-semibold text-red-700">Page unavailable</h1>
      <p className="text-sm text-zinc-700">{detail}</p>
      <p className="text-xs text-zinc-500">
        Open <Link className="underline" href={`/admin/editor?slug=${encodeURIComponent(slug)}`}>the editor</Link> to fix
        the document for <span className="font-mono">{slug}</span>.
      </p>
    </main>
  );
}
