# TVTidy GTM Kit: Build, Deploy, Launch

Oct 28, 2026 · @Ayu

## 1. Product and positioning

TVTidy is a model-by-model guide to what is safe to disable on an Android TV or Google TV, plus a one-click desktop helper that applies and restores a debloat list. The guides are free and drive search traffic; the helper and a small "Firmware Watch" subscription make the money.

**Who it is for.** Owners of Android TV / Google TV sets (Xiaomi, TCL, Hisense, Sony Bravia, Philips, onn, Chromecast with Google TV, Nvidia Shield, OnePlus, Realme, Thomson, Kodak) who saw the CleanYourTV coverage but will not open a terminal, run a coding agent or build an APK from source. Secondary: the same people after a firmware update brings the ads back.

**Positioning line.** "Remove the ads and junk from your TV without a coding agent. Reversible, model-specific, and we build on the community's MIT-licensed lists."

**Three promises, in this order.**

1. Restore first: every action can be undone, and the helper saves a restore file before it touches anything.
2. Model-specific: one page per TV model with the exact packages and commands, not a generic list.
3. No install needed to read, one download to act: the site is static, and the helper is a signed desktop app.

**What's free vs paid.**

| Tier | Price | What you get |
| --- | --- | --- |
| Guides | Free, ads | Every model, brand, package and fix page; copy-paste ADB commands; restore commands |
| Helper | $12 one-time (INR 699 domestic) | Desktop app: find TV, pair, preview, apply, restore, post-update check; all future helper updates |
| Firmware Watch | $2.99/mo or $19/yr | Email when your model's list changes, when community reports show an update re-enabled apps, and when new packages are classified |

