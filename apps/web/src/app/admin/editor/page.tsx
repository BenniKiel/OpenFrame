import { EditorApp } from "./editor-app";

export const metadata = {
  title: "Editor — OpenFrame",
};

type Search = Promise<{ slug?: string | string[] }>;

export default async function EditorPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const raw = sp.slug;
  const initialSlug =
    typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "home") : "home";

  return <EditorApp initialSlug={initialSlug} />;
}
