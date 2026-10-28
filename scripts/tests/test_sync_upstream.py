import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

import sync_upstream as sync

# Two real lists copied from upstream at 095b71a, with its LICENSE.
FIXTURES = Path(__file__).parent / "fixtures" / "upstream"
XIAOMI = "xiaomi-mi-tv-4a"
AIPRO = "aipro2k"


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", *args],
        cwd=repo, check=True, capture_output=True, text=True,
    ).stdout.strip()


def commit_all(repo: Path, message: str) -> str:
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", message)
    return git(repo, "rev-parse", "HEAD")


@pytest.fixture
def upstream(tmp_path: Path) -> Path:
    """A local git repo shaped like upstream, holding the two fixture lists."""
    repo = tmp_path / "upstream"
    shutil.copytree(FIXTURES, repo)
    git(repo, "init", "-q", "-b", "main")
    commit_all(repo, "two lists")
    return repo


@pytest.fixture
def data_dir(tmp_path: Path) -> Path:
    d = tmp_path / "data"
    (d / "overrides").mkdir(parents=True)
    (d / "overrides" / "packages.json").write_text("{}\n")
    return d


def run_sync(upstream: Path, data_dir: Path, *extra: str) -> int:
    cache = data_dir.parent / "cache"
    return sync.main(["--repo", str(upstream), "--cache-dir", str(cache), "--data-dir", str(data_dir), *extra])


def load(data_dir: Path, name: str):
    return json.loads((data_dir / "normalized" / name).read_text())


def by_id(items: list[dict]) -> dict[str, dict]:
    return {i.get("id", i.get("slug")): i for i in items}


# --- parse --------------------------------------------------------------------------------------


def test_parse_groups_notes_and_kept_packages():
    parsed = sync.parse_debloat((FIXTURES / "examples" / AIPRO / "debloat.txt").read_text())
    pkgs = by_id(parsed["packages"])

    assert parsed["bad_tokens"] == []
    assert parsed["first_line"].startswith("AiPro2K (Expressluck, device dongnae)")
    assert pkgs["tv.anoki.acr.anokiacroptin"] == {
        "id": "tv.anoki.acr.anokiacroptin",
        "group": "Telemetry and ad services",
        "note": "automatic content recognition",
    }
    assert pkgs["com.google.android.feedback"]["note"] is None
    # The opening comment block describes the TV; it is never a group.
    assert all(not p["group"].startswith("AiPro2K") for p in parsed["packages"])
    kept = by_id(parsed["kept"])
    assert kept["com.mediatek.wwtv.mediaplayer"]["note"].startswith("MMP, USB media player")
    assert "com.google.android.apps.tv.launcherx" not in kept  # active, so not kept


def test_parse_matches_upstream_line_rules():
    text = "﻿# TV\r\n\r\n# Group\r\ncom.example.one   # note\r\ncom.example.one\r\nnot-a-package\r\n"
    parsed = sync.parse_debloat(text)
    assert [p["id"] for p in parsed["packages"]] == ["com.example.one"]  # BOM, CRLF, dedupe
    assert parsed["bad_tokens"] == ["not-a-package"]


def test_parse_ruled_header_without_blank_line():
    parsed = sync.parse_debloat("# TV name\n# --- Promo services ---\ncom.example.promo\n")
    assert parsed["packages"][0]["group"] == "Promo services"


@pytest.mark.parametrize("os_raw, expected", [
    ("Android TV 11", ("android_tv", "11")),
    ("Google TV 14", ("google_tv", "14")),
    ("Fire OS 7.7.1.7 / Android 9", ("fire_os", "9")),
    ("Android TV 10 and 11", ("android_tv", "10")),
    ("Android 14 (HyperOS 3, CN build)", ("android", "14")),
    ("Google TV", ("google_tv", None)),
])
def test_parse_os(os_raw, expected):
    assert sync.parse_os(os_raw) == expected


# --- full sync: dedupe, exclusions, upstream copy ------------------------------------------------


