import type { MetadataRoute } from "next";
import {
  brandPath,
  fixPath,
  getAllPackages,
  getBrands,
  getFixes,
  getModels,
  isPackageIndexed,
  modelPath,
  packagePath,
} from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Every indexable page. Package pages without an override are noindex, so they are left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/safety/") },
    ...getBrands().map((b) => ({ url: absoluteUrl(brandPath(b.slug)) })),
    ...getModels().map((m) => ({
      url: absoluteUrl(modelPath(m)),
      ...(m.last_changed_at ? { lastModified: m.last_changed_at } : {}),
    })),
    ...getFixes().map((f) => ({ url: absoluteUrl(fixPath(f.slug)) })),
    ...getAllPackages()
      .filter(isPackageIndexed)
      .map((p) => ({ url: absoluteUrl(packagePath(p.id)) })),
  ];
}
