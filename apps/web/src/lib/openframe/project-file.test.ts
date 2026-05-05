import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseProjectFile, parseProjectFileFromJson } from "./project-file";

describe("parseProjectFile", () => {
  it("returns ok for valid file", () => {
    const r = parseProjectFile({
      version: 1,
      name: "Demo",
      defaultPageSlug: "home",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe("Demo");
    }
  });

  it("rejects empty name", () => {
    const r = parseProjectFile({
      version: 1,
      name: "",
      defaultPageSlug: "home",
    });
    expect(r.ok).toBe(false);
  });

  it("accepts openframe/examples/openframe.project.json", () => {
    const file = path.join(process.cwd(), "../../openframe/examples/openframe.project.json");
    const text = readFileSync(file, "utf8");
    const r = parseProjectFileFromJson(text);
    expect(r.ok).toBe(true);
  });
});
