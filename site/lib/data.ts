// Build-time access to data/normalized/*.json (written by scripts/sync_upstream.py).
// Server-only: it reads files with fs, so import it from pages, never from client components.
import { readFileSync } from "node:fs";
import path from "node:path";

export const UPSTREAM_REPO = "https://github.com/Gathin23/cleanyourtv";

export type SafeToDisable = "yes" | "caution" | "no";
export type Category = "ads" | "telemetry" | "preinstalled_app" | "system_risky";
export type ExcludedReason = "core_android" | "stock_launcher" | "setupwraith_wifi";

export interface ModelPackage {
  id: string;
  group: string | null;
  note: string | null;
}

export interface KeptPackage {
  id: string;
  note: string | null;
}

export interface ExcludedPackage {
  id: string;
  reason: ExcludedReason;
}

export interface Model {
  slug: string;
  brand_slug: string;
  brand_display: string;
  display_name: string;
  os_raw: string;
  platform: "android_tv" | "google_tv" | "fire_os" | "android" | "other";
  android_version: string | null;
  firmware_note: string | null;
  upstream_notes: string;
  upstream_path: string;
  upstream_commit: string;
  last_changed_at: string | null;
  has_readme: boolean;
  variants: string[];
  packages: ModelPackage[];
  kept_packages: KeptPackage[];
  excluded_packages: ExcludedPackage[];
}

export interface Package {
  id: string;
  seen_on_model_count: number;
  kept_on_model_count: number;
  category: Category;
  category_source: "override" | "heuristic" | "rule";
  safe_to_disable: SafeToDisable;
  description: string;
  excluded_reason: ExcludedReason | null;
  upstream_notes: string[];
}

export interface Brand {
  slug: string;
  display_name: string;
  model_count: number;
}

export const UNVERIFIED = "Unverified";

const DATA_DIR = path.join(process.cwd(), "..", "data", "normalized");
const cache = new Map<string, unknown>();

function load<T>(name: string): T {
  if (!cache.has(name)) {
    cache.set(name, JSON.parse(readFileSync(path.join(DATA_DIR, name), "utf8")));
  }
  return cache.get(name) as T;
}

export const getModels = (): Model[] => load<Model[]>("models.json");
export const getBrands = (): Brand[] => load<Brand[]>("brands.json");

let packageIndex: Map<string, Package> | undefined;
export function getPackage(id: string): Package | undefined {
  packageIndex ??= new Map(load<Package[]>("packages.json").map((p) => [p.id, p]));
  return packageIndex.get(id);
}

export function getBrand(slug: string): Brand | undefined {
  return getBrands().find((b) => b.slug === slug);
}

/** URL segment for a model inside its brand: "xiaomi-mi-tv-4a" under "xiaomi" becomes "mi-tv-4a". */
export function modelParam(model: Pick<Model, "slug" | "brand_slug">): string {
  const prefix = `${model.brand_slug}-`;
  return model.slug.startsWith(prefix) && model.slug.length > prefix.length
    ? model.slug.slice(prefix.length)
    : model.slug;
}

export function modelPath(model: Pick<Model, "slug" | "brand_slug">): string {
  return `/tv/${model.brand_slug}/${modelParam(model)}/`;
}

export function findModel(brand: string, param: string): Model | undefined {
  return getModels().find((m) => m.brand_slug === brand && modelParam(m) === param);
}

export function modelsForBrand(brand: string): Model[] {
  return getModels().filter((m) => m.brand_slug === brand);
}

function baseName(displayName: string): string {
  return displayName.split(" (")[0].replace(/[,;:\s]+$/, "").trim() || displayName;
}

let shortNames: Map<string, string> | undefined;
/**
 * The model's name without the details in parentheses: "Acer AR55AR2851UDPRO 55\" (SCBC R4, Realtek
 * rtd2851m), India" becomes "Acer AR55AR2851UDPRO 55\"". When two models would share a name, the first
 * detail in parentheses is added ("OnePlus TV (Dosa)"), then the OS, then the full name.
 */
