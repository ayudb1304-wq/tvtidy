#!/usr/bin/env python3
"""Sync the upstream CleanYourTV lists and write TVTidy's normalized data.

1. Clone (or fetch) the upstream repo into a cache outside this repo and check out a pinned commit.
2. Parse every examples/<model>/tv.json and debloat.txt (format: docs/upstream-structure.md).
3. If any list cannot be parsed, write data/normalized/unparsed.json and exit 1 without touching
   anything else, so a model is never dropped silently.
4. Otherwise copy the lists and LICENSE into data/upstream/, write NOTICE, merge
   data/overrides/packages.json, and write data/normalized/{brands,models,packages,changelog}.json.

Upstream content is untrusted data: it is parsed as text and never executed.

Usage: python scripts/sync_upstream.py [--commit SHA_OR_REF]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from collections import Counter
from pathlib import Path

UPSTREAM_URL = "https://github.com/Gathin23/cleanyourtv"
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "tvtidy" / "upstream"

# The same package-name rule upstream's tools/disable.sh applies before it touches a TV.
PKG_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$")
# A commented-out package needs two dots, so "README.md" or "config.json" in prose is not one.
KEPT_PKG_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+){2,}$")
RULED_HEADER_RE = re.compile(r"^(?:-{2,}|={2,}|#+)\s*(\w.*?)\s*(?:-{2,}|={2,}|#+)?$")
COMMIT_ARG_RE =re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/^~-]*$")

# Copied from upstream tools/disable.sh (CORE_RE, CORE_OK) at 095b71a: without these packages Android
# or the TV middleware can stop booting (upstream #884, #1578).
CORE_RE = re.compile(
    r"^(android|android\.ext\.(services|shared)|com\.android\.systemui|com\.android\.shell"
    r"|com\.android\.phone|com\.android\.settings|com\.android\.tv\.settings"
    r"|com\.(google\.)?android\.(permissioncontroller|packageinstaller|ext\.services|ext\.shared"
    r"|modulemetadata)|com\.google\.android\.overlay\.modules.*|com\.android\.providers\..*"
    r"|com\.cltv\.mal|com\.mediatek\.(tis|tv\.service|tv\.agent))$"
)
CORE_OK = re.compile(r"^com\.android\.providers\.(calendar|contacts|userdictionary|blockednumber)$")
# Upstream lists disable these because they also install their own launcher; TVTidy does not.
STOCK_LAUNCHERS = {
    "com.google.android.apps.tv.launcherx",
    "com.google.android.tvlauncher",
    "com.google.android.leanbacklauncher",
}
# Disabling it deletes the Wi-Fi network saved during setup, which drops the TV's Wi-Fi ADB.
SETUPWRAITH = "com.google.android.tungsten.setupwraith"

REQUIRED_TV_KEYS = ("tv", "os", "brand", "notes")
CATEGORIES = ("ads", "telemetry", "preinstalled_app", "system_risky")
SAFE_VALUES = ("yes", "caution", "no")
UNVERIFIED = "Unverified"
UPSTREAM_FILES = ("tv.json", "README.md")

# Group-header keywords, checked in this order; the first match is the header's category.
CATEGORY_KEYWORDS = [
    ("telemetry", re.compile(
        r"telemetry|analytic|tracking|tracker|\bacr\b|feedback|metric|statistic|diagnos|crash"
        r"|bug ?report|logging|data collection|usage data|remote support", re.I)),
    ("ads", re.compile(
        r"\bads?\b|advert|promo|sponsor|recommendation|content rows?|partner|marketing|shopping", re.I)),
    ("preinstalled_app", re.compile(
        r"preload|pre-?installed|\bapps?\b|demo|games?|store|retail|bloat|streaming|music|video", re.I)),
]

NOTICE = """\
Lists derived from CleanYourTV, (c) its contributors, MIT License; TVTidy is unaffiliated.

Source: {url}
Commit: {commit}

