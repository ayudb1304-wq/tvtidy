import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DISCLAIMER } from "./disclaimer";

describe("DISCLAIMER", () => {
  it("matches the footer disclaimer in docs/gtm-kit.md section 14", () => {
    const kit = readFileSync(fileURLToPath(new URL("../../docs/gtm-kit.md", import.meta.url)), "utf8");
    const start = kit.indexOf("**Footer disclaimer");
    const block = kit.slice(start).split("```markdown\n")[1].split("\n```")[0];
    expect(DISCLAIMER).toBe(block);
  });
});
