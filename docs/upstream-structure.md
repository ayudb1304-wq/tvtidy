# Upstream structure: CleanYourTV

**Commit surveyed:** `095b71ad93d99ea28d94d97b06385709d354b795` (branch `main`, 2026-10-28 10:41 +0530,
"README: a start-here table, a contents line and a brand grid; long sections move to docs/")

Repo: https://github.com/Gathin23/cleanyourtv. First commit 2026-10-17; 3,678 commits by the surveyed
commit, so it is very active and the format can still change. Numbers below were measured at this commit.

## 1. LICENSE

It is MIT. Full text:

```
MIT License

Copyright (c) 2026 Gathin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

The Outfit typeface in launcher/app/src/main/res/font/outfit.ttf is copyright
The Outfit Project Authors and licensed under the SIL Open Font License 1.1,
see launcher/FONT-LICENSE-OFL.txt.
```

The addendum about the OFL font is almost certainly why GitHub's sidebar says "Other": its license
detector expects the plain MIT text. The debloat lists are under MIT. We don't use the font.

What we must do: ship the copyright line and the permission notice with any copy of the lists, in
`data/upstream/LICENSE` and on the site's attribution/about page.

## 2. How model lists are organized

**Layout.** One folder per TV model under `examples/`, named `<brand>-<model>` in kebab case, for
example `examples/xiaomi-mi-tv-4a/`. There are no brand subfolders. Six folder names don't start with
the brand (for example `aipro2k/`), so the brand has to come from `tv.json`, not from the folder name.

Files in each folder:

| File | Count | What it is |
|---|---|---|
| `debloat.txt` | 345 / 345 | The package list |
| `tv.json` | 345 / 345 | Metadata row used to generate the README tables |
| `README.md` | 80 | Free-text notes for that model |
| `config.json` | 75 | Settings for upstream's replacement launcher (dock apps, hidden apps, home redirect). Not relevant to debloating |
| other | 12 | See section 4 |

**`tv.json`** (copied from `examples/xiaomi-mi-tv-4a/tv.json`):

```json
{
  "tv": "Xiaomi Mi TV 4A (MiTV-MOOQ1)",
  "os": "Android TV 10 and 11",
  "brand": "Xiaomi",
  "notes": "PatchWall, Mi analytics, SmartShare, MiLink; Android TV 11 subset (Mi TV+, Miracast, Mi Cast off by choice, updater kept): [notes](xiaomi-mi-tv-4a/README.md)"
}
```

All 345 files have `tv`, `os`, `brand` and `notes`. Two also have `readme_os`. They all parse as JSON.

- **Brand and model names:** `brand` is a display string, for example `"Xiaomi"`, `"Amazon Fire TV"` or
  `"NVIDIA Shield"`. `tv` is a free-text display name that often includes the codename, chipset or
  region in parentheses. Neither field has a separate slug.
- **Android version:** only as free text in `os`. There are 55 distinct values, including
  `"Android TV 11"`, `"Google TV 14"`, `"Fire OS 7.7.1.7 / Android 9"`, `"Android TV 10 and 11"` and
  `"Android 14 (HyperOS 3, CN build)"`. The firmware build number appears only in the first comment
  line of `debloat.txt`, also as free text.

**`debloat.txt`** format (`examples/xiaomi-mi-tv-4a/debloat.txt`, full file):

```
# Xiaomi Mi TV 4A (MiTV-MOOQ1, codename tarzan), Android TV 10, firmware QTG3.200305.006.2591
# Also a good starting point for other Xiaomi/Redmi Android TVs with PatchWall.
# Android TV 11 (firmware RTM4.220307.164.9021): not this whole list, see README.md in this folder.
#
# Apply:   TV_HOST=<tv ip> tools/disable.sh examples/xiaomi-mi-tv-4a/debloat.txt
# Undo:    TV_HOST=<tv ip> tools/restore.sh examples/xiaomi-mi-tv-4a/debloat.txt
# Everything is DISABLED, not uninstalled. Comment out any line you want to keep.
#
# Known quirk on this firmware: default_input_method points at com.baidu.input, which is not
# installed, so no keyboard appears in search fields. Set Gboard as the IME
# (docs/TROUBLESHOOTING.md, "No on-screen keyboard").

# Xiaomi telemetry
com.miui.tv.analytics
com.xiaomi.statistic

# PatchWall and Mi content rows / promos
com.mitv.tvhome.atv
com.mitv.tvhome.michannel
com.mitv.tvhome.mitvplus
com.xm.webcontent
com.xiaomi.floatingframe

# Xiaomi background services
com.xiaomi.mitv.tvmanager              # "TV Manager" cleaner app
com.xiaomi.mitv.smartshare
com.mitv.milinkservice                 # Mi cast, Chromecast still works
com.xiaomi.mitv.updateservice          # re-enable to check for firmware updates
com.xiaomi.amazon.alexa                # Alexa bridge
android.autoinstalls.config.xiaomi.amelie

# Preloaded apps nobody asked for
com.xiaomi.mimusic2
com.google.android.play.games
com.google.android.feedback
com.google.android.apps.tachyon        # Google Duo
fusion.android.tv.demo

# Stock Google TV launcher and its recommendation services, replaced by launcher/
com.google.android.tvlauncher
com.google.android.tvrecommendations
com.google.android.leanbacklauncher.recommendations
```

