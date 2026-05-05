import type { Metadata } from "next";

import { getStarterPageDocument } from "@/lib/editor";
import { pageRepository } from "@/lib/persistence/server";
import { PageShell } from "@/lib/preview/render-page-shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const result = pageRepository.getPageBySlug("home");
  if (!result.ok) {
    return { title: "OpenFrame" };
  }
  const m = result.data.meta;
  const title = m?.title?.trim() ? m.title.trim() : "OpenFrame";
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

/**
 * Public root: always serves the `home` page. If absent (fresh install), the
 * starter document is persisted on first request so subsequent loads — and the
 * admin page list — see the seeded row instead of a 404.
 */
export default async function HomePage() {
  let result = pageRepository.getPageBySlug("home");

  if (!result.ok && result.error === "not_found") {
    const seeded = pageRepository.upsertPageDocument("home", getStarterPageDocument());
    if (seeded.ok) {
      result = { ok: true, data: seeded.data };
    }
  }

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-2xl space-y-3 px-6 py-12 text-zinc-900">
        <h1 className="text-lg font-semibold text-red-700">Home page unavailable</h1>
        <p className="text-sm text-zinc-700">
          The stored home document could not be loaded ({result.error}). Open the editor at{" "}
          <a className="underline" href="/admin/editor?slug=home">/admin/editor?slug=home</a> to fix it.
        </p>
      </main>
    );
  }

  return <PageShell document={result.data} />;
}