Copied from that commit: LICENSE, and examples/<model>/tv.json, debloat*.txt and README.md.
The upstream copyright and permission notice is in LICENSE in this directory.
"""


class SyncError(Exception):
    """A problem with our own inputs (arguments, overrides), as opposed to an upstream list."""


# ---------------------------------------------------------------------------------------------
# Parsing


def exclusion_reason(pkg: str) -> str | None:
    """Why TVTidy never applies this package, or None."""
    if CORE_RE.match(pkg) and not CORE_OK.match(pkg):
        return "core_android"
    if pkg in STOCK_LAUNCHERS:
        return "stock_launcher"
    if pkg == SETUPWRAITH:
        return "setupwraith_wifi"
    return None


def _kept_package(body: str) -> dict | None:
    """A commented-out package line such as '# com.vendor.app  # reason' or '# - com.vendor.app: reason'."""
    body = body.lstrip("-").strip()
    if not body:
        return None
    token, _, rest = body.partition(" ")
    token = token.rstrip(":")
    if not KEPT_PKG_RE.match(token):
        return None
    note = rest.strip().lstrip("#:-").strip()
    return {"id": token, "note": note or None}


def parse_debloat(text: str) -> dict:
    """Parse a debloat.txt into active packages, kept (commented-out) packages and the first header line.

    Returns {"packages": [{id, group, note}], "kept": [{id, note}], "first_line": str|None,
    "bad_tokens": [str]}.
    """
    text = text.removeprefix("﻿").replace("\r\n", "\n").replace("\r", "\n")
    packages: list[dict] = []
    kept: list[dict] = []
    bad: list[str] = []
    seen: set[str] = set()
    first_line = None
    group = None
    prev_blank = True
    in_top_header = True  # the comment block that opens the file describes the TV, not a group

    for raw in text.split("\n"):
        s = raw.strip()
        if not s:
            prev_blank = True
            in_top_header = False
            continue
        if s.startswith("#"):
            body = s[1:].strip()
            if first_line is None and body:
                first_line = body
            kept_pkg = _kept_package(body)
            ruled = RULED_HEADER_RE.match(body)
            if kept_pkg:
                kept.append(kept_pkg)
            elif ruled:
                # "# --- Title ---" marks a group even with no blank line before it.
                group = ruled.group(1)
                in_top_header = False
            elif prev_blank and not in_top_header and body:
                group = body
            prev_blank = False
            continue

        in_top_header = False
        prev_blank = False
        token = re.sub(r"\s+#.*$", "", s).split()[0]
        if not PKG_RE.match(token):
            bad.append(token)
            continue
        if token in seen:
            continue
        seen.add(token)
        note = s.split("#", 1)[1].strip() if re.search(r"\s#", s) else ""
        packages.append({"id": token, "group": group, "note": note or None})

    kept_ids: set[str] = set()
    kept_unique = []
    for k in kept:
        if k["id"] not in seen and k["id"] not in kept_ids:
            kept_ids.add(k["id"])
            kept_unique.append(k)
    return {"packages": packages, "kept": kept_unique, "first_line": first_line, "bad_tokens": bad}


def parse_os(os_raw: str) -> tuple[str, str | None]:
    """Map tv.json "os" free text to (platform, android major version)."""
    low = os_raw.lower()
    if "fire os" in low:
        platform = "fire_os"
    elif low.startswith("google tv"):
        platform = "google_tv"
    elif "android tv" in low:
        platform = "android_tv"
    elif "google tv" in low:
        platform = "google_tv"
    elif "android" in low:
        platform = "android"
    else:
        platform = "other"
    m = re.search(r"android(?: tv)? (\d+)", low) or re.search(r"google tv (\d+)", low)
    return platform, (m.group(1) if m else None)


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def parse_model(model_dir: Path) -> tuple[dict | None, str | None]:
    """Parse one examples/<slug>/ folder. Returns (parsed, None) or (None, reason)."""
    tv_path = model_dir / "tv.json"
    list_path = model_dir / "debloat.txt"
    if not tv_path.is_file():
        return None, "missing tv.json"
    if not list_path.is_file():
        return None, "missing debloat.txt"
    try:
        tv = json.loads(tv_path.read_text(encoding="utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        return None, f"tv.json is not valid JSON: {exc}"
    if not isinstance(tv, dict):
        return None, "tv.json is not an object"
    missing = [k for k in REQUIRED_TV_KEYS if not isinstance(tv.get(k), str) or not tv[k].strip()]
    if missing:
        return None, f"tv.json is missing {', '.join(missing)}"
    try:
        parsed = parse_debloat(list_path.read_text(encoding="utf-8"))
    except UnicodeDecodeError as exc:
        return None, f"debloat.txt is not UTF-8: {exc}"
    if parsed["bad_tokens"]:
        return None, "not a package name: " + ", ".join(parsed["bad_tokens"][:5])
    if not parsed["packages"]:
        return None, "no package names in debloat.txt"
    parsed["tv"] = tv
    parsed["variants"] = sorted(
        p.name for p in model_dir.glob("debloat-*.txt") if p.is_file() and not p.is_symlink()
    )
    parsed["has_readme"] = (model_dir / "README.md").is_file()
    return parsed, None


# ---------------------------------------------------------------------------------------------
# Normalizing


def build_model(slug: str, parsed: dict, commit: str, last_changed: str | None) -> dict:
    tv = parsed["tv"]
    platform, android_version = parse_os(tv["os"])
    packages, excluded = [], []
    for p in parsed["packages"]:
        reason = exclusion_reason(p["id"])
        if reason:
            excluded.append({"id": p["id"], "reason": reason})
        else:
            packages.append(p)
    return {
        "slug": slug,
        "brand_slug": slugify(tv["brand"]),
        "brand_display": tv["brand"].strip(),
        "display_name": tv["tv"].strip(),
        "os_raw": tv["os"].strip(),
        "platform": platform,
        "android_version": android_version,
        "firmware_note": parsed["first_line"],
        "upstream_notes": tv["notes"].strip(),
        "upstream_path": f"examples/{slug}/debloat.txt",
        "upstream_commit": commit,
        "last_changed_at": last_changed,
        "has_readme": parsed["has_readme"],
        "variants": [f"examples/{slug}/{name}" for name in parsed["variants"]],
        "packages": packages,
        "kept_packages": parsed["kept"],
        "excluded_packages": excluded,
    }


def header_category(header: str | None) -> str | None:
    if not header:
        return None
    for category, pattern in CATEGORY_KEYWORDS:
        if pattern.search(header):
            return category
    return None


def validate_overrides(overrides: object) -> dict:
    if not isinstance(overrides, dict):
        raise SyncError("data/overrides/packages.json must be a JSON object keyed by package id")
    for pkg, entry in overrides.items():
        if not PKG_RE.match(pkg):
            raise SyncError(f"overrides: {pkg!r} is not a package name")
        if not isinstance(entry, dict):
            raise SyncError(f"overrides: {pkg} must map to an object")
        unknown = set(entry) - {"description", "category", "safe_to_disable"}
        if unknown:
            raise SyncError(f"overrides: {pkg} has unknown fields {sorted(unknown)}")
        if "category" in entry and entry["category"] not in CATEGORIES:
            raise SyncError(f"overrides: {pkg} category must be one of {CATEGORIES}")
        if "safe_to_disable" in entry and entry["safe_to_disable"] not in SAFE_VALUES:
            raise SyncError(f"overrides: {pkg} safe_to_disable must be one of {SAFE_VALUES}")
        if "description" in entry and (not isinstance(entry["description"], str) or not entry["description"].strip()):
            raise SyncError(f"overrides: {pkg} description must be a non-empty string")
    return overrides


def build_packages(models: list[dict], overrides: dict) -> list[dict]:
    seen: Counter[str] = Counter()
    kept: Counter[str] = Counter()
    votes: dict[str, Counter[str]] = {}
    notes: dict[str, Counter[str]] = {}
    for m in models:
        for p in m["packages"]:
            seen[p["id"]] += 1
            category = header_category(p["group"])
            if category:
                votes.setdefault(p["id"], Counter())[category] += 1
            if p["note"]:
                notes.setdefault(p["id"], Counter())[p["note"]] += 1
        for p in m["excluded_packages"]:
            seen[p["id"]] += 1
        for p in m["kept_packages"]:
            kept[p["id"]] += 1

    order = [c for c, _ in CATEGORY_KEYWORDS]
    result = []
    for pkg in sorted(seen):
        ov = overrides.get(pkg, {})
        reason = exclusion_reason(pkg)
        if reason:
            # Never applied, whatever an override says (docs/upstream-structure.md section 7).
            category, source, safe = "system_risky", "rule", "no"
        elif "category" in ov:
            category, source, safe = ov["category"], "override", ov.get("safe_to_disable", "caution")
        else:
            ranked = sorted(votes.get(pkg, Counter()).items(), key=lambda kv: (-kv[1], order.index(kv[0])))
            category = ranked[0][0] if ranked else "preinstalled_app"
            source, safe = "heuristic", ov.get("safe_to_disable", "caution")
        top_notes = sorted(notes.get(pkg, Counter()).items(), key=lambda kv: (-kv[1], kv[0]))[:5]
        result.append({
            "id": pkg,
            "seen_on_model_count": seen[pkg],
            "kept_on_model_count": kept[pkg],
            "category": category,
            "category_source": source,
            "safe_to_disable": safe,
            "description": ov.get("description", UNVERIFIED),
            "excluded_reason": reason,
            "upstream_notes": [n for n, _ in top_notes],
        })
    return result


def build_brands(models: list[dict]) -> list[dict]:
    names: dict[str, Counter[str]] = {}
    for m in models:
        names.setdefault(m["brand_slug"], Counter())[m["brand_display"]] += 1
    brands = []
    for slug in sorted(names):
        display = sorted(names[slug].items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
        brands.append({"slug": slug, "display_name": display, "model_count": sum(names[slug].values())})
    return brands


def build_changelog(previous: list[dict] | None, current: list[dict], to_commit: str) -> dict:
    """Packages added and removed per model, and models added or removed, since the previous run."""
    changelog = {
        "from_commit": None,
        "to_commit": to_commit,
        "models_added": [],
        "models_removed": [],
        "packages_changed": [],
    }
    if previous is None:
        return changelog
    changelog["from_commit"] = previous[0]["upstream_commit"] if previous else None
    before = {m["slug"]: {p["id"] for p in m["packages"]} for m in previous}
    after = {m["slug"]: {p["id"] for p in m["packages"]} for m in current}
    changelog["models_added"] = sorted(after.keys() - before.keys())
    changelog["models_removed"] = sorted(before.keys() - after.keys())
    for slug in sorted(after.keys() & before.keys()):
        added, removed = sorted(after[slug] - before[slug]), sorted(before[slug] - after[slug])
        if added or removed:
            changelog["packages_changed"].append({"slug": slug, "added": added, "removed": removed})
    return changelog


# ---------------------------------------------------------------------------------------------
# Git and files


def git(*args: str, cwd: Path | None = None) -> str:
    return subprocess.run(
        ["git", *args], cwd=cwd, check=True, capture_output=True, text=True
    ).stdout.strip()


def checkout_upstream(url: str, cache: Path, commit: str) -> str:
    """Clone or fetch upstream into cache, check out commit (sparse: examples/ and root files)."""
    if (cache / ".git").is_dir():
        git("remote", "set-url", "origin", url, cwd=cache)
        git("fetch", "--quiet", "--prune", "origin", cwd=cache)
    else:
        cache.parent.mkdir(parents=True, exist_ok=True)
        if cache.exists():
            shutil.rmtree(cache)
        git("clone", "--quiet", "--filter=blob:none", "--no-checkout", url, str(cache))
        git("sparse-checkout", "set", "examples", cwd=cache)
    ref = "origin/HEAD" if commit == "HEAD" else commit
    try:
        sha = git("rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}", cwd=cache)
    except subprocess.CalledProcessError:
        raise SyncError(f"upstream has no commit {commit!r}") from None
    git("-c", "advice.detachedHead=false", "checkout", "--quiet", "--force", "--detach", sha, cwd=cache)
    return sha


def last_changed_dates(cache: Path, sha: str) -> dict[str, str]:
    """Date (YYYY-MM-DD) of the newest commit touching each examples/<slug>/, from one git log pass."""
    log = git("log", "--no-renames", "--format=%x00%cs", "--name-only", sha, "--", "examples", cwd=cache)
    dates: dict[str, str] = {}
    for chunk in log.split("\x00"):
        lines = [ln for ln in chunk.splitlines() if ln.strip()]
        if not lines:
            continue
        date = lines[0]
        for path in lines[1:]:
            parts = path.split("/")
            if len(parts) >= 3 and parts[0] == "examples":
                dates.setdefault(parts[1], date)
    return dates


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def read_json(path: Path) -> object | None:
    return json.loads(path.read_text(encoding="utf-8")) if path.is_file() else None


def copy_upstream(src: Path, dest: Path, slugs: list[str], sha: str) -> None:
    """Mirror LICENSE and each model's tv.json, debloat*.txt and README.md into dest; write NOTICE."""
    dest.mkdir(parents=True, exist_ok=True)
    if (dest / "examples").exists():
        shutil.rmtree(dest / "examples")
    for slug in slugs:
        out = dest / "examples" / slug
        out.mkdir(parents=True)
        for f in sorted((src / "examples" / slug).iterdir()):
            wanted = f.name in UPSTREAM_FILES or re.fullmatch(r"debloat(-[\w.-]+)?\.txt", f.name)
            if wanted and f.is_file() and not f.is_symlink():
                shutil.copyfile(f, out / f.name)
    shutil.copyfile(src / "LICENSE", dest / "LICENSE")
    (dest / "NOTICE").write_text(NOTICE.format(url=UPSTREAM_URL, commit=sha), encoding="utf-8")