The format is plain text, not JSON or YAML:

- One package name per line. `#` starts a comment, either on its own line or after the package.
- Blank lines separate groups, and each group starts with a comment line that names it.
- A header comment block at the top gives the model, firmware, apply/undo commands, quirks and often
  a "Kept on purpose, do not disable" list.
- Packages that are commented out (`# com.vendor.app  # reason`) are kept on purpose or optional.
- Upstream's own parser (`tools/disable.sh`) strips a UTF-8 BOM and CRLF, drops `#` comments, takes
  the first token of each line, and rejects the whole list unless every token matches
  `^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$`. Our parser should apply the same rule.

## 3. Counts

- **Brands:** 93 distinct `tv.json` brand values. TCL 76, Sony 40, Xiaomi 32, Philips 18,
  Skyworth 14, Hisense 11, Amazon Fire TV 7, Panasonic 6, BenQ/SHARP/XGIMI 5, and 54 brands with one
  model. Some are related but listed separately, for example Xiaomi vs Redmi, Amazon Fire TV vs
  Insignia Fire TV, and Google vs NVIDIA Shield.
- **Models:** 345 folders, each with exactly one `tv.json` and one main `debloat.txt`. The kit
  assumed 341.
- **Packages:** 1,495 unique active (not commented-out) package ids across all lists. Each list has
  5 to 100 packages, with a median of 22. There are 8,077 active package lines in total. Another 962
  unique ids appear only commented out somewhere.
- **Most common active packages:** `com.google.android.feedback` (257 models),
  `com.google.android.play.games` (210), `com.google.android.videos` (151),
  `com.google.android.tvrecommendations` (135), `com.google.android.youtube.tvmusic` (131),
  `com.google.android.tungsten.setupwraith` (125), `com.google.android.partnersetup` (119),
  `com.google.android.katniss` (113), `com.google.android.syncadapters.calendar` (100),
  `com.android.printspooler` (96).

## 4. Lists that differ from the majority

All 345 `debloat.txt` files parse with the rule in section 2: none has an invalid token, none is
empty, and none has a BOM or CRLF at this commit. 344 start with a `# ` comment. One
(`panavox-google-tv`) starts with `#TV Brand/Model` followed by `#ro.product.*` property lines. That still
parses, but the header has no human-readable model line.

Exceptions the sync script has to handle:

- **Second lists in one folder:** `google-chromecast-gtv-4k/debloat-keep-cast.txt` (a variant that
  keeps casting), `oppo-k9-55-oppocnm632/debloat-extra.txt` ("optional slimmer set") and
  `hisense-u75-hengshan/debloat-65u7esg.txt` (a different model, the 65U7ESG, in the same folder).
  These can't be treated as the main list. The simplest option is to read `debloat.txt` only and
  record the others as variants. The Hisense case is really a separate model.
- **Extra files:** six folders have a `theme/` folder, `epson-ls800/` has its own `restore.sh`, and
  two have screenshots. The sync script should ignore them. We never run upstream scripts.
- **Lists disable the stock launcher.** 86 of 345 lists disable a stock home app
  (`com.google.android.tvlauncher`, `com.google.android.apps.tv.launcherx` or
  `com.google.android.leanbacklauncher`). Those lists assume the user also installs upstream's
  replacement launcher from `launcher/`. Applying one of them on its own, without a launcher, can leave
  the TV without a home screen. TVTidy doesn't ship a launcher, so the sync has to treat these
  packages as `no` (or remove them) for every model.
- **setupwraith deletes Wi-Fi.** `com.google.android.tungsten.setupwraith` is in 125 lists.
  Upstream's `disable.sh` skips it by default because disabling it deletes the Wi-Fi network saved
  during first-run setup, which drops the TV off Wi-Fi and with it ADB and the phone remote. Our
  helper connects over Wi-Fi ADB, so it would lose its own connection. It must be `no`, or at least
  carry a hard warning.

## 5. Per-package notes, risk ratings and categories

