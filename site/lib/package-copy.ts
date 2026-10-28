// Package page copy: rating meanings from docs/gtm-kit.md section 5.
import type { Package } from "./data";
import { UNVERIFIED } from "./data";

export const packageTitle = (id: string) => `Is ${id} safe to disable on Android TV?`;

export const RATING_LINE: Record<Package["safe_to_disable"], string> = {
  yes: "Safe to disable. Restores with one command.",
  caution: "Disable only if you don't use what it does.",
  no: "Do not disable. TVTidy leaves it out of every list.",
};

export function packageSummary(p: Package): string {
  const described = p.description !== UNVERIFIED ? ` ${p.description}` : "";
  return `${RATING_LINE[p.safe_to_disable]}${described} Disabled on ${p.seen_on_model_count} community-tested TV ${
    p.seen_on_model_count === 1 ? "list" : "lists"
  }.`;
}