# ---------------------------------------------------------------------------------------------


def run(url: str, cache: Path, data_dir: Path, commit: str) -> int:
    if not COMMIT_ARG_RE.match(commit):
        raise SyncError(f"--commit {commit!r} is not a commit or ref")
    normalized = data_dir / "normalized"
    overrides = validate_overrides(read_json(data_dir / "overrides" / "packages.json") or {})

    sha = checkout_upstream(url, cache, commit)
    if not (cache / "LICENSE").is_file():
        raise SyncError(f"upstream commit {sha} has no LICENSE; stop and re-check the licence")
    dates = last_changed_dates(cache, sha)

    parsed, unparsed = {}, []
    examples = cache / "examples"
    for model_dir in sorted(p for p in examples.iterdir() if p.is_dir() and not p.is_symlink()):
        result, reason = parse_model(model_dir)
        if result is None:
            unparsed.append({"slug": model_dir.name, "path": f"examples/{model_dir.name}", "reason": reason})
        else:
            parsed[model_dir.name] = result

    if unparsed:
        write_json(normalized / "unparsed.json", {"upstream_commit": sha, "lists": unparsed})
        print(f"error: {len(unparsed)} list(s) could not be parsed at {sha}; see {normalized / 'unparsed.json'}."
              " Nothing else was written.", file=sys.stderr)
        for u in unparsed:
            print(f"  {u['path']}: {u['reason']}", file=sys.stderr)
        return 1

    models = [build_model(slug, p, sha, dates.get(slug)) for slug, p in parsed.items()]
    packages = build_packages(models, overrides)
    brands = build_brands(models)

    previous = read_json(normalized / "models.json")
    changelog_path = normalized / "changelog.json"
    same_commit = bool(previous) and previous[0]["upstream_commit"] == sha
    if not (same_commit and changelog_path.is_file()):
        write_json(changelog_path, build_changelog(previous, models, sha))

    copy_upstream(cache, data_dir / "upstream", list(parsed), sha)
    write_json(normalized / "models.json", models)
    write_json(normalized / "packages.json", packages)
    write_json(normalized / "brands.json", brands)
    (normalized / "unparsed.json").unlink(missing_ok=True)

    changelog = read_json(changelog_path)
    print(f"upstream {sha}: {len(brands)} brands, {len(models)} models, {len(packages)} unique packages")
    print(f"changelog since {changelog['from_commit'] or 'nothing (first run)'}: "
          f"{len(changelog['models_added'])} models added, {len(changelog['models_removed'])} removed, "
          f"{len(changelog['packages_changed'])} with package changes")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--commit", default="HEAD", help="upstream commit or ref (default: HEAD of the default branch)")
    parser.add_argument("--repo", default=UPSTREAM_URL, help=argparse.SUPPRESS)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE, help="where the upstream clone lives")
    parser.add_argument("--data-dir", type=Path, default=REPO_ROOT / "data", help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    try:
        return run(args.repo, args.cache_dir, args.data_dir, args.commit)
    except SyncError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    except subprocess.CalledProcessError as exc:
        print(f"error: git {' '.join(exc.cmd[1:])} failed: {exc.stderr.strip()}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
