import type { ComponentType } from "react";

import type { BlockProps } from "./block-shared";
import { ButtonBlock } from "./button-block";
import { CardBlock } from "./card-block";
import { ContainerBlock } from "./container-block";
import { FrameBlock } from "./frame-block";
import { HeadingBlock } from "./heading-block";
import { ImageBlock } from "./image-block";
import { LinkBlock } from "./link-block";
import { SectionBlock } from "./section-block";
import { SplitBlock } from "./split-block";
import { TextBlock } from "./text-block";

export type { BlockProps } from "./block-shared";
export { ContainerBlock } from "./container-block";
export { TextBlock } from "./text-block";

export function UnknownTypeFallback({ node, children }: BlockProps) {
  return (
    <div
      data-of-node-id={node.id}
      className="my-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
    >
      <div className="font-semibold">Unknown block type</div>
      <div className="mt-1 font-mono text-xs">
        type={node.type} id={node.id}
      </div>
      {children ? <div className="mt-2 border-t border-amber-200 pt-2">{children}</div> : null}
    </div>
  );
}

/** Built-in block registry — keep aligned with `BUILTIN_BLOCK_TYPES` (`builtin-block-types.ts`). */
export const blockRegistry: Record<string, ComponentType<BlockProps>> = {
  container: ContainerBlock,
  frame: FrameBlock,
  text: TextBlock,
  heading: HeadingBlock,
  link: LinkBlock,
  button: ButtonBlock,
  image: ImageBlock,
  section: SectionBlock,
  split: SplitBlock,
  card: CardBlock,
};
