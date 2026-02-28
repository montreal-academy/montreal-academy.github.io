import hashlib
import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse, urlsplit, urlunsplit, unquote, quote
from urllib.request import urlopen, Request

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT
PAGES_DIR = ROOT / "pages"
IMAGES_DIR = ROOT / "assets" / "images" / "imported"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

USER_AGENT = "Mozilla/5.0 (compatible; MontrealAcademyImporter/1.0)"

JP_RE = re.compile(r"[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]")
ZERO_WIDTH_RE = re.compile(r"[\u200b\u200c\u200d\ufeff\x00]")


def normalize_url(url: str) -> str:
    parts = urlsplit(url)
    path = quote(parts.path, safe="/")
    query = quote(parts.query, safe="=&?/")
    return urlunsplit((parts.scheme, parts.netloc, path, query, parts.fragment))


def fetch(url: str) -> str:
    safe_url = normalize_url(url)
    req = Request(safe_url, headers={"User-Agent": USER_AGENT})
    with urlopen(req) as resp:
        data = resp.read()
    return data.decode("utf-8", errors="ignore")


def load_sitemap(path: Path) -> list[str]:
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    root = ET.parse(path).getroot()
    return [loc.text.strip() for loc in root.findall(".//sm:loc", ns)]


def clean_text(text: str) -> str:
    # Preserve original wording/spacing as much as possible.
    text = ZERO_WIDTH_RE.sub("", text)
    return text.strip()


def extract_main(soup: BeautifulSoup):
    return (
        soup.find("article")
        or soup.find(id="PAGES_CONTAINER")
        or soup.find(id="SITE_PAGES")
        or soup.body
    )


def find_title(soup: BeautifulSoup) -> str:
    og = soup.find("meta", property="og:title")
    if og and og.get("content"):
        return clean_text(og["content"])
    if soup.title and soup.title.string:
        return clean_text(soup.title.string)
    return ""


def find_description(soup: BeautifulSoup) -> str:
    meta = soup.find("meta", attrs={"name": "description"})
    if meta and meta.get("content"):
        return clean_text(meta["content"])
    og = soup.find("meta", property="og:description")
    if og and og.get("content"):
        return clean_text(og["content"])
    return ""


def find_published(soup: BeautifulSoup) -> str | None:
    meta = soup.find("meta", property="article:published_time")
    if meta and meta.get("content"):
        return meta["content"]
    return None


def image_url_from_tag(tag):
    if tag.name == "img":
        src = tag.get("src") or tag.get("data-src")
        if src:
            # strip wix size params
            if "/v1/" in src:
                src = src.split("/v1/")[0]
            return src
        return None
    # background image in style
    style = tag.get("style", "")
    if "background-image" in style:
        m = re.search(r"url\(['\"]?(.*?)['\"]?\)", style)
        if m:
            url = m.group(1)
            if "/v1/" in url:
                url = url.split("/v1/")[0]
            return url
    # wix data-image-info
    info = tag.get("data-image-info")
    if info:
        try:
            data = json.loads(info)
            uri = data.get("imageData", {}).get("uri") or data.get("uri")
            if uri:
                if uri.startswith("http"):
                    return uri
                return f"https://static.wixstatic.com/media/{uri}"
        except Exception:
            pass
    return None


def download_image(url: str, slug_hint: str) -> str:
    if not url:
        return ""
    ext = os.path.splitext(urlparse(url).path)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        ext = ".jpg"
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]
    filename = f"{slug_hint}-{h}{ext}"
    out_path = IMAGES_DIR / filename
    if not out_path.exists():
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT})
            with urlopen(req) as resp:
                data = resp.read()
            out_path.write_bytes(data)
        except Exception:
            return ""
    return f"/assets/images/imported/{filename}"


def collect_content(main: BeautifulSoup, page_title: str, slug_hint: str):
    lines = []
    # Images collected in order of appearance
    for tag in main.find_all(["h1", "h2", "h3", "p", "li", "img"]):
        if tag.name == "img":
            img_url = image_url_from_tag(tag)
            local = download_image(img_url, slug_hint) if img_url else ""
            alt = clean_text(tag.get("alt", ""))
            if local:
                lines.append(f"![{alt}]({local})" if alt else f"![]({local})")
            continue
        text = clean_text(tag.get_text(" "))
        if not text:
            continue
        if tag.name == "h1":
            if page_title and text == page_title:
                continue
            lines.append(f"## {text}")
        elif tag.name == "h2":
            lines.append(f"## {text}")
        elif tag.name == "h3":
            lines.append(f"### {text}")
        elif tag.name == "li":
            lines.append(f"- {text}")
        else:
            lines.append(text)
    return lines


def safe_dir_from_path(path: str) -> Path:
    base_dir = OUTPUT_DIR
    if path != "/" and not (path.startswith("/news/") or path.startswith("/single-post/")):
        base_dir = PAGES_DIR
    # Use URL-encoded path segments for filesystem safety
    if path == "/":
        return base_dir
    path = path.rstrip("/")
    parts = path.strip("/").split("/")
    safe_parts = [quote(part, safe="A-Za-z0-9._~-") for part in parts]
    return base_dir.joinpath(*safe_parts)


def make_front_matter(title: str, description: str, permalink: str, published: str | None, source_url: str):
    def yaml_quote(value: str) -> str:
        value = " ".join(value.splitlines()).strip()
        value = value.replace("'", "''")
        return f"'{value}'"

    lines = ["---", "layout: page"]
    if title:
        lines.append(f"title: {yaml_quote(title)}")
    if description:
        lines.append(f"subtitle: {yaml_quote(description)}")
    if permalink:
        lines.append(f"permalink: {permalink}")
    if published:
        lines.append(f"date: {published}")
    lines.append(f"source_url: {source_url}")
    lines.append("---")
    return "\n".join(lines)


def process_url(url: str):
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    title = find_title(soup)
    description = find_description(soup)
    published = find_published(soup)

    parsed = urlparse(url)
    path = parsed.path or "/"
    permalink = path if path.endswith("/") else f"{path}/"

    slug_hint = re.sub(r"[^a-z0-9]+", "-", unquote(path).strip("/").lower())
    slug_hint = slug_hint or "home"

    main = extract_main(soup)
    if not main:
        return
    for tag in main(["script", "style", "noscript"]):
        tag.extract()

    content_lines = collect_content(main, title, slug_hint)
    if not content_lines:
        return

    out_dir = safe_dir_from_path(path)
    if path == "/":
        out_file = OUTPUT_DIR / "index.md"
    else:
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / "index.md"

    fm = make_front_matter(title, description, permalink, published, url)
    body = "\n\n".join(content_lines)
    out_file.write_text(f"{fm}\n\n{body}\n", encoding="utf-8")


def main():
    pages = load_sitemap(Path("/tmp/ma_pages_sitemap.xml"))
    posts = load_sitemap(Path("/tmp/ma_blog_posts_sitemap.xml"))
    cats = load_sitemap(Path("/tmp/ma_blog_categories_sitemap.xml"))

    urls = pages + posts + cats
    # Ensure unique, stable order
    seen = set()
    ordered = []
    for u in urls:
        if u in seen:
            continue
        seen.add(u)
        ordered.append(u)

    for idx, url in enumerate(ordered, 1):
        print(f"[{idx}/{len(ordered)}] {url}")
        try:
            process_url(url)
        except Exception as exc:
            print(f"Failed: {url} -> {exc}", file=sys.stderr)
        time.sleep(0.2)


if __name__ == "__main__":
    main()