export function shortName(model: Pick<Model, "slug" | "display_name" | "os_raw">): string {
  if (!shortNames) {
    const models = getModels();
    const firstDetail = (m: Model) => m.display_name.match(/\(([^,)]+)/)?.[1].trim();
    const candidates: ((m: Model) => string)[] = [
      (m) => baseName(m.display_name),
      (m) => (firstDetail(m) ? `${baseName(m.display_name)} (${firstDetail(m)})` : m.display_name),
      (m) => `${baseName(m.display_name)}, ${m.os_raw}`,
      (m) => m.display_name,
    ];
    shortNames = new Map();
    let pending = models;
    for (const candidate of candidates) {
      const counts = new Map<string, number>();
      for (const m of pending) counts.set(candidate(m), (counts.get(candidate(m)) ?? 0) + 1);
      const taken = new Set(shortNames.values());
      const next: Model[] = [];
      for (const m of pending) {
        const name = candidate(m);
        if (counts.get(name) === 1 && !taken.has(name)) shortNames.set(m.slug, name);
        else next.push(m);
      }
      pending = next;
    }
    for (const m of pending) shortNames.set(m.slug, m.display_name);
  }
  return shortNames.get(model.slug) ?? baseName(model.display_name);
}

export interface RatedPackage extends ModelPackage {
  safe: SafeToDisable;
  category: Category;
  /** Our verified description, or null when the package has no override yet. */
  description: string | null;
}

/** The model's applicable packages with their TVTidy rating, in upstream order. */
export function ratedPackages(model: Model): RatedPackage[] {
  return model.packages.map((p) => {
    const info = getPackage(p.id);
    const description = info && info.description !== UNVERIFIED ? info.description : null;
    return {
      ...p,
      safe: info?.safe_to_disable ?? "caution",
      category: info?.category ?? "preinstalled_app",
      description,
    };
  });
}

export function upstreamFileUrl(model: Model): string {
  return `${UPSTREAM_REPO}/blob/${model.upstream_commit}/${model.upstream_path}`;
}

export function upstreamCommitUrl(model: Model): string {
  return `${UPSTREAM_REPO}/commit/${model.upstream_commit}`;
}

export const getAllPackages = (): Package[] => load<Package[]>("packages.json");

/** A package page is indexed only when it has a hand-written override; the rest stay noindex. */
export const isPackageIndexed = (p: Package): boolean => p.category_source === "override";

export function packagePath(id: string): string {
  return `/package/${id}/`;
}

let packageModels: Map<string, { active: Model[]; kept: Model[] }> | undefined;
/** Models whose upstream list disables the package (active or excluded), and models that keep it. */
export function modelsForPackage(id: string): { active: Model[]; kept: Model[] } {
  if (!packageModels) {
    packageModels = new Map();
    const entry = (pkg: string) => {
      if (!packageModels!.has(pkg)) packageModels!.set(pkg, { active: [], kept: [] });
      return packageModels!.get(pkg)!;
    };
    for (const m of getModels()) {
      for (const p of [...m.packages, ...m.excluded_packages]) entry(p.id).active.push(m);
      for (const p of m.kept_packages) entry(p.id).kept.push(m);
    }
  }
  return packageModels.get(id) ?? { active: [], kept: [] };
}

export function brandPath(slug: string): string {
  return `/brand/${slug}/`;
}

/** The most common packages across a brand's lists, most frequent first. */
export function topPackagesForBrand(brand: string, limit: number): { pkg: Package; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of modelsForBrand(brand)) {
    for (const p of m.packages) counts.set(p.id, (counts.get(p.id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id, count]) => ({ pkg: getPackage(id)!, count }));
}

export interface FixStep {
  name: string;
  text: string;
}

export interface Fix {
  slug: string;
  title: string;
  description: string;
  symptom: string;
  steps: FixStep[];
  /** Packages this fix disables or discusses; each must exist in packages.json. */
  packages: string[];
}

const FIXES_FILE = path.join(process.cwd(), "..", "data", "fixes.json");
let fixes: Fix[] | undefined;
export function getFixes(): Fix[] {
  fixes ??= JSON.parse(readFileSync(FIXES_FILE, "utf8")) as Fix[];
  return fixes;
}

export function fixPath(slug: string): string {
  return `/fix/${slug}/`;
}

/** Models whose lists contain the most of the given packages: "the 5 most common models in the fix". */
export function topModelsForPackages(ids: string[], limit: number): Model[] {
  const wanted = new Set(ids);
  return getModels()
    .map((m) => ({ m, n: m.packages.filter((p) => wanted.has(p.id)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.m.slug.localeCompare(b.m.slug))
    .slice(0, limit)
    .map((x) => x.m);
}
