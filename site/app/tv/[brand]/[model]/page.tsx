import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommandBlocks } from "@/components/CommandBlocks";
import { JsonLd } from "@/components/JsonLd";
import {
  findModel,
  getModels,
  modelParam,
  modelPath,
  modelsForBrand,
  ratedPackages,
  shortName,
  upstreamCommitUrl,
  upstreamFileUrl,
  type Category,
  type RatedPackage,
  type SafeToDisable,
} from "@/lib/data";
import { EXCLUDED_REASON_TEXT, faq, howToSteps, modelTitle, oneLineAnswer } from "@/lib/model-copy";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type Params = { brand: string; model: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getModels().map((m) => ({ brand: m.brand_slug, model: modelParam(m) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { brand, model: param } = await params;
  const model = findModel(brand, param);
  if (!model) return {};
  const title = modelTitle(model);
  const description = oneLineAnswer(model, ratedPackages(model));
  return {
    title,
    description,
    alternates: { canonical: modelPath(model) },
    openGraph: { title, description, url: modelPath(model), siteName: SITE_NAME, type: "article" },
  };
}

const CATEGORY_LABEL: Record<Category, string> = {
  ads: "Ads",
  telemetry: "Telemetry",
  preinstalled_app: "Preinstalled app",
  system_risky: "System",
};

const BADGE: Record<SafeToDisable, { label: string; className: string }> = {
  yes: { label: "Safe", className: "bg-green-100 text-green-800" },
  caution: { label: "Caution", className: "bg-amber-100 text-amber-900" },
  no: { label: "Keep", className: "bg-red-100 text-red-800" },
};

const ROW: Record<SafeToDisable, string> = {
  yes: "",
  caution: "bg-amber-50",
  no: "bg-red-50",
};

function Badge({ safe }: { safe: SafeToDisable }) {
  const b = BADGE[safe];
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${b.className}`}>{b.label}</span>;
}

function Description({ p }: { p: RatedPackage }) {
  return (
    p.description ?? (
      <>
        <span className="font-medium">Unverified.</span>
        {p.note && <> Community note: {p.note}</>}
      </>
    )
  );
}

// Cards on phones, a table from the sm breakpoint up.
function PackageTable({ packages }: { packages: RatedPackage[] }) {
  return (
    <>
      <ul className="mt-4 divide-y divide-neutral-200 rounded-md border border-neutral-200 sm:hidden">
        {packages.map((p) => (
          <li key={p.id} className={`px-3 py-3 text-sm ${ROW[p.safe]}`}>
            <div className="font-mono text-xs break-all">{p.id}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge safe={p.safe} />
              <span className="text-neutral-600">{CATEGORY_LABEL[p.category]}</span>
            </div>
            <p className="mt-1 text-neutral-700">
              <Description p={p} />
            </p>
          </li>
        ))}
      </ul>
      <WideTable packages={packages} />
    </>
  );
}

function WideTable({ packages }: { packages: RatedPackage[] }) {
  return (
    <div className="mt-4 hidden overflow-x-auto rounded-md border border-neutral-200 sm:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Package</th>
            <th scope="col" className="px-3 py-2 font-medium">Category</th>
            <th scope="col" className="px-3 py-2 font-medium">Rating</th>
            <th scope="col" className="px-3 py-2 font-medium">What it is</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((p) => (
            <tr key={p.id} className={`border-t border-neutral-200 align-top ${ROW[p.safe]}`}>
              <td className="px-3 py-2 font-mono text-xs break-all">{p.id}</td>
              <td className="px-3 py-2 whitespace-nowrap">{CATEGORY_LABEL[p.category]}</td>
              <td className="px-3 py-2">
                <Badge safe={p.safe} />
              </td>
              <td className="px-3 py-2 text-neutral-700">
                <Description p={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ModelPage({ params }: { params: Promise<Params> }) {
  const { brand, model: param } = await params;
  const model = findModel(brand, param);
  if (!model) notFound();

  const name = shortName(model);
  const title = modelTitle(model);
  const packages = ratedPackages(model);
  const yes = packages.filter((p) => p.safe === "yes").map((p) => p.id);
  const caution = packages.filter((p) => p.safe === "caution").map((p) => p.id);
  const siblings = modelsForBrand(model.brand_slug)
    .filter((m) => m.slug !== model.slug)
    .sort((a, b) => shortName(a).localeCompare(shortName(b)));
  const questions = faq(model);
  const brandPath = `/brand/${model.brand_slug}/`;
  const pagePath = modelPath(model);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: model.brand_display, item: absoluteUrl(brandPath) },
              { "@type": "ListItem", position: 3, name, item: absoluteUrl(pagePath) },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: title,
            description: oneLineAnswer(model, packages),
            tool: [{ "@type": "HowToTool", name: "A computer with Android platform-tools (adb)" }],
            step: howToSteps().map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.name,
              text: s.text,
              url: `${absoluteUrl(pagePath)}#commands`,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: questions.map((q) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: { "@type": "Answer", text: q.answer },
            })),
          },
        ]}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="underline">{SITE_NAME}</Link> /
          </li>
          <li>
            <Link href={brandPath} className="underline">{model.brand_display}</Link> /
          </li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-4 text-lg text-neutral-800">{oneLineAnswer(model, packages)}</p>
      <p className="mt-3 text-sm text-neutral-600">
        Package list derived from the CleanYourTV community list (MIT)
        {model.last_changed_at && <>, last changed {model.last_changed_at}</>}, synced at commit{" "}
        <a href={upstreamCommitUrl(model)} className="font-mono underline">{model.upstream_commit.slice(0, 7)}</a>{" "}
        (<a href={upstreamFileUrl(model)} className="underline">upstream file</a>). TVTidy is an independent project.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What you can disable</h2>
      <p className="mt-2 text-neutral-700">
        Read <Link href="/safety/" className="underline">what disabling does and how to undo it</Link> before
        you start. Rows marked Caution are apps some people use, or packages we have not verified yet.
      </p>
      <PackageTable packages={packages} />

      {model.excluded_packages.length > 0 && (
        <>
          <h3 className="mt-6 font-semibold">Left out on purpose</h3>
          <p className="mt-1 text-sm text-neutral-700">
            The community list also disables these, but TVTidy never does:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
            {model.excluded_packages.map((e) => (
              <li key={e.id}>
                <span className="font-mono text-xs break-all">{e.id}</span>: {EXCLUDED_REASON_TEXT[e.reason]}
              </li>
            ))}
          </ul>
        </>
      )}

      <section id="commands">
        <CommandBlocks yes={yes} caution={caution} />
      </section>
      <p className="mt-3 text-sm text-neutral-700">
        See <Link href="/safety/" className="underline">the safety page</Link> before you start.
      </p>

      <section className="mt-10 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-xl font-semibold">Do this in one click</h2>
        <p className="mt-2 text-neutral-700">
          The TVTidy helper pairs with your TV, previews these packages, saves a restore file, and applies them.
          Windows, macOS and Linux.
        </p>
        <button type="button" disabled className="mt-3 rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600">
          Coming soon
        </button>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-xl font-semibold">Get told when this list changes</h2>
        <p className="mt-2 text-neutral-700">
          We email you when the {name} list changes or a firmware update turns apps back on.
        </p>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" aria-disabled="true">
          <label htmlFor="watch-email" className="sr-only">Email address</label>
          <input
            id="watch-email"
            type="email"
            disabled
            placeholder="you@example.com"
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="button" disabled className="rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600">
            Coming soon
          </button>
        </form>
      </section>

      <h2 className="mt-10 text-xl font-semibold">FAQ</h2>
      <dl className="mt-3 space-y-4">
        {questions.map((q) => (
          <div key={q.question}>
            <dt className="font-medium">{q.question}</dt>
            <dd className="mt-1 text-neutral-700">{q.answer}</dd>
          </div>
        ))}
      </dl>

      {siblings.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-semibold">Other {model.brand_display} models</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {siblings.map((m) => (
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
