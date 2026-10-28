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
