Decisions Claude Code made that CLAUDE.md did not cover.

## Session 1 (scaffold), 2026-10-28

- **Next.js 15.5.28**, the latest 15.x. The kit asks for 15; `latest` on npm is 16.
- **Vitest 4.1.12, not 5.** Vitest 5 requires Node 22.12+, and `.nvmrc` pins Node 20 per the
  kit. Moving to Node 22 would allow Vitest 5.
- **TypeScript 5.9.3, not 7.** TypeScript 7 is the native rewrite, and Next 15 type-checks through the
  TypeScript JS API, so 5.x is the safe pairing.
- **`site/package-lock.json` was generated with npm 11** (`npx npm@11 install`). npm 10.9 crashes with
  "Cannot read properties of null (reading 'edgesOut')" while resolving Vitest's optional browser
  peers. `npm ci` with npm 10 installs from the lockfile without problems, so CI on Node 20 is fine.
  Use npm 11 to add or upgrade site dependencies.
- **`npm audit` reports postcss advisories in the copy bundled inside `next@15`.** The fix is Next 16.
  They concern processing attacker-controlled CSS at build time; we only build our own CSS, so this is
  accepted for now.
- **Deploys go through `cloudflare/wrangler-action` (`deploy.yml`), not Cloudflare's Git
  integration** from kit section 7. Using both would deploy every push twice. The Pages project is
  named `tvtidy`.
- **The footer disclaimer lives in `site/lib/disclaimer.ts`** and is rendered in the root layout, so
  every page has it. The vitest test compares it with the text in `docs/gtm-kit.md` section 14, so
  any drift fails the tests.
- **Route folders (`app/tv/[brand]/[model]` and the others) are not created yet.** A dynamic route
  with no params fails a static export; Sessions 3 to 5 add them with their pages. Empty top-level
  directories are kept with `.gitkeep`, and `scripts/tests/test_layout.py` checks they exist.
- **pytest is configured in `pyproject.toml`** (`testpaths = scripts, helper`) and pinned in
  `requirements-dev.txt`. The Makefile uses `.venv/bin/python` when the venv exists.

## Session 2 (upstream sync), 2026-10-28

- **The upstream clone lives outside the repo**, in `~/.cache/tvtidy/upstream` (`--cache-dir` to
  change it), as a partial clone (`--filter=blob:none`) with a sparse checkout of `examples/` and the
  root files. Upstream's `CLAUDE.md`, `AGENTS.md` and `PROMPT.md` never land in our tree.
- **`data/upstream/` holds only `LICENSE`, `NOTICE` and `examples/<model>/{tv.json, debloat*.txt,
  README.md}`** (about 2.3 MB, 774 files) and is committed. `sync.yml` commits it along with
  `data/normalized/`, although the Session 2 prompt names only `data/normalized/`. The MIT notice has
  to travel with the copied lists, and a committed copy makes each sync's list changes reviewable.
- **Forced `no` beats overrides.** Stock launchers, setupwraith and `CORE_RE` packages are always
  `safe_to_disable: "no"` and `category: "system_risky"` (`category_source: "rule"`), as agreed in
  `docs/upstream-structure.md` section 7. CLAUDE.md's "overrides win" applies to every other
  package. An override's description is still used for these packages. `packages.json` has an extra
  `excluded_reason` field (`core_android`, `stock_launcher`, `setupwraith_wifi` or `null`).
- **An unparsed list writes only `unparsed.json`** and exits 1. Every other output, including
  `data/upstream/`, is left as it was, so the data always matches one upstream commit. A successful
  run deletes a stale `unparsed.json`. Bad overrides or a bad `--commit` exit 2.
- **The changelog compares the applicable `packages`, not excluded ones.** If upstream adds a stock
  launcher to a list, that isn't a change for TVTidy users. Re-running the same commit keeps the
  previous changelog, so a quiet night produces no commit. Outputs have no timestamps, so identical
  input gives byte-identical files. A renamed model shows up as one removed and one added.
- **The category heuristic** checks group headers in the order telemetry, ads, preinstalled_app and
  takes the most common category across models. With no header match it defaults to
  `preinstalled_app`, which is 980 of the 1,495 packages. Those are the first candidates for overrides.
- **Group headers** are the first line of a comment block after a blank line, or a `# --- Title`
  line. 156 of 7,864 applicable package lines have no group; 6 lists use no headers at all.
- **`kept_packages`** are commented-out lines whose first token is a package name with at least two
  dots, so `README.md` in prose isn't counted. Only the note's first line is kept. A quirk that names a
  package can be picked up (for example `com.google.android.gms` on `aipro2k`); they are display-only.
- **Extra lists** (`debloat-*.txt`) are recorded in `variants` and copied, but not parsed.
- **`last_changed_at`** is the committer date of the newest upstream commit touching the model's
  folder, read in one `git log` pass. `firmware_note` is the whole first header comment line.
- **`deploy.yml` also runs on `workflow_run` after "Sync upstream lists"** succeeds. Pushes made with
  `GITHUB_TOKEN` don't trigger push workflows, so without it the nightly commits would never deploy.
  It redeploys nightly even when nothing changed, about 30 of the 500 monthly Pages builds.
- **`--commit` is validated** (no leading `-`), and `sync.yml` passes the dispatch input through an
  environment variable, not straight into the shell line.

## Session 3 (model pages), 2026-10-28

- **H1 and `<title>` use the kit's section 9 pattern**, "{Model} debloat list: remove ads and bloat
  (reversible)", as the Session 3 prompt says. Section 14's copy skeleton has a different H1
  ("...remove ads and preinstalled apps..."); pick one if that matters.
