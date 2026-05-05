import type { OpenframePageDocument } from "@/lib/openframe";

import { pageShellClassNames } from "./page-theme";
import { renderPageDocument } from "./render-page-document";

/**
 * Public-site wrapper around `renderPageDocument`. Keeps a tiny outer container
 * so future site-wide chrome (header/footer, motion shell) lives in one place.
 */
export function PageShell({ document }: { document: OpenframePageDocument }) {
  return <div className={pageShellClassNames(document.theme)}>{renderPageDocument(document)}</div>;
}
