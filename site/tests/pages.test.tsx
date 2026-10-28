import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BrandPage, { generateStaticParams as brandParams } from "@/app/brand/[brand]/page";
import FixPage, { generateStaticParams as fixParams } from "@/app/fix/[slug]/page";
import PackagePage, {
  generateMetadata as packageMetadata,
  generateStaticParams as packageParams,
} from "@/app/package/[id]/page";
import sitemap from "@/app/sitemap";
import {
  getAllPackages,
  getBrands,
  getFixes,
  getModels,
  getPackage,
  isPackageIndexed,
  modelPath,
  modelsForBrand,
  packagePath,
} from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

const html = async (page: Promise<React.ReactElement>) => renderToStaticMarkup(await page);

describe("brand page", () => {
  it("lists every model of the brand and links to /safety with the restore command", async () => {
    const out = await html(BrandPage({ params: Promise.resolve({ brand: "xiaomi" }) }));
    expect(out).toContain("Xiaomi Android TV: disable ads and preinstalled apps by model</h1>");
    for (const m of modelsForBrand("xiaomi")) expect(out).toContain(`href="${modelPath(m)}`.replace(/\/$/, ""));
    expect(out).toContain("adb shell pm enable --user 0");
    expect(out).toMatch(/href="\/safety\/?"/);
  });

  it("has one page per brand", () => {
    expect(brandParams()).toHaveLength(getBrands().length);
  });
});

describe("package page", () => {
  it("shows the rating, the restore command, /safety and the models that include it", async () => {
    const id = "com.google.android.feedback";
    const out = await html(PackagePage({ params: Promise.resolve({ id }) }));
    expect(out).toContain(`Is ${id} safe to disable on Android TV?</h1>`);
    expect(out).toContain("Safe to disable.");
    expect(out).toContain(`adb shell pm enable --user 0 ${id}`);
    expect(out).toMatch(/href="\/safety\/?"/);
    expect(out).toContain("Xiaomi Mi TV 4A");
  });

  it("never offers a disable command for a package TVTidy refuses", async () => {
    const id = "com.google.android.tvlauncher";
    const out = await html(PackagePage({ params: Promise.resolve({ id }) }));
    expect(out).not.toContain("pm disable-user");
    expect(out).toContain(`adb shell pm enable --user 0 ${id}`);
    expect(out).toContain("no home screen");
  });

  it("is noindex unless the package has an override", async () => {
    const verified = await packageMetadata({ params: Promise.resolve({ id: "com.google.android.feedback" }) });
    expect(verified.robots).toBeUndefined();
    const unverified = getAllPackages().find((p) => !isPackageIndexed(p))!;
    const meta = await packageMetadata({ params: Promise.resolve({ id: unverified.id }) });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("exists for every package a model page links to", () => {
    const ids = new Set(packageParams().map((p) => p.id));
    for (const m of getModels()) {
      for (const p of [...m.packages, ...m.excluded_packages]) expect(ids.has(p.id)).toBe(true);
    }
  });
});

describe("fix pages", () => {
  it("only reference packages that exist", () => {
    for (const f of getFixes()) for (const id of f.packages) expect(getPackage(id), `${f.slug}: ${id}`).toBeDefined();
  });

  it("render the steps, restore commands and /safety", async () => {
    const out = await html(FixPage({ params: Promise.resolve({ slug: "remove-ads-google-tv" }) }));
    expect(out).toContain("How to remove ads from the Google TV home screen</h1>");
    expect(out).toContain("Turn on Apps only mode");
    expect(out).toContain('"@type":"HowTo"');
    expect(out).toContain("adb shell pm enable --user 0 com.android.adservices.api");
    expect(out).toMatch(/href="\/safety\/?"/);
  });

  it("has one page per fix", () => {
    expect(fixParams()).toHaveLength(getFixes().length);
  });
});

describe("sitemap", () => {
  const urls = new Set(sitemap().map((e) => e.url));

  it("lists every brand, model and fix page", () => {
    for (const b of getBrands()) expect(urls.has(absoluteUrl(`/brand/${b.slug}/`))).toBe(true);
    for (const m of getModels()) expect(urls.has(absoluteUrl(modelPath(m)))).toBe(true);
    for (const f of getFixes()) expect(urls.has(absoluteUrl(`/fix/${f.slug}/`))).toBe(true);
  });

  it("lists indexed package pages and leaves out noindex ones", () => {
    for (const p of getAllPackages()) expect(urls.has(absoluteUrl(packagePath(p.id)))).toBe(isPackageIndexed(p));
  });
});
