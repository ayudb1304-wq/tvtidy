# Package overrides

`packages.json` holds hand-written facts about packages. `scripts/sync_upstream.py` merges it over
the upstream data, and an override wins over anything the script works out itself.

The file is one JSON object keyed by package id. Every field is optional:

```json
{
  "com.google.android.feedback": {
    "description": "Google's feedback and crash reporter. Nothing on the TV depends on it.",
    "category": "telemetry",
    "safe_to_disable": "yes"
  }
}
```

| Field | Values | When missing |
|---|---|---|
| `description` | One or two plain sentences: what the package is and what stops working without it | `"Unverified"` |
| `category` | `ads`, `telemetry`, `preinstalled_app`, `system_risky` | Guessed from upstream's group headers (`category_source: "heuristic"`) |
| `safe_to_disable` | `yes`, `caution`, `no` | `"caution"` |

What the ratings mean, and the copy each one gets on the site, is in `docs/gtm-kit.md` section 5.

An override can't make these packages applicable. They are always `no` with `category: "system_risky"`,
because applying them can stop the TV booting, leave it with no home screen, or drop its Wi-Fi:

- core Android and TV middleware (the `CORE_RE` list copied from upstream's `tools/disable.sh`)
- the stock launchers `com.google.android.apps.tv.launcherx`, `com.google.android.tvlauncher` and
  `com.google.android.leanbacklauncher`
- `com.google.android.tungsten.setupwraith`

Unknown fields or values fail the sync, so a typo doesn't quietly fall back to "Unverified".
