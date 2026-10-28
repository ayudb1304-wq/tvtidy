import type { MetadataRoute } from "next";
import { getModels, modelPath } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/safety/") },
    ...getModels().map((m) => ({
      url: absoluteUrl(modelPath(m)),
      ...(m.last_changed_at ? { lastModified: m.last_changed_at } : {}),
    })),
  ];
}
