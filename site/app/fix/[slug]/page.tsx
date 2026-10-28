import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CodeBlock } from "@/components/CommandBlocks";
import { JsonLd } from "@/components/JsonLd";
import { PackageLink } from "@/components/PackageLink";
import { Badge } from "@/components/Rating";
import { restoreCommand } from "@/lib/commands";
import {
  fixPath,
  getFixes,
  getPackage,
  modelPath,
  shortName,
  topModelsForPackages,
  UNVERIFIED,
} from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getFixes().map((f) => ({ slug: f.slug }));
}

const findFix = (slug: string) => getFixes().find((f) => f.slug === slug);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const fix = findFix(slug);
  if (!fix) return {};
  return { title: fix.title, description: fix.description, alternates: { canonical: fixPath(fix.slug) } };
}

export default async function FixPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const fix = findFix(slug);
  if (!fix) notFound();

  const packages = fix.packages.map((id) => getPackage(id)!);
  const models = topModelsForPackages(fix.packages, 5);
  const others = getFixes().filter((f) => f.slug !== fix.slug);
  const trail = [{ name: fix.title, path: fixPath(fix.slug) }];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd
        data={[
          breadcrumbJsonLd(trail),
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: fix.title,
            description: fix.description,
            step: fix.steps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.name,
              text: s.text,
              url: `${absoluteUrl(fixPath(fix.slug))}#step-${i + 1}`,
            })),
          },
        ]}
      />
      <Breadcrumbs trail={trail} />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{fix.title}</h1>
      <p className="mt-4 text-lg text-neutral-800">{fix.symptom}</p>

      <ol className="mt-6 space-y-5">
        {fix.steps.map((s, i) => (
          <li key={s.name} id={`step-${i + 1}`}>
            <h2 className="text-lg font-semibold">
              {i + 1}. {s.name}
            </h2>
            <p className="mt-1 text-neutral-700">{s.text}</p>
          </li>
        ))}
      </ol>

      {packages.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-semibold">Packages this covers</h2>
          <ul className="mt-3 space-y-3">
            {packages.map((p) => (
              <li key={p.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge safe={p.safe_to_disable} />
                  <PackageLink id={p.id} className="font-mono text-xs break-all underline" />
                </div>
                <p className="mt-1 text-neutral-700">{p.description === UNVERIFIED ? "Unverified." : p.description}</p>
              </li>
            ))}
          </ul>
          <CodeBlock id="restore-commands" label="Restore" lines={packages.map((p) => restoreCommand(p.id))} empty="" />
        </>
      )}
      <p className="mt-4 text-sm text-neutral-700">
        Read <Link href="/safety/" className="underline">what disabling does and how to undo it</Link> before you
        start.
      </p>

      {models.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-semibold">TVs this applies to most</h2>
          <ul className="mt-3 space-y-1">
            {models.map((m) => (
              <li key={m.slug}>
                <Link href={modelPath(m)} className="underline">{shortName(m)}</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-10 text-xl font-semibold">Other fixes</h2>
      <ul className="mt-3 space-y-1">
        {others.map((f) => (
          <li key={f.slug}>
            <Link href={fixPath(f.slug)} className="underline">{f.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
