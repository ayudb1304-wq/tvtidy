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
