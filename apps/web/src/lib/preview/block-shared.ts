import type { ReactNode } from "react";

import type { PageNode } from "@/lib/openframe";

export type BlockProps = {
  node: PageNode;
  children?: ReactNode;
};
