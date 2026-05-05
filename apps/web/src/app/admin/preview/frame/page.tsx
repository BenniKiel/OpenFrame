import { DraftPreviewFrame } from "@/lib/preview/draft-preview-frame";

export const dynamic = "force-dynamic";

/**
 * Editor draft iframe target. The public site renders persisted pages directly
 * at `/[slug]`; this route is intentionally restricted to the live `postMessage`
 * channel from the editor.
 */
export default function AdminPreviewFramePage() {
  return <DraftPreviewFrame />;
}
