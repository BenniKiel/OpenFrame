import Link from "next/link";

export const runtime = "nodejs";

export const metadata = {
  title: "Settings — OpenFrame",
};

export default function AdminSettingsPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-10 px-6 py-12 text-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-zinc-600">Studio reference and external tooling — no in-app model picker (yet).</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="text-zinc-600 underline underline-offset-2" href="/admin">
            Studio
          </Link>
          <Link className="text-zinc-600 underline underline-offset-2" href="/admin/editor?slug=home">
            Editor
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-900">External tools (recommended)</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          OpenFrame is built for <strong>contract-first JSON</strong> and HTTP persistence. You do not need a built-in chat
          to use models productively: point any capable client at the same artifacts the editor uses.
        </p>
        <ul className="list-inside list-disc space-y-2 text-sm text-zinc-700">
          <li>
            <strong>Claude Code (CLI)</strong> — run in this repo; edit files under <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">openframe/</code> or call{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">curl</code> against{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">PUT /api/pages/&lt;slug&gt;</code> with a valid page document.
          </li>
          <li>
            <strong>Cursor / VS Code + Copilot</strong> — open the workspace; agents can read Zod types and examples in{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">openframe/examples/</code> and system docs in{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">docs/systems/</code>.
          </li>
          <li>
            <strong>Google Antigravity</strong> — same workflow as other IDE agents: repository context + documented contract.
          </li>
          <li>
            <strong>Claude desktop / web app</strong> — attach project folders or paste JSON; align outputs with{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">parsePageDocument</code> rules (see schema doc).
          </li>
        </ul>
        <p className="text-sm text-zinc-600">
          In the repo: <code className="rounded bg-zinc-100 px-1 font-mono text-xs">docs/01_Concept.md</code> (vision),{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs">docs/systems/CanonicalDocumentSchema.md</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs">docs/systems/Persistence.md</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs">openframe/README.md</code>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-900">Pages API</h2>
        <p className="text-sm text-zinc-700">After <code className="rounded bg-zinc-100 px-1 font-mono text-xs">pnpm db:push</code>:</p>
        <ul className="list-inside list-disc space-y-1 font-mono text-xs text-zinc-800">
          <li>GET /api/pages</li>
          <li>GET /api/pages/&lt;slug&gt;</li>
          <li>PUT /api/pages/&lt;slug&gt;</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-900">Editor shortcuts</h2>
        <ul className="list-inside list-disc text-sm text-zinc-700">
          <li>
            <strong>Save</strong> — <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs">Ctrl</kbd>{" "}
            + <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs">S</kbd> (Windows/Linux) or{" "}
            <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs">⌘</kbd> +{" "}
            <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs">S</kbd> (macOS) while the editor is open: the shortcut is handled in the <strong>capture</strong> phase so the browser does not open “Save Page”. The actual write only runs when there are unsaved changes (same as the Save button).
          </li>
          <li>
            <strong>Hand tool (preview)</strong> — hold <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs">Space</kbd>{" "}
            outside text fields (see <code className="rounded bg-zinc-100 px-1 font-mono text-xs">docs/systems/EditorCore.md</code>).
          </li>
        </ul>
      </section>
    </main>
  );
}
