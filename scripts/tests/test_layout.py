from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Top-level layout from docs/gtm-kit.md section 3.
EXPECTED_DIRS = [
    "data/upstream",
    "data/normalized",
    "data/overrides",
    "scripts",
    "site",
    "helper/tvtidy_helper",
    "helper/build",
    "worker",
    "supabase/migrations",
    ".github/workflows",
]


def test_monorepo_layout_exists():
    missing = [d for d in EXPECTED_DIRS if not (ROOT / d).is_dir()]
    assert missing == []
