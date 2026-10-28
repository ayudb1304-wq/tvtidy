import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CodeBlock } from "@/components/CommandBlocks";
import { JsonLd } from "@/components/JsonLd";
import { Badge, CATEGORY_LABEL } from "@/components/Rating";
import { disableCommand, restoreCommand } from "@/lib/commands";
import {
  brandPath,
  getAllPackages,
  getPackage,
  isPackageIndexed,
  modelPath,
  modelsForPackage,
  packagePath,
  shortName,
  UNVERIFIED,
  type Model,
} from "@/lib/data";
import { EXCLUDED_REASON_TEXT } from "@/lib/model-copy";
import { packageSummary, packageTitle, RATING_LINE } from "@/lib/package-copy";

type Params = { id: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllPackages().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const pkg = getPackage(id);
  if (!pkg) return {};
  return {
    title: packageTitle(id),
    description: packageSummary(pkg),
    alternates: { canonical: packagePath(id) },
    // Pages without a hand-written description are thin; keep them out of the index until they get one.
    robots: isPackageIndexed(pkg) ? undefined : { index: false, follow: true },
  };
}

function byBrand(models: Model[]): [string, Model[]][] {
  const groups = new Map<string, Model[]>();
  for (const m of models) groups.set(m.brand_slug, [...(groups.get(m.brand_slug) ?? []), m]);
  return [...groups.entries()].sort((a, b) => a[1][0].brand_display.localeCompare(b[1][0].brand_display));
}

export default async function PackagePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const pkg = getPackage(id);
  if (!pkg) notFound();

  const { active, kept } = modelsForPackage(id);
  const brands = byBrand(active);
  const trail = [{ name: id, path: packagePath(id) }];
  const verified = pkg.description !== UNVERIFIED;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd(trail)} />
      <Breadcrumbs trail={trail} />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight break-words sm:text-3xl">{packageTitle(id)}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge safe={pkg.safe_to_disable} />
        <span className="text-sm text-neutral-600">{CATEGORY_LABEL[pkg.category]}</span>
      </div>
      <p className="mt-3 text-lg text-neutral-800">{RATING_LINE[pkg.safe_to_disable]}</p>
      {verified ? (
        <p className="mt-2 text-neutral-700">{pkg.description}</p>
      ) : (
        <p className="mt-2 text-neutral-700">
          <span className="font-medium">Unverified.</span> We haven&apos;t written a description for this package yet,
          so it is rated Caution. The notes below come from the community lists.
        </p>
      )}
      {pkg.excluded_reason && <p className="mt-2 text-neutral-700">{EXCLUDED_REASON_TEXT[pkg.excluded_reason]}</p>}
      <p className="mt-3 text-sm text-neutral-600">
        Disabled on {pkg.seen_on_model_count} community-tested TV {pkg.seen_on_model_count === 1 ? "list" : "lists"}
        {" "}across {brands.length} {brands.length === 1 ? "brand" : "brands"}
        {pkg.kept_on_model_count > 0 && <>, kept on purpose on {pkg.kept_on_model_count}</>}.
      </p>

      {pkg.upstream_notes.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-semibold">What owners say it does</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
            {pkg.upstream_notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-neutral-600">Comments from the CleanYourTV community lists (MIT).</p>
        </>
      )}

      <h2 className="mt-8 text-xl font-semibold">Commands</h2>
      {pkg.safe_to_disable !== "no" && <CodeBlock id="disable-commands" label="Disable" lines={[disableCommand(id)]} empty="" />}
      <CodeBlock id="restore-commands" label="Restore" lines={[restoreCommand(id)]} empty="" />
      <p className="mt-3 text-sm text-neutral-700">
        Read <Link href="/safety/" className="underline">what disabling does and how to undo it</Link> before you start.
      </p>

      <h2 className="mt-8 text-xl font-semibold">TVs whose list includes it</h2>
      <div className="mt-3 space-y-3">
        {brands.map(([slug, models]) => (
          <div key={slug}>
            <Link href={brandPath(slug)} className="font-medium underline">{models[0].brand_display}</Link>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {models.map((m) => (
                <li key={m.slug}>
                  <Link href={modelPath(m)} className="underline">{shortName(m)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {kept.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-semibold">TVs where owners keep it</h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {kept.map((m) => (
              <li key={m.slug}>
                <Link href={modelPath(m)} className="underline">{shortName(m)}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
