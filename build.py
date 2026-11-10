#!/usr/bin/env python3
"""Rebuild index.html from the source files.

    python3 build.py

The page stays a single offline file. Do not edit index.html by hand.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JS_FILES = ("logic.js", "treasure.js", "ui.js", "xp.js", "custom.js", "items.js", "print.js")


def embed(obj):
    """JSON that is safe to drop inside a <script> element."""
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return (
        text.replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )


def main():
    shell = (ROOT / "shell.html").read_text()
    marker = "<!-- APP_SCRIPT -->"
    if marker not in shell:
        raise SystemExit("shell.html is missing <!-- APP_SCRIPT -->")
    monsters = json.loads((ROOT / "mon.json").read_text())
    homebrew = json.loads((ROOT / "hb.json").read_text())
    magic = json.loads((ROOT / "mi_trim.json").read_text())
    if not isinstance(monsters, list) or len(monsters) < 300:
        raise SystemExit("mon.json does not look like the SRD monster list")
    parts = [
        "const SRD=" + embed(monsters) + ";",
        "const HB=" + embed(homebrew) + ";",
        "let CUSTOM=[];",
        "let MONALL=SRD.concat(HB);",
        "let MON=MONALL;",
        "const MAGIC=" + embed(magic) + ";",
    ]
    for name in JS_FILES:
        parts.append((ROOT / name).read_text().rstrip() + "\n")
    script = "<script>\n" + "\n".join(parts) + "\n</script>"
    out = shell.replace(marker, script)
    if out.count("<script>") != 1 or "</script>" not in out:
        raise SystemExit("built page should contain exactly one script block")
    (ROOT / "index.html").write_text(out)
    print(f"Wrote index.html ({len(out)} bytes, {len(monsters)} SRD + {len(homebrew)} homebrew)")


if __name__ == "__main__":
    main()