**Unaffiliated stance.** TVTidy builds on the [CleanYourTV](https://github.com/Gathin23/cleanyourtv) lists under their MIT license and credits every contributor. It is not run by that project and does not use its name in the brand, domain or logo. The footer, the About page and the helper's first screen all say so. Brand names identify TV models only.

**What TVTidy is not.** Not a rooting tool, not a way around platform rules or DRM, not an ad blocker for streaming apps. It uses Google's documented Android Debug Bridge on the owner's own device, and it only disables packages the owner chooses. Keep this framing identical everywhere (site, helper, payment-provider description, launch posts); it is what keeps the payment review clean.

## 2. Pre-launch gates (do before writing code for payments)

Four things can sink the launch after the work is done, and all four take under a day. Do them on day 0, in parallel with the scaffold.

- [ ] **Dodo Payments compliance pre-check.** Email compliance@dodopayments.com with the product description in section 14. Dodo's [Merchant Acceptance Policy](https://docs.dodopayments.com/miscellaneous/merchant-acceptance) prohibits tools for bypassing platform restrictions; you need a written reply that a reversible, owner-run ADB debloater is acceptable. Do not accept a payment until it arrives.
- [ ] **Dodo verification as an Individual.** Start the [verification process](https://docs.dodopayments.com/miscellaneous/verification-process) with PAN, ID and a bank account in your own name; a personal account makes you an "Individual" seller. Verification runs while you build.
- [ ] **Read the upstream LICENSE file yourself.** The CleanYourTV README says MIT, but GitHub's sidebar labels the license "Other". Open [the repo](https://github.com/Gathin23/cleanyourtv) and read LICENSE before copying a single list. If it is MIT, keep the copyright notice and attribution in your repo and on the site. If it is anything else, stop and re-plan.
- [ ] **Naming and trademark.** Register a domain that does not contain "cleanyourtv" (tvtidy.app or quiethome.tv). Issue #1004 on the upstream repo already flagged an impersonator domain, so a lookalike name would be reported, not tolerated. Use TV brand names only to identify models.
- [ ] **Razorpay scope decision.** Razorpay's [international payments docs](https://next.razorpay.com/docs/payments/payments/international-payments/) say unregistered sellers must use PayPal for international payments and that cards need an eligible registered business. Plan Razorpay for INR domestic only. If you want more, ask Razorpay Support in writing whether an Individual (PAN) account can accept international cards or subscriptions, and keep the reply.
- [ ] **GST position.** Razorpay's guide on export of services says exporters need not register below INR 20 lakh annual turnover (10 lakh in special-category states). You are under that at launch; set a reminder to revisit at INR 15 lakh. I am not a lawyer or tax adviser; confirm with a CA before you cross the threshold.
- [ ] **Safety stance written down.** One page, linked from every model page and the helper: what the tool does, what it never does, how to restore, and that firmware updates can re-enable packages. This page is your defense against chargebacks and the "it bricked my TV" thread.

**Go / no-go.** Proceed to payments only when the first three boxes are ticked. Everything else can ship on the free site while they clear.

## 3. Architecture and repo layout

The site is a static Next.js export on Cloudflare Pages; the only server-side pieces are Supabase (accounts, licenses, watches) and a nightly GitHub Action that syncs lists and sends watch emails. Nothing scales with free visitors, which is what keeps the bill near $0.

&#91;embedded content: system map · 10 parts, 3 rows\]

The top row is the free, static path and costs nothing per visitor; the middle row runs only when someone pays or a list changes; the bottom row is the paid helper, which talks to the TV directly and touches your servers only to activate a key.

**Stack and free tiers.**

| Layer | Choice | Tier used | Why |
| --- | --- | --- | --- |
| Site | Next.js 15, static export, Tailwind | Cloudflare Pages free (500 builds/mo, 20,000 files/site, 25 MiB per asset) | Fast, cached at the edge, Claude Code knows it well |
| Data | JSON files generated from upstream lists, committed to the repo | GitHub, free for public repos | No database queries on page load; every page is prebuilt |
| Accounts, licenses, watches | Supabase Postgres + Auth (magic link) | Supabase free | One table each; tiny row counts |
| Email | Resend | Resend free | Watch alerts and license receipts |
| Payments | Dodo Payments checkout + webhooks; Razorpay Payment Links for INR | Per-transaction fees only | Merchant of record handles tax and international cards |
| Webhook receiver | Cloudflare Worker | Workers free (100k requests/day) | Verifies Dodo webhook signature, writes license to Supabase |
| Helper | Python 3.12, adb via `adb-shell` or bundled platform-tools, PySide6 GUI, PyInstaller builds | GitHub Actions (Win/Mac/Linux runners) | Mainstream, Claude Code handles it; one codebase, three binaries |
| Signing | Azure Artifact Signing Basic ($9.99/mo), Apple Developer ($99/yr, optional at launch) | Paid | Unsigned helpers trigger SmartScreen warnings that kill conversion |
| Analytics | Cloudflare Web Analytics + Google Search Console + Bing Webmaster | Free | Enough to decide which page templates to expand |

Free-tier limits are from published plans as I know them; verify each before relying on it.

**Monorepo layout.** One repo so Claude Code has full context across data, site and helper.

```
tvtidy/
  CLAUDE.md                 # project rules for Claude Code (section 4)
  data/
    upstream/               # untouched clone of upstream lists + LICENSE + NOTICE
    normalized/             # models.json, brands.json, packages.json, generated
    overrides/              # your hand-written package descriptions and risk notes
  scripts/
    sync_upstream.py        # clone, normalize, diff, write changelog
    build_pages_data.py     # produce per-page JSON consumed by Next.js
  site/                     # Next.js app (static export)
    app/tv/[brand]/[model]/page.tsx
    app/brand/[brand]/page.tsx
    app/package/[id]/page.tsx
    app/fix/[slug]/page.tsx
    app/compare/[slug]/page.tsx
    public/llms.txt
  helper/                   # Python desktop app
    tvtidy_helper/
    build/pyinstaller.spec
  worker/                   # Cloudflare Worker: Dodo webhook -> Supabase
  supabase/migrations/
  .github/workflows/
    sync.yml                # nightly list sync + watch emails
    deploy.yml              # Pages deploy on push
    helper-release.yml      # PyInstaller builds + signing on tag
```

**Data model (normalized JSON and Supabase).**

| Entity | Key fields | Source |
| --- | --- | --- |
| Brand | slug, display\_name, model\_count | Derived from upstream folder structure |
| Model | slug, brand\_slug, display\_name, android\_version, list\_path, upstream\_commit, package\_ids\[\], last\_changed\_at | Upstream list file |
| Package | id (e.g. com.vendor.ads), category (ads / telemetry / preinstalled app / system-risky), safe\_to\_disable (yes / caution / no), description, seen\_on\_model\_count | Upstream lists + your overrides |
| Fix | slug, title, symptom, steps\[\] | Hand-written, about 20 |
| user (Supabase) | id, email, created\_at | Supabase Auth |
| license (Supabase) | key, user\_id, product (helper), dodo\_payment\_id, issued\_at, revoked | Dodo webhook |
| watch (Supabase) | user\_id, model\_slug, plan (free / pro), expires\_at, last\_notified\_commit | Site form + Dodo subscription webhook |
| list\_change (Supabase) | model\_slug, upstream\_commit, added\[\], removed\[\], detected\_at | Nightly sync |

**Non-goals for v1.** No user-submitted lists on the site (send people upstream via a PR template), no comments, no login for reading guides, no in-browser ADB (browsers cannot open the TCP connection ADB-over-Wi-Fi needs).

## 4. Claude Code build plan

Build in the order below: data first, then pages, then the helper, then money. Each task is one Claude Code session with a prompt you can paste; finish and commit each before starting the next, and keep `CLAUDE.md` as the single source of project rules.

**CLAUDE.md (put this at the repo root before task 1).**

```markdown
# TVTidy

Static Next.js site + Python desktop helper that let Android TV owners disable preinstalled apps using Google's ADB tooling. Lists come from the MIT-licensed CleanYourTV project; we are unaffiliated and must say so.

## Rules
- Never modify files under data/upstream/. Regenerate data/normalized/ with scripts/sync_upstream.py.
- Every page that lists packages must show the restore command and link to /safety.
- Never use the string "CleanYourTV" in a brand position (title tag, logo, domain, OG image). It may appear in attribution text and comparison pages only.
- Site is a static export (output: 'export'). No server components that need a runtime. No API routes in the site; webhooks live in worker/.
- Package descriptions: if a package is not in data/overrides/packages.json, mark safe_to_disable = "caution" and say the description is unverified.
- Helper: every write to the TV is preceded by writing a restore file to ~/.tvtidy/restore/<model>-<timestamp>.json. No exceptions.
- Keep dependencies mainstream: Next.js, Tailwind, Supabase JS, PySide6, PyInstaller. Ask before adding anything else.
- Tests: pytest for scripts/ and helper/; vitest for site/lib. Run them before saying a task is done.

## Commands
- Sync lists: python scripts/sync_upstream.py
- Build site: cd site && npm run build
- Run helper: python -m tvtidy_helper
```

**Ordered tasks.**

| # | Task | Prompt to paste into Claude Code | Done when |
| --- | --- | --- | --- |
| 1 | Scaffold | "Create the monorepo layout in section 3 of the GTM kit (paste the tree). Init a Next.js 15 app in site/ with TypeScript, Tailwind and static export. Add a GitHub Action that deploys site/out to Cloudflare Pages on push to main. Add CLAUDE.md as given." | `npm run build` produces site/out; a hello page is live on the pages.dev URL |
| 2 | Upstream sync | "Write scripts/sync\_upstream.py. It clones github.com/Gathin23/cleanyourtv at a pinned commit into data/upstream/, copies LICENSE and writes NOTICE with attribution, then walks the model lists and writes data/normalized/brands.json, models.json and packages.json using the schema in section 3. Dedupe packages across models, count seen\_on\_model\_count, and write data/normalized/changelog.json with added/removed packages per model since the previous run. Include pytest tests on two fixture lists." | Script runs clean; JSON validates; changelog shows diffs when you re-run against a newer commit |
| 3 | Model pages | "Build app/tv/\[brand\]/\[model\]/page.tsx with generateStaticParams from models.json. Show: model name, Android version, last synced date, a package table (id, category, safe\_to\_disable badge, one-line description), a copy-to-clipboard block of `adb shell pm disable-user --user 0 <pkg>` lines, the matching `pm enable` restore block, a link to /safety, a link to the upstream list file, and HowTo JSON-LD. Mobile first." | 341 pages build; Lighthouse SEO 100 on one sample page |
| 4 | Package, brand, fix pages | "Build /package/\[id\] (what the package is, which models include it, safe\_to\_disable reasoning, restore command), /brand/\[brand\] hubs listing models, and /fix/\[slug\] from data/fixes.json. Add breadcrumbs, internal links model↔package↔brand, a sitemap.xml generator and robots.txt." | All page types build; sitemap lists every URL |
| 5 | Safety, about, llms.txt | "Write /safety, /about (unaffiliated statement, attribution, methodology: where lists come from, how we classify packages, how often we sync), /methodology and public/llms.txt describing the site for AI search engines. Add the footer disclaimer to the layout." | Pages exist; disclaimer on every page |
| 6 | Helper core | "In helper/, build a PySide6 app: (1) discover TVs on the LAN via mDNS and manual IP entry, (2) ADB-over-Wi-Fi pairing with the 6-digit code flow, (3) read installed packages, (4) match against data/normalized/models.json (bundled) with manual model pick, (5) dry-run preview table with checkboxes, (6) Apply, which first writes a restore JSON then disables selected packages, (7) Restore from any saved file, (8) Check mode that reports packages re-enabled since the last apply. Use adb-shell if feasible; otherwise bundle platform-tools and shell out. Log everything to \~/.tvtidy/logs." | Works end to end against a real TV; restore brings every package back |
| 7 | Helper packaging | "Add PyInstaller spec and .github/workflows/helper-release.yml that builds Windows, macOS and Linux binaries on a tag and attaches them to a GitHub Release. Add an in-app update check against the Releases API." | Tag v0.1.0 produces three downloadable binaries |
| 8 | Supabase + license keys | "Create supabase/migrations for user, license, watch, list\_change (section 3). In site/, add /account with magic-link login showing the user's license key and watches. In helper/, add an Activate screen: key is validated once against Supabase via a Cloudflare Worker endpoint, then cached locally with a 30-day grace period so the helper works offline." | Buy flow stub issues a key; helper activates with it |
| 9 | Dodo checkout + webhook | "In worker/, build a Cloudflare Worker that receives Dodo Payments webhooks, verifies the signature, and on payment.succeeded for product 'helper' creates a license row and emails the key via Resend; on subscription events for 'watch' sets plan=pro and expires\_at. Add Dodo hosted checkout links to /pricing. Use Dodo's test mode." | Test purchase lands a key in the inbox within a minute |
| 10 | Firmware Watch | "Extend sync.yml: after sync, for every model in list\_change, email all watchers (free: monthly digest; pro: same day) via Resend with what changed and a link. Add a watch form to every model page (email + model, free tier default)." | Forced diff triggers one email to a test watcher |
| 11 | SEO hardening | "Add canonical URLs, OG image generation per model (static PNG at build), Article/HowTo JSON-LD validation, hreflang none, and an internal link block 'Other \[brand\] models' on each model page. Generate /compare pages from data/compare.json." | Rich-results test passes on model and fix pages |
| 12 | India page + Razorpay | "Add /in with INR pricing and a Razorpay Payment Link button for the helper (domestic only). Webhook in worker/ handles Razorpay payment.captured the same way as Dodo." | INR test payment issues a key |

**How to work with Claude Code on this repo.**

- Start each session with "Read CLAUDE.md and section N of docs/gtm-kit.md, then do task N." Keep this kit exported as markdown in `docs/` so the agent can read it.
- Ask for a plan before code on tasks 6 and 9; review the plan, then let it run.
- After each task: `git commit`, push, confirm the Pages deploy, then move on. Do not batch tasks.
- Keep a `docs/decisions.md` where Claude Code records anything it chose that CLAUDE.md didn't cover; read it weekly.

## 4b. Session-ready prompts for the first four Claude Code sessions

These four prompts are self-contained: each tells Claude Code what to read, what to build, what to inspect before assuming, and how to prove it is done. Run them in order, one per session, and commit between them.

**First hour, before any Claude Code session.**

- [ ] Install Node 20+, Python 3.12, Git, GitHub CLI (`gh`), Wrangler (`npm i -g wrangler`), Supabase CLI.
- [ ] Create a public GitHub repo `tvtidy` and clone it.
- [ ] Export this kit as Markdown and save it as `docs/gtm-kit.md` in the repo.
- [ ] Create `CLAUDE.md` at the repo root with the text from section 4.
- [ ] Create `docs/decisions.md` with one line: "Decisions Claude Code made that CLAUDE.md did not cover."
- [ ] Run `claude` in the repo root and start with Session 0.

**Session 0: inspect upstream before assuming anything.**

```markdown
Read CLAUDE.md and docs/gtm-kit.md sections 3 and 5. Do not write product code yet.

1. Clone https://github.com/Gathin23/cleanyourtv into /tmp/cleanyourtv at HEAD of its default branch and record the commit SHA.
2. Print the full text of its LICENSE file. If it is not MIT, stop and tell me; do not proceed.
3. Describe how model lists are organized: directory layout, file naming, one full sample file, how brand and model names are encoded, how Android version is recorded if at all, and how packages are listed (one per line, JSON, YAML, with comments or categories?).
4. Count brands and models. Tell me whether any list uses a format different from the majority.
5. Check whether lists carry any per-package notes, risk ratings or categories we could reuse.
6. Note any trademark, naming or attribution requirements stated in the README or CONTRIBUTING.

Write everything to docs/upstream-structure.md with the commit SHA at the top. End by proposing the normalized schema from gtm-kit section 5, adjusted to what you actually found, and list any field the kit assumed that upstream does not provide.
```

Acceptance: `docs/upstream-structure.md` answers all six points, names the SHA, and the proposed schema is one you agree with. If the LICENSE is not MIT, go back to section 2 before continuing.

**Session 1: scaffold and deploy.**

```markdown
Read CLAUDE.md, docs/gtm-kit.md section 3 (layout, stack) and section 7 (Cloudflare Pages). Build task 1.

1. Create the monorepo directories exactly as in section 3. Add a root README that says what each directory is.
2. In site/, create a Next.js 15 app with TypeScript, Tailwind and the App Router, configured for static export (output: 'export', trailingSlash true, images unoptimized). Add a placeholder home page with the footer disclaimer from section 14.
3. Add .github/workflows/deploy.yml that builds site/ and deploys site/out to Cloudflare Pages using the cloudflare/wrangler-action with CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID secrets. Tell me exactly which secrets to add and where.
4. Add vitest to site/ with one passing test, and pytest at the root with one passing test, so later sessions have a harness.
5. Add .gitignore, .nvmrc (20) and a root Makefile with targets: sync, build, test, helper.

Do not add any dependency beyond Next.js, React, Tailwind, vitest, pytest. Run npm run build and the tests before telling me it is done, and paste the build output summary.
```

Acceptance: `npm run build` in site/ writes `out/`; both test runners pass; after you add the two secrets and push, the `*.pages.dev` URL shows the placeholder with the disclaimer.

**Session 2: upstream sync and normalized data.**

```markdown
Read CLAUDE.md, docs/upstream-structure.md (the format you found in Session 0) and docs/gtm-kit.md section 5. Build task 2.

1. Write scripts/sync_upstream.py. It must: clone or update the upstream repo into data/upstream/ at a pinned commit (argument --commit, default HEAD); copy LICENSE and write NOTICE with the attribution text from section 5; parse every model list using the real format from docs/upstream-structure.md; write data/normalized/brands.json, models.json and packages.json using the schema agreed in Session 0; dedupe packages across models and compute seen_on_model_count; merge data/overrides/packages.json over upstream data, with overrides winning and anything missing an override tagged safe_to_disable = "caution" and description = "Unverified"; diff against the previous normalized output and write data/normalized/changelog.json with added/removed packages per model and new models.
2. Any list the parser cannot read goes to data/normalized/unparsed.json and the script exits non-zero.
3. Create data/overrides/packages.json with an empty object and a README explaining the override format.
4. Write pytest tests using two small fixture lists copied from upstream, covering: parse, dedupe, override precedence, changelog diff, unparsed exit code.
5. Add .github/workflows/sync.yml on cron 30 20 * * * UTC that runs the script, runs tests, and commits data/normalized/ if changed. Leave the notify step as a TODO for Session 10.

Run the script against the live upstream and paste: brand count, model count, unique package count, and the first 5 entries of models.json. Record any decision not covered by CLAUDE.md in docs/decisions.md.
```

Acceptance: counts match what Session 0 reported; `changelog.json` is empty on first run and shows diffs when you re-run with an older `--commit`; tests pass; the workflow runs green on a manual dispatch.

**Session 3: model pages.**

```markdown
Read CLAUDE.md, docs/gtm-kit.md sections 9 (model page skeleton, title pattern) and 14 (model page copy skeleton). Build task 3.

1. Add site/lib/data.ts that loads data/normalized/*.json at build time with typed interfaces.
2. Build app/tv/[brand]/[model]/page.tsx with generateStaticParams over models.json. Render, in this order: H1 from the title pattern; the one-line answer with counts of yes and caution packages; last-synced date and upstream commit with a link to the upstream file; the package table (id, category, safe_to_disable badge, description) with caution rows visually distinct; a copy-to-clipboard block of adb shell pm disable-user --user 0 <pkg> lines for yes packages, with a toggle to include caution; the matching pm enable restore block; a link to /safety (create a placeholder page); the helper CTA block and the watch form as static placeholders; an "Other [brand] models" link list; a 3-question FAQ; HowTo, FAQPage and BreadcrumbList JSON-LD.
3. Generate sitemap.xml and robots.txt at build.
4. Add a vitest test that renders one model page and asserts the H1, the disable block and the restore block exist.

Build the full site and paste the page count and build time. If the build exceeds 20,000 output files or any asset exceeds 25 MiB, stop and tell me.
```

Acceptance: every model in `models.json` has a page; a sample page passes Google's Rich Results test for HowTo and FAQ; Lighthouse SEO is 100 on that sample; mobile layout has no horizontal scroll.

**Known unknowns and where they get resolved.**

| Unknown | Why it matters | Resolved in |
| --- | --- | --- |
| Upstream list file format | The sync parser is written against it | Session 0 |
| Upstream LICENSE text | Whether lists can be reused at all | Session 0 |
| Which of the 30 starter models exist upstream | First 50 SEO pages | Session 2 output; pick from models.json |
| Dodo webhook event names and signature verification | Worker correctness | Task 9: have Claude Code read Dodo's webhook docs first and quote the event names it finds |
| ADB pairing from Python (adb-shell vs bundled platform-tools) | Helper reliability on Android 11+ | Task 6 part 1: spike both for 30 minutes before committing to one |
| Supabase schema SQL | Accounts and licenses | Task 8 produces the migration from the section 3 data model |
| Razorpay Subscriptions availability for an Individual account | INR recurring | Section 2 support email; until answered, INR is one-time only |
| Resend and Supabase free-tier limits as of today | Cost table | Task 10: check the pricing pages and record limits in docs/decisions.md |

**Habits that keep sessions short.** Start every session with "Read CLAUDE.md and docs/gtm-kit.md section N; summarize what you will do in five lines, then wait for my go." Say "go" only after the summary matches the kit. When a session goes sideways, `/clear` and restart from the prompt rather than correcting mid-stream; the kit plus the committed code is the state, not the chat.

## 5. Data pipeline

Upstream lists are the product's raw material, so the pipeline pins a commit, keeps the license and attribution intact, and turns every change into both a page update and a watch email.

**Flow, nightly at 02:00 IST via `sync.yml`.**

1. Clone the upstream repo at HEAD of main; record the commit SHA.
2. Copy LICENSE into `data/upstream/` and regenerate NOTICE ("Lists derived from CleanYourTV, (c) its contributors, MIT License; TVTidy is unaffiliated").
3. Parse every model list into the normalized schema. Unknown formats go to `data/normalized/unparsed.json` and fail the job loudly rather than silently dropping a model.
4. Diff against the previous commit: packages added or removed per model, new models, renamed models. Write `changelog.json` and insert `list_change` rows in Supabase.
5. Merge `data/overrides/packages.json` (your descriptions and risk ratings) over upstream package data. Overrides win; anything without an override is tagged `caution` and "unverified".
6. Commit normalized data; the push triggers a Pages rebuild.
7. Send watch emails (section 8 covers free vs pro timing).

**Normalized schema (models.json entry).**

```json
{
  "slug": "xiaomi-mi-tv-4a",
  "brand_slug": "xiaomi",
  "display_name": "Xiaomi Mi TV 4A",
  "android_version": "9",
  "upstream_path": "models/xiaomi/mi-tv-4a.txt",
  "upstream_commit": "abc123",
  "package_ids": ["com.example.ads", "com.example.telemetry"],
  "last_changed_at": "2026-10-27"
}
```

**Classification rules for packages (your overrides).** Write these by hand for the top 50 packages first; they are the pages competitors do not have.

| safe\_to\_disable | Meaning | Page copy |
| --- | --- | --- |
| yes | Ads, promo tiles, telemetry, vendor bloat seen across many models with no reports of breakage | "Safe to disable. Restores with one command." |
| caution | Preinstalled apps some people use (voice assistants, casting receivers) or packages with few reports | "Disable only if you don't use X. Here is what stops working." |
| no | Launcher, input, update, DRM and system services | "Do not disable. Removed from the default selection in the helper." |

**Attribution on every page.** "Package list for this model is derived from the CleanYourTV community list (MIT), last synced \<date>, commit \<sha>. TVTidy is an independent project." Link the commit and the upstream file.

**Giving back.** When a visitor submits a "request my model" form, generate a prefilled upstream PR template (model, brand, Android version, package dump they paste) and send them to the upstream repo. This keeps you on good terms with the project and keeps its lists, and therefore yours, growing.

## 6. Desktop helper spec

The helper is the paid unit, and its only job is to make the model page's commands a five-click, fully reversible wizard. It is a desktop app because browsers cannot open the TCP connection that ADB over Wi-Fi uses.

**Screens, in order.**

1. **Welcome.** One paragraph: what it does, that it is reversible, that it is unaffiliated with CleanYourTV and TV makers. Button: "Find my TV".
2. **Find TV.** mDNS scan plus manual IP field. Instructions with screenshots for enabling Developer Options and Wireless debugging on Google TV and Android TV 9/10.
3. **Pair.** Enter the 6-digit pairing code and port shown on the TV. Store the pairing so later runs skip this.
4. **Identify model.** Read `ro.product.model` and brand props; match to `models.json`; let the user override from a searchable list. If no list exists, offer the generic brand list with everything set to `caution`.
5. **Preview.** Table of packages: name, category, safe\_to\_disable badge, checkbox. Defaults: `yes` checked, `caution` unchecked, `no` hidden behind an "Advanced" toggle with a warning.
6. **Apply.** Write restore file first, then run `pm disable-user --user 0` per package, show a live log, and finish with "Restart your TV".
7. **Restore.** List of restore files by date; one click re-enables everything in the file.
8. **Check.** Compare current state with the last apply; list packages that came back (typical after a firmware update); offer to re-apply.

**Safety rules (non-negotiable, enforced in code).**

- No restore file written means no package is touched. The apply function takes the restore path as an argument and refuses to run without it.
- Only `pm disable-user`, never `pm uninstall`. Disabling is reversible; uninstalling system packages for user 0 is harder to undo.
- Packages rated `no` are never selected by default and require a typed confirmation.
- Every run logs the full command list to `~/.tvtidy/logs/` so a support request includes exact actions.
- The helper never sends package lists or device identifiers anywhere. Activation sends only the license key and a random install id.

**Licensing behavior.** Free mode runs Find, Pair, Identify, Preview and Restore. Apply and Check need a key. This lets a free user see exactly what they would get and rescue a TV they already changed by hand, which is good will and good reviews.

**Packaging and signing.**

| Platform | Build | Signing | Launch day? |
| --- | --- | --- | --- |
| Windows | PyInstaller one-folder, Inno Setup installer | Azure Artifact Signing Basic, $9.99/mo | Yes; most buyers |
| macOS | PyInstaller .app in a .dmg | Apple Developer Program, $99/yr, notarized | Can wait 2 to 4 weeks; ship unsigned with a Gatekeeper how-to until then |
| Linux | AppImage | None needed | Yes |

Bundle Google's platform-tools binaries if `adb-shell` proves unreliable on pairing; Google's platform-tools are redistributable under their terms, which you should read once and note in `docs/decisions.md`.

## 7. Deployment runbook

Everything deploys from GitHub on push or on tag; there is no server to SSH into. Set it up once on day 1 and day 7, then forget it.

**Accounts to create (all free to start).** GitHub, Cloudflare (Pages, Workers, Web Analytics, R2 unused for now), Supabase, Resend, Dodo Payments, Razorpay, Google Search Console, Bing Webmaster Tools, Azure (for Artifact Signing, day 9).

**Site: Cloudflare Pages.**

1. Connect the GitHub repo; root directory `site`, build command `npm run build`, output `out`.
2. Add custom domain tvtidy.app; Cloudflare issues the certificate.
3. Turn on Web Analytics for the domain.
4. Set `_headers` for long cache on `/_next/static/*` and `X-Robots-Tag: all`.
5. Stay under the 20,000-files-per-site limit: with about 341 model, 93 brand, a few hundred package, 20 fix and 10 compare pages plus OG images, you are at roughly 1,500 files. Fine.

**Worker: `worker/`.** `wrangler deploy` from a GitHub Action on push. Routes: `POST /webhooks/dodo`, `POST /webhooks/razorpay`, `POST /activate`. Secrets via `wrangler secret put`: `DODO_WEBHOOK_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`.

**Supabase.** Apply `supabase/migrations` with the CLI. Enable Row Level Security on every table; the site reads only through the authenticated user's own rows, and the Worker uses the service key. Magic-link auth only, no passwords.

**Nightly sync: `sync.yml`.** Cron `30 20 * * *` UTC (02:00 IST). Steps: checkout, run `scripts/sync_upstream.py`, run tests, commit `data/normalized/` if changed, call the Worker's `/notify` endpoint with the changelog. Needs `SUPABASE_SERVICE_KEY` and `RESEND_API_KEY` as repo secrets.

**Helper release: `helper-release.yml`.** On tag `helper-v*`: matrix build on windows-latest, macos-latest, ubuntu-latest; PyInstaller; sign the Windows binary with the Artifact Signing action; upload all three to the GitHub Release; update `site/public/helper-latest.json` with version and download URLs so the site and the in-app updater read one file.

**Environment variables.**

| Where | Variable | Purpose |
| --- | --- | --- |
| site (build) | NEXT\_PUBLIC\_SUPABASE\_URL, NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY | Account page |
| site (build) | NEXT\_PUBLIC\_DODO\_HELPER\_LINK, NEXT\_PUBLIC\_DODO\_WATCH\_LINK | Checkout buttons |
| worker | DODO\_WEBHOOK\_SECRET, RAZORPAY\_WEBHOOK\_SECRET, SUPABASE\_SERVICE\_KEY, RESEND\_API\_KEY | Webhooks and email |
| GitHub Actions | SUPABASE\_SERVICE\_KEY, RESEND\_API\_KEY, CLOUDFLARE\_API\_TOKEN, AZURE\_\* signing secrets | Sync and release |

**Rollback.** Pages keeps every deployment; roll back from the dashboard in one click. Helper: re-point `helper-latest.json` at the previous release tag.

**Pre-launch smoke test (day 12 morning).** Fresh browser: open a model page, copy commands, submit a free watch, buy the helper in Dodo test mode, receive the key, activate the helper, apply on a real TV, restore, run Check after a reboot. All eight steps pass or you don't post.

## 8. Pricing, payments and license keys

Dodo Payments is the primary rail because it onboards unregistered Indian individuals and sells to 220+ countries as merchant of record; Razorpay handles INR domestic only. Prices are set to convert search visitors who already know what they want, not to maximize per-sale revenue.

**Price list.**

| Product | International (Dodo) | India (Razorpay, domestic) | Type |
| --- | --- | --- | --- |
| Helper | $12 one-time | INR 699 one-time | Digital download, license key |
| Firmware Watch monthly | $2.99/mo | INR 149/mo | Subscription |
| Firmware Watch yearly | $19/yr | INR 999/yr | Subscription |
| Bundle: Helper + 1 year Watch | $24 | INR 1,399 | One-time, creates a 12-month watch |

**Fees to expect (Dodo, from its pricing page as of the research report).** 4% + $0.40 per domestic US transaction; international adds 1.5%; subscriptions add 0.5%. A $2.99 international subscription nets roughly $2.39 per month; a $12 helper sale nets roughly $10.90. Treat these as estimates and reconcile against the first real payouts.

**Dodo setup.**

1. Create two products: Helper (one-time) and Firmware Watch (subscription, monthly and yearly prices), plus the Bundle.
2. Use hosted checkout links on /pricing; pass `metadata.product` and the user's email so the webhook can key the license.
3. Webhook events to handle: `payment.succeeded` (issue helper key), `subscription.active` and `subscription.renewed` (set plan=pro, extend `expires_at`), `subscription.cancelled` and `payment.refunded` (revoke).
4. Refund policy on the site: 14 days, no questions, for the helper; prorated not offered for Watch, cancel anytime. Dodo handles the refund mechanics as merchant of record.

**Razorpay setup (domestic only).** Payment Links for Helper and the Bundle in INR; Razorpay Subscriptions for Watch if your account is approved for it. The Worker's `/webhooks/razorpay` handles `payment.captured` the same way as Dodo's `payment.succeeded`. Do not expose Razorpay to non-Indian visitors; route by the visitor's chosen page (/in) rather than by IP guessing.

**License keys.** Format `TVT-XXXX-XXXX-XXXX`, generated in the Worker, stored hashed in Supabase. Activation: helper posts key + install id to `/activate`; Worker checks the key is not revoked and has fewer than 3 install ids, returns a signed token valid 30 days; the helper caches it and re-validates silently when online. Revoked keys fail on the next validation, which gives refund abuse a 30-day window at most. Good enough at this price.

**Watch tiers.** Free watch: one model, monthly digest email. Pro watch: unlimited models, same-day email, plus the helper's Check reminder. The free tier is the email list; the pro tier is the recurring revenue.

**Things to verify before enabling live mode.**

- [ ] Dodo compliance reply received (section 2).
- [ ] Dodo verification approved as Individual.
- [ ] Terms, Privacy, Refund pages live (Razorpay requires them; Dodo expects them).
- [ ] Test purchase, refund and subscription cancel all flow through the Worker correctly.

## 9. SEO kit

The traffic plan is programmatic: one page per model, brand, package and symptom, each answering a query a TV owner actually types. Keyword volumes below are not measured; validate the top 10 in Google Trends and Search Console in week 2 and cut templates that get zero impressions.

**Keyword map (highest intent first).**

| Keyword pattern | Page that answers it | Stage |
| --- | --- | --- |
| remove ads google tv home screen | /fix/remove-ads-google-tv | Problem aware |
| debloat android tv | / and /fix/debloat-android-tv | Problem aware |
| \[brand\] tv disable ads | /brand/\[brand\] | Brand aware |
| \[model\] debloat / adb debloat list \[model\] | /tv/\[brand\]/\[model\] | Model aware, highest intent |
| is \[package\] safe to disable | /package/\[id\] | Mid-task |
| cleanyourtv alternative | /compare/cleanyourtv-alternatives | Solution aware |
| cleanyourtv without computer / without coding agent | /fix/debloat-without-coding-agent | Solution aware |
| how to use cleanyourtv | /fix/how-to-use-cleanyourtv-lists | Solution aware |
| apps came back after update android tv | /fix/apps-came-back-after-update | Retention, Watch upsell |
| google tv launcher replacement / apple tv style launcher | /compare/best-google-tv-launchers | Adjacent |

**Page templates and counts.**

| Template | Entity table | Pages at launch | Data source | Title pattern |
| --- | --- | --- | --- | --- |
| /tv/\[brand\]/\[model\] | models.json | 341 | Upstream lists | "\[Model\] debloat list: remove ads and bloat (reversible)" |
| /brand/\[brand\] | brands.json | 93 | Derived | "\[Brand\] Android TV: disable ads and preinstalled apps by model" |
| /package/\[id\] | packages.json | 200 to 400 (estimate, after dedupe) | Upstream + overrides | "Is \[package\] safe to disable on Android TV?" |
| /fix/\[slug\] | fixes.json | 20 | Hand-written | Symptom phrased as the query |
| /compare/\[slug\] | compare.json | 5 | Hand-written | "\[A\] vs \[B\]" or "\[X\] alternatives" |

**Model page skeleton (every field is a ranking signal or a conversion step).** H1 with model name; a one-line answer ("N packages are safe to disable on this model; here are the commands"); last-synced date and upstream commit; the package table; copy block of disable commands; restore block; "Do this in one click" helper CTA; free Watch form; "Other \[brand\] models" links; FAQ with 3 questions (does it survive updates, can I undo it, do I need root); HowTo JSON-LD; breadcrumb JSON-LD.

**Internal linking.** Model → brand hub, each package on the model page → package page, package page → every model containing it, fix pages → the 5 most common models in the fix. This gives every page at least 3 inbound internal links on day 1.

**llms.txt (public/llms.txt).** Plain description of the site, what the lists are, that they are MIT-derived from CleanYourTV, the sync cadence, how packages are classified, and the canonical URLs for the fix pages. Also link /methodology. AI search engines cite sites that explain their method.

**Structured data.** HowTo on model and fix pages, BreadcrumbList everywhere, SoftwareApplication on /helper with price and OS, FAQPage on model pages. Validate with Google's Rich Results test on day 10.

**First 50 pages to publish (days 2 to 4).** Pick the 30 models from upstream whose brands rank highest in your Search Console country mix once data arrives; until then use this starter list, confirming each exists in the upstream lists before building.

| # | Page |
| --- | --- |
| 1 to 30 | Model pages: Xiaomi Mi TV 4A (confirmed upstream), Mi TV 5X, Redmi Smart TV X43; TCL C645, TCL P735; Hisense A6, Hisense U6; Sony Bravia X80K, X90K, A80K; Philips 7900, 8500; Chromecast with Google TV (HD and 4K); Nvidia Shield TV, Shield TV Pro; Walmart onn 4K; OnePlus TV Y1, U1S; Realme Smart TV 32, 43; Thomson 9A; Kodak 7XPRO; Vu Premium; Panasonic JX; Toshiba C350; Acer H; Motorola Revou; Nokia Smart TV; Haier K7; Sanyo Kaizen. Swap any that are not upstream for ones that are. |
| 31 to 38 | Brand hubs: Xiaomi, TCL, Hisense, Sony, Philips, OnePlus, Realme, Google (Chromecast) |
| 39 to 43 | Package explainers for the five most common ads/telemetry packages across all lists (take the top 5 by seen\_on\_model\_count after sync) |
| 44 to 47 | Fixes: remove ads from Google TV home screen; debloat Android TV without a computer or coding agent; undo a TV debloat; apps came back after a firmware update |
| 48 to 50 | Comparisons: CleanYourTV alternatives and helpers (respectful, we build on their lists); best Google TV launchers 2026; Samsung and LG ad and privacy settings without root |

**Week 2 expansion rule.** Any template whose pages average more than 5 impressions a day in Search Console gets expanded to the full entity table; any template under 1 impression a day after 14 days is paused, not deleted.

## 10. Distribution playbook (zero audience)

The channel order is: the upstream project's own ecosystem first, help-first answers in TV subreddits second, launch sites third. Links only where the venue allows and only after you have helped; one post per venue, never cross-posted the same day.

**Channels in order.**

| # | Channel | What to do | When |
| --- | --- | --- | --- |
| 1 | Upstream SHOWCASE.md | Open a PR adding TVTidy to the community projects list (140 already there). Follow their format exactly; describe it as a guide site + helper built on their lists. | Day 11 |
| 2 | Upstream issues | Daily 20 minutes: answer model-specific questions with the exact commands; contribute list fixes as PRs. Link your model page only when someone asks for a simpler route. | Day 5 onward |
| 3 | r/AndroidTV | Help-first comments for a week, then one "I built" post with the restore-first angle and a demo GIF. Check sub rules on self-promotion first. | Comments day 5; post day 12 |
| 4 | r/googletv | Same pattern, different post text focused on Google TV home-screen ads. | Day 13 |
| 5 | r/ShieldAndroidTV | Shield owners are power users; lead with the Check feature after updates. | Day 13 |
| 6 | r/degoogle and r/privacy | Privacy angle: what telemetry packages do and how to disable them; link the package pages. | Day 13 |
| 7 | XDA Forums, Android TV section | A proper thread: what it is, screenshots, download, changelog. XDA tolerates tools threads if you support them. | Day 13 |
| 8 | Show HN | "Show HN: Per-model guides and a reversible one-click debloater for Android TVs" with a technical write-up of the sync pipeline. | Day 12, 14:00 to 16:00 UTC on a weekday |
| 9 | Product Hunt + Fazier | Schedule PH for day 12 (00:01 PT); Fazier the same day. Ask nobody for upvotes; the listing is for the backlink and the evergreen page. | Day 12 |
| 10 | Indie Hackers + TrustMRR | Build-log post on IH with numbers; TrustMRR listing once Dodo is live so the revenue is verifiable. | Day 14 |

**Rules of engagement.**

- Be useful before you link. On Reddit and upstream issues, the first ten interactions carry no link at all.
- Say "independent, builds on the CleanYourTV lists" in every post; never imply endorsement.
- Lead with reversibility and the restore flow; the loudest objection to this category is "it will brick my TV".
- Reply to every comment on launch day; the replies are where second-day traffic comes from.
- Short-form video: one 40-second screen recording per week, phone-shot of the TV plus the helper screen. Post the same clip to YouTube Shorts, Reels and TikTok with the model name in the caption; model-name captions get found by search inside those apps.

**Show HN draft.**

```markdown
Show HN: TVTidy – per-model guides and a reversible one-click debloater for Android TVs

After the CleanYourTV project blew up two weeks ago, a lot of people asked for a way to do it without a coding agent or a terminal. TVTidy is my attempt: a static site with one page per TV model (341 models, derived from the project's MIT-licensed lists, synced nightly) and a small desktop helper that pairs over ADB-Wi-Fi, previews what will change, writes a restore file before touching anything, and can re-check after firmware updates re-enable packages.

I'm not affiliated with CleanYourTV; I credit them on every page and send list contributions upstream. Guides are free; the helper is $12. Happy to answer questions about the sync pipeline or the pairing flow, which was the fiddly part.
```

**Reddit "I built" draft (r/AndroidTV).**

```markdown
I made a one-click, reversible version of the CleanYourTV debloat for people who don't want to touch a terminal

Not affiliated with CleanYourTV; this builds on their MIT lists and credits them. What's different: a page per model with the exact packages and restore commands (free), and a small desktop app that saves a restore file before it disables anything and can check what came back after an update. Restore is free; apply is paid. Screenshots and the model list in the comments. If your model isn't there, the site has a form that prefills an upstream PR so the community list grows.
```

**Upstream SHOWCASE PR line.**

```markdown
- [TVTidy](https://tvtidy.app) – Per-model web guides and a reversible desktop helper built on the CleanYourTV lists. Independent project.
```

## 11. 14-day launch calendar

Start Thursday 30 October 2026 so launch day lands on Thursday 12 November; tick each row as you finish. Running cost is cumulative monthly spend, all figures estimates.

| Day | Date | Build (Claude Code task) | Publish and distribution | Running cost/mo |
| --- | --- | --- | --- | --- |
| 0 | Wed 29 Oct | Read upstream LICENSE; send Dodo compliance email; start Dodo verification; buy domain | Create all accounts (section 7) | $1 (domain amortized) |
| 1 | Thu 30 Oct | Task 1 scaffold; CLAUDE.md; Pages deploy live | Reserve social handles | $1 |
| 2 | Fri 31 Oct | Task 2 upstream sync; Task 3 model pages | Publish first 20 model pages | $1 |
| 3 | Sat 1 Nov | Task 4 package, brand, fix pages; write top 50 package overrides | +10 model pages, +5 package pages | $1 |
| 4 | Sun 2 Nov | Task 5 safety, about, methodology, llms.txt | +8 brand hubs, 4 fix pages; submit sitemap to Search Console and Bing | $1 |
| 5 | Mon 3 Nov | Task 6 helper core, part 1 (find, pair, identify, preview) | Begin daily 20-minute help routine on upstream issues and r/AndroidTV (no links) | $1 |
| 6 | Tue 4 Nov | Task 6 part 2 (apply with restore file, restore, check); test on your TV | - | $1 |
| 7 | Wed 5 Nov | Task 7 packaging; Task 8 Supabase and license keys | - | $1 |
| 8 | Thu 6 Nov | Task 9 Dodo checkout and webhook in test mode; Task 10 Firmware Watch | 3 comparison posts | $1 |
| 9 | Fri 7 Nov | Azure Artifact Signing set up; signed Windows build; macOS unsigned with how-to | - | $11 |
| 10 | Sat 8 Nov | Task 11 SEO hardening; Rich Results validation; OG images | Re-submit sitemap | $11 |
| 11 | Sun 9 Nov | Task 12 India page and Razorpay domestic link; model request form | Upstream SHOWCASE PR; first 40-second demo clip to Shorts, Reels, TikTok | $11 |
| 12 | Mon 10 Nov | Smoke test (section 7); fix what breaks; flip Dodo to live only if compliance reply is in | Show HN 14:00 UTC; Product Hunt and Fazier listings | $11 |
| 13 | Tue 11 Nov | Bug fixes from launch feedback; helper v0.1.1 | r/AndroidTV post; r/googletv, r/ShieldAndroidTV, r/degoogle; XDA thread | $11 |
| 14 | Wed 12 Nov | Search Console review; expand or pause templates per the week-2 rule | Indie Hackers build log; TrustMRR listing | $11 |

Add Apple Developer ($99/yr, about $8/mo) when macOS buyers appear in support requests; the run-rate is then about $20/mo, still under half the $50 budget.

**If the Dodo compliance reply has not arrived by day 12,** launch anyway with the free site and the helper's free mode, collect watch emails, and open sales the day the reply lands. The SEO clock matters more than the sales clock.

## 12. Costs, KPIs and weekly review

Break-even is two helper sales a month at the full run-rate, so the only cost that matters is your time; the KPIs below tell you where to spend it.

**Monthly cost by traffic (estimates).**

| Monthly visitors | Hosting | Signing and dev programs | Email and DB | Total |
| --- | --- | --- | --- | --- |
| 1,000 | $0 (Pages free) | $10 (Windows signing) | $0 (free tiers) | about $11 |
| 10,000 | $0 | $10 | $0 to $1 | about $12 |
| 100,000 | $0 (static, edge cached) | $18 (adds Apple) | $2 to $5 (Resend above free tier if watch list passes a few thousand) | about $22 |

Nothing in this table scales with free visitors except email, and email only scales with people who opted in. Required free-to-paid ratio to cover costs at 100K visitors is about 0.002%.

**KPIs and targets.**

| KPI | Where | Day 14 target | Day 45 target |
| --- | --- | --- | --- |
| Pages indexed | Search Console | 50 | 500 |
| Impressions per day | Search Console | 100 | 2,000 |
| Organic visits per day | Cloudflare Web Analytics | 30 | 500 |
| Free watch signups | Supabase | 50 | 600 |
| Helper sales | Dodo + Razorpay | 5 | 60 |
| Watch Pro subscribers | Dodo | 3 | 30 |
| Model-page to helper-page click rate | Analytics | 5% | 8% |
| Refund rate | Dodo | under 10% | under 5% |

**Weekly review (Fridays, 30 minutes).**

- [ ] Search Console: top 20 queries by impressions; which template do they hit; expand that template.
- [ ] Pages with impressions but click rate under 1%: rewrite the title and the one-line answer.
- [ ] Support inbox: every "it broke X" report becomes a `caution` override and a line on the model page.
- [ ] Upstream changelog: did any brand gain 5+ models; build those pages first.
- [ ] Costs: check Resend and Supabase usage against free tiers.
- [ ] One new comparison or fix page from the week's most common question.

## 13. Risks and mitigations

The two risks that can end the project are a Dodo rejection and the upstream project shipping a signed one-click app; everything else is survivable with the page inventory and the email list.

| Risk | Likelihood | Impact | Mitigation | Early signal |
| --- | --- | --- | --- | --- |
| Dodo classifies the helper as a platform-bypass tool | Medium | Sales blocked | Pre-check email (section 2); frame as owner-run, reversible, documented ADB; fallback is Razorpay domestic plus a Paddle or Lemon Squeezy application | No reply in 5 business days; ask again with the safety page attached |
| Upstream ships a signed desktop app | Medium | Helper revenue drops to near zero | They have said "no binaries"; if it changes, pivot the paid unit to Watch and the package knowledge base, keep the site | A `release/` folder or an installer discussion in upstream issues |
| Wave fades in 4 to 6 weeks | High | Branded queries ("cleanyourtv...") fall | Most pages target evergreen queries ("remove ads google tv", "\[model\] debloat"); the wave only front-loads links | Google Trends for "cleanyourtv" drops below half its peak |
| A firmware update re-enables packages and a buyer calls it broken | High | Support load, refund requests | Check mode, the safety page, and the Watch email that explains it before they notice | Support messages mentioning "update" |
| A disabled package breaks something on one model | Medium | Reputation, refunds | `caution` defaults, restore-first, per-model override within hours of a report | Any Reddit or issue thread naming TVTidy and a model |
| Copycats clone the site | High | Shared SERPs | Ship the package explainers and Check mode first; they are the hard part. Keep publishing faster than they can | New domains in "cleanyourtv alternative" results |
| Upstream license turns out not to be MIT | Low | Rebuild data layer | Read LICENSE on day 0; if not MIT, build lists from community-contributed dumps instead | Day 0 |
| Razorpay rejects the category or international use | Medium | India-only INR sales affected | Domestic only from the start; Dodo carries everything else | KYC review asks for business registration |
| Supabase or Resend free tier exhausted | Low | Watch emails delayed | Monthly digest for free tier caps volume; upgrade Resend at about $20/mo only when Pro revenue covers it | Usage dashboards in the weekly review |

**Month-3 defensibility moves (pick two).**

1. The package knowledge base: 400+ explainers with breakage reports per model, which no list repo offers.
2. Watch as the retention product: firmware-update alerts are the one reason to come back, and every update cycle re-sells the helper's Check mode.
3. Non-Android coverage: Samsung Tizen, LG webOS and Roku privacy and ad settings guides, which upstream explicitly hands off to a manual page and which share the same searchers.
4. A launcher comparison hub: "best Google TV launcher" is adjacent, evergreen and feeds the helper.

## 14. Copy and legal templates

Use these verbatim at launch and adjust after the first week; the disclaimer and the compliance email are the two that must not drift.

**Footer disclaimer (every page, every helper screen).**

```markdown
TVTidy is an independent project. It is not affiliated with, endorsed by, or run by the CleanYourTV project, Google, or any TV manufacturer. Brand and model names identify devices only. Package lists are derived from the CleanYourTV community lists under the MIT License and are credited on each page. Disabling packages uses Android's documented developer tools on your own device and is reversible; TVTidy does not root devices, bypass DRM, or modify streaming apps.
```

**Dodo compliance pre-check email.**

```markdown
Subject: Pre-approval question: Android TV declutter guide site and desktop helper

Hello,

I am an individual seller in India preparing to sell through Dodo Payments and want to confirm the product fits your Merchant Acceptance Policy before I enable live payments.

Product: TVTidy (tvtidy.app), a website of free guides plus a paid desktop application ($12 one-time) and an optional email alert subscription ($2.99/month).

What it does: lets owners of Android TV / Google TV devices disable preinstalled apps (ads, promotional tiles, telemetry) on their own television using Android's documented Developer Options and Android Debug Bridge, the same tools Google ships for developers. Every change is reversible, and the application writes a restore file before making any change.

What it does not do: it does not root devices, bypass DRM or content protection, modify or block ads inside streaming apps, circumvent licensing, or run on devices the user does not own. It does not scrape or collect device data.

I am asking specifically because the policy lists tools for "bypassing platform restrictions" as prohibited, and I want to be sure a reversible, owner-operated debloat helper is not read that way. I'm happy to share the safety page and a demo.

Thank you,
[Name], [email], [Dodo account email]
```

**Refund policy outline (/refunds).** Helper: full refund within 14 days of purchase, no questions, request by email with the order id. Firmware Watch: cancel anytime from the account page; no partial-period refunds. Refunds are processed by Dodo Payments (international) or Razorpay (India) to the original payment method within their stated timelines.

**Safety page outline (/safety).** What disabling means (the app stays installed, it just stops running); the restore command; why firmware updates re-enable apps; the three packages you must never disable on most models; how to get help (email with the log file); the full unaffiliated statement.

**Model page copy skeleton.**

```markdown
# {Model} debloat list: remove ads and preinstalled apps (reversible)

{N} packages on the {Model} ({Brand}, Android TV {version}) can be disabled safely; {M} more are optional. Last synced {date} from the CleanYourTV community list (MIT), commit {sha}. TVTidy is independent of that project.

## What you can disable
[package table]

## Commands (copy, then paste into adb)
[disable block]

## Undo everything
[restore block] - see /safety before you start.

## Do this in one click
The TVTidy helper pairs with your TV, previews these packages, saves a restore file, and applies them. $12, Windows/macOS/Linux. [Download]

## Get told when this list changes
[watch form]

## FAQ
Will this survive a firmware update? / Can I undo it? / Do I need root?

Other {Brand} models: [links]
```

**Helper first-run text.** "TVTidy helps you disable preinstalled apps on your own Android TV using Google's developer tools. Before it changes anything it saves a restore file, and you can undo every change from the Restore tab. TVTidy is not affiliated with CleanYourTV, Google or your TV's maker."
