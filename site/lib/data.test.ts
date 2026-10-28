import { describe, expect, it } from "vitest";
import { findModel, getModels, shortName } from "./data";

describe("shortName", () => {
  it("drops the details in parentheses", () => {
    expect(shortName(findModel("xiaomi", "mi-tv-4a")!)).toBe("Xiaomi Mi TV 4A");
  });

  it("gives every model a unique name", () => {
    const names = getModels().map(shortName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("disambiguates models that would share a name", () => {
    const names = getModels()
      .filter((m) => ["oneplus-tv-cebu", "oneplus-tv-dosa", "oneplus-tv-dubai"].includes(m.slug))
      .map(shortName)
      .sort();
    expect(names).toEqual(["OnePlus TV (C00)", "OnePlus TV (D00)", "OnePlus TV (Dosa)"]);
  });
});
