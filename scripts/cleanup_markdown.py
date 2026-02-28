import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {"_site", "vendor", ".git", ".jekyll-cache", ".bundle"}

IMAGE_RE = re.compile(r"^!\[.*\]\(.*\)$")
HEADING_RE = re.compile(r"^#{2,3} ")
LIST_RE = re.compile(r"^- ")


def normalize_bullets(line: str) -> str:
    if line.startswith("・"):
        return "- " + line.lstrip("・").strip()
    if line.startswith("●"):
        return "- " + line.lstrip("●").strip()
    return line


def cleanup(lines: list[str]) -> list[str]:
    out = []
    prev = None
    for raw in lines:
        line = raw.rstrip()
        line = line.replace("\u200b", "").replace("\x00", "")
        if not line:
            if out and out[-1] != "":
                out.append("")
            continue
        line = normalize_bullets(line)
        if prev == line:
            continue
        out.append(line)
        prev = line

    # trim leading/trailing empty lines
    while out and out[0] == "":
        out.pop(0)
    while out and out[-1] == "":
        out.pop()

    # remove repeated images back-to-back
    cleaned = []
    last_img = None
    for line in out:
        if IMAGE_RE.match(line):
            if line == last_img:
                continue
            last_img = line
        else:
            last_img = None
        cleaned.append(line)
    return cleaned


def process_file(path: Path):
    text = path.read_text(encoding="utf-8")
    if "---" not in text:
        return
    parts = text.split("---", 2)
    if len(parts) < 3:
        return
    head = "---" + parts[1] + "---\n"
    body = parts[2].lstrip("\n")
    lines = body.split("\n")
    lines = cleanup(lines)
    new_body = "\n".join(lines) + "\n"
    path.write_text(head + "\n" + new_body, encoding="utf-8")


def main():
    for path in ROOT.rglob("index.md"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        process_file(path)


if __name__ == "__main__":
    main()
