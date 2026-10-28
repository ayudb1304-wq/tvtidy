import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { PackageLink } from "@/components/PackageLink";
import { Badge } from "@/components/Rating";
import { restoreCommand } from "@/lib/commands";
import {
  brandPath,
  fixPath,
  getBrand,
  getBrands,
  getFixes,
  modelPath,
  modelsForBrand,
  ratedPackages,
  shortName,
  topPackagesForBrand,
} from "@/lib/data";
import { counts } from "@/lib/model-copy";

type Params = { brand: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getBrands().map((b) => ({ brand: b.slug }));
}

const brandTitle = (name: string) => `${name} Android TV: disable ads and preinstalled apps by model`;

function brandIntro(name: string, n: number) {
  return `${n} ${name} ${n === 1 ? "model has" : "models have"} a community-tested debloat list. Pick yours for the exact packages, copy-paste commands and a restore block.`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand } = await params;
  const b = getBrand(brand);
  if (!b) return {};
  return {
    title: brandTitle(b.display_name),
    description: brandIntro(b.display_name, b.model_count),
    alternates: { canonical: brandPath(b.slug) },
  };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const b = getBrand(brand);
  if (!b) notFound();

  const models = modelsForBrand(b.slug).sort((x, y) => shortName(x).localeCompare(shortName(y)));
  const top = topPackagesForBrand(b.slug, 10);
  const trail = [{ name: b.display_name, path: brandPath(b.slug) }];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd(trail)} />
      <Breadcrumbs trail={trail} />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{brandTitle(b.display_name)}</h1>
      <p className="mt-4 text-lg text-neutral-800">{brandIntro(b.display_name, b.model_count)}</p>

      <h2 className="mt-8 text-xl font-semibold">Models</h2>
      <ul className="mt-3 divide-y divide-neutral-200 rounded-md border border-neutral-200">
        {models.map((m) => {
          const c = counts(ratedPackages(m));
          return (
            <li key={m.slug} className="px-3 py-3">
              <Link href={modelPath(m)} className="font-medium underline">{shortName(m)}</Link>
              <p className="mt-1 text-sm text-neutral-600">
                {m.os_raw} · {c.yes} safe, {c.caution} caution
                {m.last_changed_at && <> · list changed {m.last_changed_at}</>}
              </p>
            </li>
          );
        })}
      </ul>

      {top.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-semibold">Most common packages on {b.display_name} TVs</h2>
          <ul className="mt-3 space-y-2">
            {top.map(({ pkg, count }) => (
              <li key={pkg.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge safe={pkg.safe_to_disable} />
                <PackageLink id={pkg.id} className="font-mono text-xs break-all underline" />
                <span className="text-neutral-600">
                  on {count} of {models.length} {models.length === 1 ? "list" : "lists"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-neutral-700">
            To undo any of these, run{" "}
            <code className="rounded bg-neutral-100 px-1 break-all">{restoreCommand("<package>")}</code>. Read{" "}
            <Link href="/safety/" className="underline">the safety page</Link> before you start.
          </p>
        </>
      )}

      <h2 className="mt-8 text-xl font-semibold">Common fixes</h2>
      <ul className="mt-3 space-y-1">
        {getFixes().map((f) => (
          <li key={f.slug}>
            <Link href={fixPath(f.slug)} className="underline">{f.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