def test_sync_writes_normalized_data_and_dedupes(upstream, data_dir):
    assert run_sync(upstream, data_dir) == 0

    models = by_id(load(data_dir, "models.json"))
    packages = by_id(load(data_dir, "packages.json"))
    brands = load(data_dir, "brands.json")

    assert set(models) == {XIAOMI, AIPRO}
    assert brands == [
        {"slug": "aipro2k", "display_name": "AiPro2K", "model_count": 1},
        {"slug": "xiaomi", "display_name": "Xiaomi", "model_count": 1},
    ]
    xiaomi = models[XIAOMI]
    assert xiaomi["brand_slug"] == "xiaomi"
    assert (xiaomi["platform"], xiaomi["android_version"]) == ("android_tv", "10")
    assert xiaomi["upstream_path"] == "examples/xiaomi-mi-tv-4a/debloat.txt"
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", xiaomi["last_changed_at"])

    # In both lists, counted once per model.
    for shared in ("com.google.android.play.games", "com.google.android.feedback", "fusion.android.tv.demo"):
        assert packages[shared]["seen_on_model_count"] == 2
    assert packages["com.miui.tv.analytics"]["seen_on_model_count"] == 1
    assert len(packages) == len({p["id"] for m in models.values()
                                 for p in m["packages"] + m["excluded_packages"]})

    # Stock launchers and setupwraith are moved out of the applicable list.
    assert {"id": "com.google.android.tvlauncher", "reason": "stock_launcher"} in xiaomi["excluded_packages"]
    assert "com.google.android.tvlauncher" not in {p["id"] for p in xiaomi["packages"]}
    excluded = {e["id"]: e["reason"] for e in models[AIPRO]["excluded_packages"]}
    assert excluded == {
        "com.google.android.tungsten.setupwraith": "setupwraith_wifi",
        "com.google.android.apps.tv.launcherx": "stock_launcher",
    }

    upstream_copy = data_dir / "upstream"
    assert (upstream_copy / "LICENSE").read_text() == (FIXTURES / "LICENSE").read_text()
    sha = xiaomi["upstream_commit"]
    assert f"Commit: {sha}" in (upstream_copy / "NOTICE").read_text()
    assert "TVTidy is unaffiliated" in (upstream_copy / "NOTICE").read_text()
    assert (upstream_copy / "examples" / XIAOMI / "debloat.txt").is_file()
    assert not (data_dir / "normalized" / "unparsed.json").exists()


# --- overrides ------------------------------------------------------------------------------------


def test_overrides_win_except_for_forced_no(upstream, data_dir):
    (data_dir / "overrides" / "packages.json").write_text(json.dumps({
        "com.xiaomi.statistic": {"description": "Xiaomi usage statistics.", "category": "telemetry",
                                 "safe_to_disable": "yes"},
        "com.xiaomi.mimusic2": {"safe_to_disable": "no"},
        "com.google.android.tvlauncher": {"safe_to_disable": "yes", "description": "Stock home."},
    }))
    assert run_sync(upstream, data_dir) == 0
    packages = by_id(load(data_dir, "packages.json"))

    statistic = packages["com.xiaomi.statistic"]
    assert (statistic["safe_to_disable"], statistic["category"], statistic["category_source"]) == (
        "yes", "telemetry", "override")
    assert statistic["description"] == "Xiaomi usage statistics."

    partial = packages["com.xiaomi.mimusic2"]
    assert (partial["safe_to_disable"], partial["description"]) == ("no", "Unverified")
    assert partial["category_source"] == "heuristic"

    launcher = packages["com.google.android.tvlauncher"]
    assert (launcher["safe_to_disable"], launcher["category"], launcher["excluded_reason"]) == (
        "no", "system_risky", "stock_launcher")
    assert launcher["description"] == "Stock home."

    untouched = packages["com.miui.tv.analytics"]
    assert (untouched["safe_to_disable"], untouched["description"]) == ("caution", "Unverified")
    assert untouched["category"] == "telemetry"  # from the "Xiaomi telemetry" header