There are no structured categories or risk ratings. What we can reuse:

- **Group headers:** the comment line above each group. There are 1,084 distinct strings, all free
  text, for example "Preloaded apps" (40), "TCL content, ads and promos" (16), "Retail demo" (15),
  "ACR viewing tracker" (15) and "Telemetry and feedback" (11). Keyword matching (telemetry,
  analytics, ACR, ads, promo, demo, preloaded) can suggest a `category`, but it is a heuristic.
- **Inline comments:** 5,004 of 8,077 active package lines (62%) have a trailing comment, for example
  `# Google Duo`, `# re-enable to check for firmware updates` or `# retail demo mode`. These are the
  best raw material for package descriptions and caution notes. They are written per model, so the
  same package can have different notes on different models.
- **Kept packages:** commented-out packages and "Kept on purpose, do not disable" header blocks tell
  us what testers found unsafe or worth keeping on that model, often with a reason, for example
  `com.mediatek.tv.service ... remote control and HDMI` or `com.google.android.katniss: microphone
  button and voice search`. The most often kept: `com.google.android.apps.mediashell` (Chromecast,
  kept in 64 lists) and `katniss` (kept in 50 lists, active in 113).
- **Packages that must never be disabled:** `tools/disable.sh` has a hard refusal regex
  (`CORE_RE`, mirrored in `disable.ps1` and `recovery.py`) covering core Android and TV middleware:
  `android`, `android.ext.services|shared`, `com.android.systemui`, `com.android.shell`,
  `com.android.phone`, `com.android.settings`, `com.android.tv.settings`,
  `com.(google.)android.(permissioncontroller|packageinstaller|ext.services|ext.shared|modulemetadata)`,
  `com.google.android.overlay.modules.*`, `com.android.providers.*` (except calendar, contacts,
  userdictionary and blockednumber), `com.cltv.mal` and `com.mediatek.(tis|tv.service|tv.agent)`.
  Comments cite bricked or boot-looping TVs (#884, #1578). We should copy this list as the
  `safe_to_disable = "no"` rule, and enforce it in the helper as well as in the data.
- **Restore detail:** upstream's restore records which packages were already disabled from the factory
  so it doesn't re-enable them, and some headers list them ("Already disabled from the factory (do not
  re-enable them on restore)"). Our restore file should record each package's state before we change
  it, rather than running `pm enable` on everything in the list.

## 6. Trademark, naming and attribution requirements

- **License:** MIT, so keep the copyright and permission notice (section 1). The README and
  CONTRIBUTING ask for no further attribution, though the README credits contributors through the
  GitHub contributors graph.
