from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {"_site", "vendor", ".git", ".jekyll-cache", ".bundle"}

SUB_RE = re.compile(r"^subtitle:\s*(.*)$")
TITLE_RE = re.compile(r"^title:\s*(.*)$")


def to_single_quoted(value: str) -> str:
    value = value.strip()
    if value.startswith("'") and value.endswith("'"):
        return value
    if value.startswith('"') and value.endswith('"'):
        value = value[1:-1]
    value = value.replace("'", "''")
    return f"'{value}'"


def process(path: Path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return
    parts = text.split("---", 2)
    if len(parts) < 3:
        return
    head_lines = parts[1].strip("\n").split("\n")
    changed = False
    new_head = []
    for line in head_lines:
        m = SUB_RE.match(line)
        if m:
            new_val = to_single_quoted(m.group(1))
            new_head.append(f"subtitle: {new_val}")
            changed = True
            continue
        m = TITLE_RE.match(line)
        if m and ":" in m.group(1):
            new_val = to_single_quoted(m.group(1))
            new_head.append(f"title: {new_val}")
            changed = True
            continue
        new_head.append(line)
    if changed:
        new_text = "---\n" + "\n".join(new_head) + "\n---\n" + parts[2].lstrip("\n")
        path.write_text(new_text, encoding="utf-8")


def main():
    for path in ROOT.rglob("index.md"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        process(path)


if __name__ == "__main__":
    main()