def test_invalid_override_fails(upstream, data_dir):
    (data_dir / "overrides" / "packages.json").write_text('{"com.xiaomi.statistic": {"safe_to_disable": "maybe"}}')
    assert run_sync(upstream, data_dir) == 2
    assert not (data_dir / "normalized" / "models.json").exists()


# --- changelog ------------------------------------------------------------------------------------


def test_changelog_empty_on_first_run_then_diffs(upstream, data_dir):
    first = git(upstream, "rev-parse", "HEAD")
    assert run_sync(upstream, data_dir) == 0
    assert load(data_dir, "changelog.json") == {
        "from_commit": None, "to_commit": first, "models_added": [], "models_removed": [],
        "packages_changed": [],
    }

    lst = upstream / "examples" / XIAOMI / "debloat.txt"
    lst.write_text(lst.read_text().replace("com.xiaomi.mimusic2\n", "com.xiaomi.newpromo\n"))
    new_model = upstream / "examples" / "example-tv"
    new_model.mkdir()
    (new_model / "tv.json").write_text('{"tv": "Example TV", "os": "Google TV 12", "brand": "Example", "notes": "x"}')
    (new_model / "debloat.txt").write_text("# Example TV\n\n# Ads\ncom.example.ads\n")
    second = commit_all(upstream, "change a list, add a model")

    assert run_sync(upstream, data_dir) == 0
    assert load(data_dir, "changelog.json") == {
        "from_commit": first, "to_commit": second, "models_added": ["example-tv"], "models_removed": [],
        "packages_changed": [{"slug": XIAOMI, "added": ["com.xiaomi.newpromo"], "removed": ["com.xiaomi.mimusic2"]}],
    }

    # Re-running the same commit keeps the changelog instead of emptying it.
    assert run_sync(upstream, data_dir) == 0
    assert load(data_dir, "changelog.json")["from_commit"] == first

    # Going back to the older commit shows the reverse diff.
    assert run_sync(upstream, data_dir, "--commit", first) == 0
    assert load(data_dir, "changelog.json") == {
        "from_commit": second, "to_commit": first, "models_added": [], "models_removed": ["example-tv"],
        "packages_changed": [{"slug": XIAOMI, "added": ["com.xiaomi.mimusic2"], "removed": ["com.xiaomi.newpromo"]}],
    }


# --- unparsed lists -------------------------------------------------------------------------------


def test_unparsed_list_exits_nonzero_and_writes_nothing_else(upstream, data_dir):
    assert run_sync(upstream, data_dir) == 0
    models_before = (data_dir / "normalized" / "models.json").read_text()

    lst = upstream / "examples" / AIPRO / "debloat.txt"
    lst.write_text(lst.read_text() + "\nrm -rf /\n")
    (upstream / "examples" / "no-tv-json").mkdir()
    (upstream / "examples" / "no-tv-json" / "debloat.txt").write_text("com.example.one\n")
    commit_all(upstream, "break two lists")

    assert run_sync(upstream, data_dir) == 1
    unparsed = load(data_dir, "unparsed.json")
    assert {u["slug"]: u["reason"] for u in unparsed["lists"]} == {
        AIPRO: "not a package name: rm",
        "no-tv-json": "missing tv.json",
    }
    assert (data_dir / "normalized" / "models.json").read_text() == models_before

    # Once upstream is fixed, the next run clears unparsed.json.
    lst.write_text(lst.read_text().replace("\nrm -rf /\n", "\n"))
    shutil.rmtree(upstream / "examples" / "no-tv-json")
    commit_all(upstream, "fix")
    assert run_sync(upstream, data_dir) == 0
    assert not (data_dir / "normalized" / "unparsed.json").exists()


def test_rejects_option_like_commit(upstream, data_dir):
    assert run_sync(upstream, data_dir, "--commit=--upload-pack=evil") == 2
