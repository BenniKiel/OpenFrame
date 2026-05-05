import Link from "next/link";

export const runtime = "nodejs";

export const metadata = {
  title: "Studio — OpenFrame",
};

/**
 * Admin hub: quick entry to the editor and links to studio tools.
 */
export default function AdminIndexPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col gap-8 px-6 py-14 text-zinc-900">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">OpenFrame</p>
        <h1 className="text-2xl font-semibold tracking-tight">Studio</h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          Edit pages in the builder, adjust studio preferences, or use your own AI tools against the same JSON contract.
        </p>
      </header>

      <nav className="flex flex-col gap-3">
        <Link
          href="/admin/editor?slug=home"
          className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
        >
          Open editor
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          Settings
        </Link>
        <Link href="/" className="text-center text-sm text-zinc-600 underline underline-offset-2">
          View public site
        </Link>
      </nav>
    </main>
  );
}
