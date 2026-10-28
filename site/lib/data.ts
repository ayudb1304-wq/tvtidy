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

/** "Acer AR55AR2851UDPRO 55\" (SCBC R4, Realtek rtd2851m), India" becomes "Acer AR55AR2851UDPRO 55\"". */
export function shortName(model: Pick<Model, "display_name">): string {
  const short = model.display_name.split(" (")[0].replace(/[,;:\s]+$/, "").trim();
  return short || model.display_name;
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