- **`{Model}` is a short name:** `display_name` up to its first " (", so "Acer AR55AR2851UDPRO 55\"
  (SCBC R4, Realtek rtd2851m), India" becomes "Acer AR55AR2851UDPRO 55\"". The full name stays on the
  data side.
- **URLs are `/tv/<brand_slug>/<folder name minus the brand prefix>/`**, for example
  `/tv/xiaomi/mi-tv-4a/`. Folders that don't start with the brand keep their full name. A test
  checks that the 345 paths are unique.
- **"Last synced" shows the list's `last_changed_at` and the upstream commit.** The sync keeps no
  timestamp of its own, so its output stays byte-identical for the same commit.
- **The description column** shows the override description when there is one. Otherwise it says
  "Unverified." plus upstream's comment for that package on that model, per CLAUDE.md.
- **Added a "Left out on purpose" list** under the table, naming each excluded package (stock
  launcher, setupwraith, core Android) and why TVTidy never disables it.
- **The caution toggle is off by default.** With no `yes` packages, which is every model until
  overrides exist, both command blocks show a message instead of commands. Restore lines are
  `adb shell pm enable --user 0 <pkg>`, matching whatever the disable block shows.
- **The package table is stacked cards below the `sm` breakpoint and a table above it.** Package ids
  are too long for a four-column table at 375 px.
- **Structured data:** HowTo, FAQPage and BreadcrumbList are emitted on every model page and parse as
  JSON on all 345. Google retired HowTo rich results in 2023 and limits FAQ rich results to
  well-known government and health sites, so the Rich Results Test won't show either for this site.
  The markup stays for Bing and AI search, and validates in the Schema Markup Validator.
- **Breadcrumb and JSON-LD link to `/brand/<slug>/`**, which 404s until Session 4 builds the brand
  hubs. That is also the one console error Lighthouse reports.
- **`SITE_URL` is `https://tvtidy.app`** (`site/lib/site.ts`), used for canonical URLs, the sitemap
  and robots.txt.
- **Vitest compiles JSX with oxc's automatic runtime** (`vitest.config.ts`), because tsconfig keeps
  `"jsx": "preserve"` for Next. Page tests live in `site/tests/`.
- **Lighthouse (mobile, local static server) on `/tv/xiaomi/mi-tv-4a/`:** SEO 100, accessibility
  100, best practices 96 (the brand 404), performance 81 (LCP 3.8 s). The page carries about 100 KB of
  HTML plus the RSC payload; worth trimming before launch.

## Session 4 (package, brand and fix pages), 2026-10-28

- **The top 50 overrides were approved and applied** (`data/overrides/packages.json`; evidence in
  `docs/overrides-review.md`): 27 safe, 23 caution.
- **Every package gets a page (1,495), but only the 50 with an override are indexed.** The rest are
  `noindex, follow` and left out of the sitemap, so search engines don't see 1,445 thin
  "Unverified" pages. Model pages can still link to every package. A page becomes indexable as soon
  as its package gets an override (`isPackageIndexed` in `site/lib/data.ts`). The kit's week-2 rule
  decides how far to expand.
- **Package links are plain `<a>` tags (`components/PackageLink.tsx`), not `next/link`.** Next drops
  the trailing slash from a path whose last segment has a dot (`/package/com.vendor.app/`), so the
  links wouldn't match the canonical URLs and the sitemap. Cloudflare Pages should serve
  `/package/<id>/` from `package/<id>/index.html`. Check one package URL after the first deploy,
  since that path shape is the one place the export could behave differently on Pages.
- **Package pages never show a disable command for a `no` package**, but always show the restore
  command. Someone who disabled a stock launcher by hand can find how to undo it.
- **Brand pages** list every model (with OS, safe and caution counts, and list date), the 10 most
  common packages on that brand's lists with a restore command and a `/safety` link (CLAUDE.md: any
  page listing packages), and the fixes.
- **Fixes live in `data/fixes.json`**: `slug, title, description, symptom, steps[{name, text}],
  packages[]`. That is the kit's section 3 shape plus `description` (meta) and `packages` (which drive
  "TVs this applies to most", the 5 models whose lists contain most of them). There are 4 so far,
  from the kit's first-50 list: remove-ads-google-tv, debloat-without-coding-agent, undo-tv-debloat
  and apps-came-back-after-update. Fix pages show a restore block for their packages but no disable
  block, and point to the model page for that, because the right set depends on the TV.
- **Fix content worth checking on a real TV:** the Google TV "Apps only mode" path (Settings,
  Accounts & Sign In, your account) and the Settings > Apps > Show system apps > Disable path. Both are
  written with "names vary by firmware".
- **Short model names are unique.** 11 names were shared by 28 models (for example three "OnePlus TV").
  For those, `shortName` adds the first detail in parentheses ("OnePlus TV (Dosa)"), then the OS,
  then falls back to the full name. All page titles are unique (checked on the export).
- **The home page** now has an H1, the brand list and the fixes, so every brand and fix page has
  inbound links. Checked on the export: 0 broken internal links. Every model, brand and fix page has
  6+ inbound links, and indexed package pages have 29+.
- **Lighthouse (mobile):** SEO 100 and accessibility 100 on `/brand/xiaomi/`,
  `/fix/remove-ads-google-tv/` and `/package/com.google.android.feedback/`.
- **Build:** 1,945 pages, 3,906 files (limit 20,000), largest file 310 KB, about 41 s.
