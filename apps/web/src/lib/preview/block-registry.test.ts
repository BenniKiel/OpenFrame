import { describe, expect, it } from "vitest";

import { BUILTIN_BLOCK_TYPE_ORDER } from "@/lib/openframe";

import { blockRegistry } from "./block-components";

describe("blockRegistry vs built-in allowlist", () => {
  it("registry keys match BUILTIN_BLOCK_TYPES exactly", () => {
    const registryKeys = Object.keys(blockRegistry).sort();
    const builtinKeys = [...BUILTIN_BLOCK_TYPE_ORDER].sort();
    expect(registryKeys).toEqual(builtinKeys);
  });
});
