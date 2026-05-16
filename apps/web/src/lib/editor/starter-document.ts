import type { OpenframePageDocument } from "@/lib/openframe";

import { homeShowcasePageDocument } from "./home-showcase-document";

/**
 * Valid default tree when `GET /api/pages/:slug` returns 404 (new page).
 * Deep-cloned so callers can mutate without sharing the module singleton.
 */
export function getStarterPageDocument(): OpenframePageDocument {
  return structuredClone(homeShowcasePageDocument);
}
