import type { Category, SafeToDisable } from "@/lib/data";

export const CATEGORY_LABEL: Record<Category, string> = {
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

export const ROW_TINT: Record<SafeToDisable, string> = {
  yes: "",
  caution: "bg-amber-50",
  no: "bg-red-50",
};

export function Badge({ safe }: { safe: SafeToDisable }) {
  const b = BADGE[safe];
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${b.className}`}>{b.label}</span>;
}