- **Naming:** the README says: "**Official links:** cleanyour.tv and this repo. Other domains using
  the name, such as cleanyourtv.com, are not run by this project (#1004)." This confirms that a
  lookalike name or domain would be called out.
- **Their disclaimer:** "CleanYourTV is an independent open-source project. It is not affiliated
  with, endorsed by or sponsored by any TV maker or platform. Brand and model names are used only to
  say which TV a list was tested on, and remain the trademarks of their owners." The kit's footer
  takes the same stance.
- **No binaries:** "No prebuilt APKs or binaries in the repo, not even as CI artifacts. People build
  from source" (AGENTS.md). This applies to their repo, not to projects built on it.
- **SHOWCASE rules for a row:** "It is open source, and the link goes to a repository or branch
  people can read and build." It must also say which TV it was tested on, not phone home beyond its
  README, and be yours. **A paid, closed-source helper would not qualify.** Kit §10 makes the SHOWCASE
  PR distribution channel #1. As planned, only the free site, or an open-source helper, could be listed.

### Competitors already listed in SHOWCASE "Tools and companion apps"

The kit's positioning ("without a coding agent", one-click, reversible) is already offered for free:

| Project | What it is |
|---|---|
| **Clean Your TV app** (udhaykumarbala) | Android phone app: connect, analyse, clean, with a plan first, a restore point and undo. Linked from upstream's README as "the easiest way in" at cleanyour.tv/app |
| **TidyTV** (jolan94, tidytv.winkle.dev) | Android phone app that applies the per-model lists with no computer and no AI agent: backup first, disable only, one-tap restore. **Its name is "TVTidy" with the words swapped** |
| **Clean Your TV Companion** (gethari) | Windows/macOS/Linux desktop app over ADB that compares installed apps with the lists. Preview only for now; making changes is on its roadmap |
| **CleanTV by VGS**, **Tellyscope** | Android apps that apply the lists with backup and restore, GPL or open source |

Upstream also links `cleanyour.tv/not-android` for Samsung, LG, Roku and Vizio settings guides. That
overlaps kit §13's month-3 idea "Non-Android coverage".

## 7. Proposed normalized schema (kit §5, adjusted)

### `models.json` entry

```json
{
  "slug": "xiaomi-mi-tv-4a",
  "brand_slug": "xiaomi",
  "brand_display": "Xiaomi",
  "display_name": "Xiaomi Mi TV 4A (MiTV-MOOQ1)",
  "os_raw": "Android TV 10 and 11",
  "platform": "android_tv",
  "android_version": "10",
  "firmware_note": "Android TV 10, firmware QTG3.200305.006.2591",
  "upstream_notes": "PatchWall, Mi analytics, SmartShare, ...",
  "upstream_path": "examples/xiaomi-mi-tv-4a/debloat.txt",
  "upstream_commit": "095b71ad93d99ea28d94d97b06385709d354b795",
  "last_changed_at": "2026-10-26",
  "has_readme": false,
  "variants": [],
  "packages": [
    { "id": "com.xiaomi.mitv.updateservice", "group": "Xiaomi background services",
      "note": "re-enable to check for firmware updates" }
  ],
  "kept_packages": [
    { "id": "com.google.android.apps.mediashell", "note": "Chromecast" }
  ],
  "excluded_packages": [
    { "id": "com.google.android.tvlauncher", "reason": "stock_launcher" }
  ]
}
```

- `slug` is the upstream folder name. `brand_slug` is the slugified `tv.json` brand, not the folder
  prefix.
- `platform` is one of `android_tv | google_tv | fire_os | android | other`, and `android_version`
  is the first Android major version found in `os` (nullable). The parser keeps `os_raw` because
  values like "10 and 11" or "Android TV 11 / Google TV 14" don't reduce to one value.
- `packages` replaces the kit's flat `package_ids[]`, so each model page can show upstream's group and
  note.
- `excluded_packages` holds packages that are active upstream but that TVTidy refuses to apply: stock
  launchers, setupwraith and anything matching `CORE_RE`. The page can still show them with the reason.
- `last_changed_at` comes from `git log -1 --format=%cs -- examples/<slug>/`.
- `variants` lists extra `debloat-*.txt` files, which are recorded but not parsed into `packages` in
  v1.

### `packages.json` entry

```json
{
  "id": "com.google.android.feedback",
  "seen_on_model_count": 257,
  "kept_on_model_count": 7,
  "category": "telemetry",
  "category_source": "heuristic",
  "safe_to_disable": "caution",
  "description": "Unverified",
  "upstream_notes": ["..."]
}
```

- `category` is one of `ads | telemetry | preinstalled_app | system_risky`. It comes from
  `data/overrides/packages.json` when present (`category_source: "override"`), otherwise from keyword
  matching on group headers (`"heuristic"`).
- `safe_to_disable` is `no` for `CORE_RE` matches, stock launchers and setupwraith, whatever the
  overrides say. Otherwise the override value is used, and `caution` with `description: "Unverified"`
  if there is none, per CLAUDE.md.
- `upstream_notes` is a deduplicated sample of inline comments across models, used as raw material
  for writing overrides.

`brands.json` stays as in the kit (`slug, display_name, model_count`).

### Fields the kit assumed that upstream does not provide

| Kit field | Reality |
|---|---|
| `android_version` as a clean value | Free-text `os` with 55 distinct strings; must be parsed, keep `os_raw` |
| `upstream_path: models/xiaomi/mi-tv-4a.txt` | Actually `examples/<slug>/debloat.txt`; no brand folders |
| Brand from folder structure (kit §3) | Brand comes from `tv.json`; 6 folder names don't start with the brand |
| Package `category` | Not provided; heuristic from free-text group headers or our overrides |
| Package `safe_to_disable` | Not provided; derivable only for `no` (CORE_RE, launchers, setupwraith) |
| Package `description` | Not provided; per-model inline comments on 62% of lines are a starting point |
| `last_changed_at` | Not in the data; take it from git history |
| 341 models | 345 at this commit |

## 8. Recommendations before Session 2

1. **Copy only `examples/` and `LICENSE` into `data/upstream/`, not the whole repo.** Upstream has its
   own `CLAUDE.md`, `AGENTS.md` and `PROMPT.md` written for coding agents. A full clone inside our
   repo would put agent instructions from another project in our working tree.
2. **Make the launcher and setupwraith exclusion a rule in `CLAUDE.md`.** It is the main way
   TVTidy's use of the lists differs from upstream's.
3. **Re-check positioning and channel #1 against section 6** before building the paid helper: the
   name clash with TidyTV, the free phone apps that already do the job, and the open-source
   requirement for SHOWCASE.
