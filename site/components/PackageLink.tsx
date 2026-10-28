import type { ReactNode } from "react";
import { packagePath } from "@/lib/data";

// A plain <a>, not next/link: Next drops the trailing slash from paths whose last segment has a dot
// ("/package/com.vendor.app/"), which would no longer match the canonical URL and the sitemap.
export function PackageLink({ id, className, children }: { id: string; className?: string; children?: ReactNode }) {
  return (
    <a href={packagePath(id)} className={className}>
      {children ?? id}
    </a>
  );
}
