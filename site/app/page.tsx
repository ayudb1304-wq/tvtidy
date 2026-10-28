import Link from "next/link";
import { brandPath, fixPath, getBrands, getFixes, getModels } from "@/lib/data";

export default function Home() {
  const brands = [...getBrands()].sort((a, b) => b.model_count - a.model_count || a.display_name.localeCompare(b.display_name));
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Remove the ads and junk from your Android TV</h1>
      <p className="mt-4 text-lg text-neutral-700">
        Model-by-model guides to what is safe to disable on {getModels().length} Android TV and Google TV models,
        with a restore command for every change. Nothing is uninstalled, and everything can be undone.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Find your TV by brand</h2>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {brands.map((b) => (
          <li key={b.slug}>
            <Link href={brandPath(b.slug)} className="underline">{b.display_name}</Link>{" "}
            <span className="text-sm text-neutral-500">({b.model_count})</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Fixes</h2>
      <ul className="mt-3 space-y-1">
        {getFixes().map((f) => (
          <li key={f.slug}>
            <Link href={fixPath(f.slug)} className="underline">{f.title}</Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-neutral-700">
        Before you change anything, read <Link href="/safety/" className="underline">what disabling does and how to undo it</Link>.
      </p>
    </main>
  );
}
