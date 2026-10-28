import Link from "next/link";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export interface Crumb {
  name: string;
  path: string;
}

/** BreadcrumbList structured data for a trail that starts at the home page. */
export function breadcrumbJsonLd(trail: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: SITE_NAME, path: "/" }, ...trail].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** Home / ... / current page. The last crumb is the current page and is not a link. */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const parents = trail.slice(0, -1);
  const current = trail[trail.length - 1];
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
      <ol className="flex flex-wrap gap-1">
        {[{ name: SITE_NAME, path: "/" }, ...parents].map((c) => (
          <li key={c.path}>
            <Link href={c.path} className="underline">{c.name}</Link> /
          </li>
        ))}
        <li aria-current="page" className="break-all">{current.name}</li>
      </ol>
    </nav>
  );
}
