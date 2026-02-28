from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {"_site", "vendor", ".git", ".jekyll-cache", ".bundle"}

KEYVAL_RE = re.compile(r"^([^:：\n]{1,40})[：:]\s*(.+)$")


def split_front_matter(text: str) -> tuple[str, str]:
    if not text.startswith("---\n"):
        return "", text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return "", text
    head = "---" + parts[1] + "---\n\n"
    body = parts[2].lstrip("\n")
    return head, body


def normalize_list_markers(line: str) -> str:
    s = line.rstrip()
    if re.match(r"^\s*[・●○]\s*", s):
        content = re.sub(r"^\s*[・●○]\s*", "", s).strip()
        return f"- {content}" if content else s
    if re.match(r"^\s*-\S", s) and not s.startswith("---"):
        return re.sub(r"^\s*-\s*", "- ", s, count=1)
    m = re.match(r"^\s*(\d+)[\)．\.]\s*(.+)$", s)
    if m:
        return f"{m.group(1)}. {m.group(2).strip()}"
    return s


def is_heading_candidate(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if s.startswith(("#", "!", "- ", "* ", "|", "> ", "```")):
        return False
    if "http://" in s or "https://" in s:
        return False
    if len(s) > 70:
        return False
    if s.endswith("。"):
        return False
    if re.match(r"^\d+\.\s+\S", s):
        return True
    if s.endswith((":", "：")):
        return True
    if s.startswith(("〇", "○", "●", "■", "◆", "【")):
        return True
    if re.match(r"^[-ー―].+[-ー―]$", s):
        return True
    return False


def convert_keyval_block(block: list[str]) -> list[str]:
    pairs: list[tuple[str, str]] = []
    for line in block:
        m = KEYVAL_RE.match(line.strip())
        if not m:
            return block
        key = m.group(1).strip()
        val = m.group(2).strip()
        if not key or not val:
            return block
        if any(x in key for x in ("。", "、", "（", "）", "(", ")")):
            return block
        pairs.append((key, val))
    if len(pairs) < 2:
        return block

    out = [f"| {pairs[0][0]} | {pairs[0][1]} |", "| --- | --- |"]
    for key, val in pairs[1:]:
        out.append(f"| {key} | {val} |")
    return out


def normalize_body(body: str) -> str:
    lines = [normalize_list_markers(x) for x in body.splitlines()]
    out: list[str] = []

    i = 0
    while i < len(lines):
        cur = lines[i]
        if cur.strip() == "":
            if out and out[-1] != "":
                out.append("")
            i += 1
            continue

        # Try table conversion for key:value style blocks.
        if KEYVAL_RE.match(cur.strip()):
            j = i
            block: list[str] = []
            while j < len(lines) and lines[j].strip() != "":
                block.append(lines[j])
                j += 1
            converted = convert_keyval_block(block)
            out.extend(converted)
            if j < len(lines) and out and out[-1] != "":
                out.append("")
            i = j
            continue

        prev_blank = i == 0 or lines[i - 1].strip() == ""
        next_nonempty = i + 1 < len(lines) and lines[i + 1].strip() != ""
        if prev_blank and next_nonempty and is_heading_candidate(cur):
            out.append(f"## {cur.strip()}")
            out.append("")
        else:
            out.append(cur.rstrip())
        i += 1

    # Remove immediate duplicate paragraph lines.
    deduped: list[str] = []
    prev = None
    for line in out:
        if line and line == prev:
            continue
        deduped.append(line)
        prev = line

    while deduped and deduped[0] == "":
        deduped.pop(0)
    while deduped and deduped[-1] == "":
        deduped.pop()
    return "\n".join(deduped) + "\n"


def process_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    head, body = split_front_matter(text)
    new_body = normalize_body(body)
    new_text = head + new_body if head else new_body
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = 0
    for path in ROOT.rglob("*.md"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if process_file(path):
            changed += 1
    print(f"Updated {changed} markdown files.")


if __name__ == "__main__":
    main()
