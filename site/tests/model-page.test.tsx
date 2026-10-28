import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ModelPage, { generateStaticParams } from "@/app/tv/[brand]/[model]/page";
import { findModel, getModels, modelParam, ratedPackages } from "@/lib/data";

async function render(brand: string, model: string) {
  const element = await ModelPage({ params: Promise.resolve({ brand, model }) });
  return renderToStaticMarkup(element);
}

describe("model page", () => {
  it("renders the H1, the disable block and the restore block", async () => {
    const html = await render("xiaomi", "mi-tv-4a");
    expect(html).toContain("<h1");
    expect(html).toContain("Xiaomi Mi TV 4A debloat list: remove ads and bloat (reversible)</h1>");
    expect(html).toMatch(/<pre id="disable-commands"/);
    expect(html).toMatch(/<pre id="restore-commands"/);
    expect(html).toMatch(/href="\/safety\/?"/); // next/link drops the slash outside a Next build
    expect(html).toContain('"@type":"HowTo"');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"BreadcrumbList"');
  });

  it("puts every yes package in the disable and restore blocks, and never an excluded one", async () => {
    const model = findModel("xiaomi", "mi-tv-4a")!;
    const html = await render("xiaomi", "mi-tv-4a");
    const disable = html.split('<pre id="disable-commands"')[1].split("</pre>")[0];
    const restore = html.split('<pre id="restore-commands"')[1].split("</pre>")[0];
    for (const p of ratedPackages(model).filter((p) => p.safe === "yes")) {
      expect(disable).toContain(`adb shell pm disable-user --user 0 ${p.id}`);
      expect(restore).toContain(`adb shell pm enable --user 0 ${p.id}`);
    }
    for (const e of model.excluded_packages) {
      expect(disable).not.toContain(e.id);
    }
    expect(html).toContain("Left out on purpose");
  });

  it("has one unique static path per model", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(getModels().length);
    expect(new Set(params.map((p) => `${p.brand}/${p.model}`)).size).toBe(params.length);
    expect(params).toContainEqual({ brand: "xiaomi", model: modelParam(findModel("xiaomi", "mi-tv-4a")!) });
  });
});
