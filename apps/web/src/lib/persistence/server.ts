import "server-only";

import { db } from "@/db/client";

import { createPageRepository } from "./page-repository";

/** Server-only singleton for route handlers and server actions. */
export const pageRepository = createPageRepository(db);
