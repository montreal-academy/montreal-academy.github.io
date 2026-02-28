from pathlib import Path
import re

TARGETS = [
    Path('start-living-in-montreal/index.md'),
    Path('news/index.md'),
]

IMG_RE = re.compile(r"^!\[[^\]]*\]\(([^)]+)\)\s*$")

# Images to drop completely (decorative/repeated)
DROP_SUBSTRINGS = [
    'start-living-in-montreal-b16fc6bdedfc.gif',
]

for path in TARGETS:
    if not path.exists():
        continue
    lines = path.read_text(encoding='utf-8').split('\n')
    seen = set()
    out = []
    for line in lines:
        m = IMG_RE.match(line.strip())
        if m:
            src = m.group(1)
            if any(s in src for s in DROP_SUBSTRINGS):
                continue
            if src in seen:
                continue
            seen.add(src)
        out.append(line)
    path.write_text('\n'.join(out).rstrip() + '\n', encoding='utf-8')
