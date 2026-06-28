"""
Download all frontend assets (CSS, JS, fonts, images) from main.html
and save them locally, then rewrite HTML to use local paths.
"""
import os
import re
import urllib.request
import urllib.parse
from pathlib import Path

BASE_DIR = Path("C:/Users/No1/Desktop/cla")
HTML_FILE = BASE_DIR / "main.html"
FRONTEND_DIR = BASE_DIR / "frontend"
STATIC_DIR = FRONTEND_DIR / "static"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
    "Referer": "https://rtl.parsisads.ir/yadakstorage/",
}

downloaded = {}
failed = []

def make_local_path(url: str) -> tuple[Path, str]:
    """Convert a URL to a local file path and a relative web path."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.lstrip("/")
    local_path = STATIC_DIR / path
    web_path = "/static/" + path.replace("\\", "/")
    return local_path, web_path

def download_url(url: str) -> str | None:
    """Download a URL and save locally. Return local web path or None."""
    if url in downloaded:
        return downloaded[url]
    if not url.startswith("http"):
        return None

    local_path, web_path = make_local_path(url)
    if local_path.exists():
        downloaded[url] = web_path
        return web_path

    local_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
        local_path.write_bytes(content)
        print(f"  OK {url.split('/')[-1]}")
        downloaded[url] = web_path
        return web_path
    except Exception as e:
        print(f"  FAIL: {url.split('/')[-1]} -- {e}")
        failed.append(url)
        downloaded[url] = url  # keep original on failure
        return url

def process_css_for_sub_resources(css_text: str, css_url: str) -> str:
    """Download url() references inside a CSS file."""
    base = css_url.rsplit("/", 1)[0] + "/"

    def replace_url(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith("data:") or raw.startswith("http"):
            full = raw if raw.startswith("http") else raw
        else:
            full = urllib.parse.urljoin(base, raw)
        if full.startswith("http"):
            local = download_url(full)
            if local and local != full:
                return f"url('{local}')"
        return m.group(0)

    return re.sub(r"url\(([^)]+)\)", replace_url, css_text)

def download_css(url: str) -> str:
    """Download CSS and rewrite its internal url() references."""
    if url in downloaded:
        return downloaded[url]
    if not url.startswith("http"):
        return url

    local_path, web_path = make_local_path(url)
    if local_path.exists():
        downloaded[url] = web_path
        return web_path

    local_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            css_bytes = resp.read()
        css_text = css_bytes.decode("utf-8", errors="replace")
        css_text = process_css_for_sub_resources(css_text, url)
        local_path.write_text(css_text, encoding="utf-8")
        print(f"  OK (css) {url.split('/')[-1]}")
        downloaded[url] = web_path
        return web_path
    except Exception as e:
        print(f"  FAIL (css): {url.split('/')[-1]} -- {e}")
        failed.append(url)
        downloaded[url] = url
        return url

def rewrite_html(html: str) -> str:
    """Rewrite all external asset references to local paths."""

    # CSS <link> tags
    def rewrite_link(m):
        href = m.group(1)
        if "rtl.parsisads.ir" in href:
            local = download_css(href)
            return m.group(0).replace(href, local)
        return m.group(0)
    html = re.sub(r'<link[^>]+href=[\'"]([^\'"]+)[\'"][^>]*>', rewrite_link, html)

    # JS <script src=...>
    def rewrite_script(m):
        src = m.group(1)
        if "rtl.parsisads.ir" in src:
            local = download_url(src)
            return m.group(0).replace(src, local or src)
        return m.group(0)
    html = re.sub(r'<script[^>]+src=[\'"]([^\'"]+)[\'"]', rewrite_script, html)

    # img src
    def rewrite_img(m):
        src = m.group(1)
        if "rtl.parsisads.ir" in src:
            local = download_url(src)
            return m.group(0).replace(src, local or src)
        return m.group(0)
    html = re.sub(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', rewrite_img, html)

    # srcset
    def rewrite_srcset(m):
        srcset = m.group(1)
        parts = []
        for part in srcset.split(","):
            part = part.strip()
            if not part:
                continue
            pieces = part.split()
            url = pieces[0]
            descriptor = pieces[1] if len(pieces) > 1 else ""
            if "rtl.parsisads.ir" in url:
                local = download_url(url)
                url = local or url
            parts.append(f"{url} {descriptor}".strip())
        return f'srcset="{", ".join(parts)}"'
    html = re.sub(r'srcset=[\'"]([^\'"]+)[\'"]', rewrite_srcset, html)

    # background-image: url(...)
    def rewrite_bg(m):
        url = m.group(1).strip("'\"")
        if "rtl.parsisads.ir" in url:
            local = download_url(url)
            return f"background-image: url('{local or url}')"
        return m.group(0)
    html = re.sub(r"background-image:\s*url\(([^)]+)\)", rewrite_bg, html)

    # href for pages/links - rewrite to local Django API paths
    html = html.replace("https://rtl.parsisads.ir/yadakstorage/", "/")
    html = html.replace("https://rtl.parsisads.ir/yadakstorage", "")

    return html


def main():
    print("=== Downloading frontend assets ===\n")
    STATIC_DIR.mkdir(parents=True, exist_ok=True)

    html = HTML_FILE.read_text(encoding="utf-8")
    print("Rewriting HTML and downloading assets...")
    html_rewritten = rewrite_html(html)

    # Save rewritten HTML as the frontend index
    out_html = FRONTEND_DIR / "index.html"
    out_html.write_text(html_rewritten, encoding="utf-8")
    print(f"\nSaved: {out_html}")
    print(f"Downloaded: {len(downloaded)} assets")
    if failed:
        print(f"Failed: {len(failed)} assets")
        for f in failed:
            print(f"  - {f}")


if __name__ == "__main__":
    main()
