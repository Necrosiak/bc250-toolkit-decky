"""Release-based auto-updater for the BC250 Toolkit Decky plugin.

Checks the latest GitHub Release, compares it to the installed version
(package.json), and — if newer — downloads the release ZIP and unpacks it over
the plugin directory, then restarts plugin_loader to reload the code.

The plugin backend runs as root and the plugin dir is root-owned, so it can
write to itself and restart the loader without sudo. Network/disk work runs in
a thread executor so the asyncio loop never blocks.
"""

import asyncio
import json
import os
import shutil
import ssl
import subprocess
import tempfile
import urllib.request
import zipfile
from pathlib import Path


def _ssl_context():
    """Le Python embarqué de plugin_loader (PyInstaller) n'a pas de bundle CA →
    urllib échoue en CERTIFICATE_VERIFY_FAILED. On pointe le bundle CA système."""
    for ca in ("/etc/pki/tls/certs/ca-bundle.crt", "/etc/ssl/certs/ca-certificates.crt", "/etc/ssl/cert.pem"):
        if os.path.exists(ca):
            try:
                return ssl.create_default_context(cafile=ca)
            except Exception:
                pass
    try:
        return ssl.create_default_context()
    except Exception:
        return None

try:
    from decky import logger  # type: ignore
except Exception:  # pragma: no cover - fallback if decky logger unavailable
    class _L:
        def info(self, m): print("[updater]", m)
        warning = error = debug = info
    logger = _L()

# --- per-plugin configuration -------------------------------------------------
GITHUB_REPO = "Necrosiak/bc250-toolkit-decky"
# -----------------------------------------------------------------------------

PLUGIN_DIR = Path(os.path.dirname(__file__))
RELEASES_API = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
SETTINGS_DIR = Path(os.environ.get("DECKY_PLUGIN_SETTINGS_DIR", str(PLUGIN_DIR)))
SETTINGS_FILE = SETTINGS_DIR / "updater.json"
_USER_AGENT = f"{GITHUB_REPO.split('/')[-1]}-updater"


def _parse_version(v: str) -> tuple:
    out = []
    for chunk in str(v).strip().lstrip("vV").split("."):
        digits = "".join(c for c in chunk if c.isdigit())
        out.append(int(digits) if digits else 0)
    return tuple(out) or (0,)


def get_current_version() -> str:
    try:
        data = json.loads((PLUGIN_DIR / "package.json").read_text())
        return str(data.get("version", "0.0.0"))
    except Exception as e:
        logger.warning(f"[updater] cannot read current version: {e}")
        return "0.0.0"


def is_autoupdate_enabled() -> bool:
    try:
        return bool(json.loads(SETTINGS_FILE.read_text()).get("autoupdate", True))
    except Exception:
        return True  # default ON


def set_autoupdate_enabled(enabled: bool) -> bool:
    try:
        SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
        SETTINGS_FILE.write_text(json.dumps({"autoupdate": bool(enabled)}))
    except Exception as e:
        logger.warning(f"[updater] cannot persist autoupdate flag: {e}")
    return bool(enabled)


def _fetch_latest_blocking() -> dict:
    req = urllib.request.Request(
        RELEASES_API,
        headers={"User-Agent": _USER_AGENT, "Accept": "application/vnd.github+json"},
    )
    with urllib.request.urlopen(req, timeout=15, context=_ssl_context()) as resp:
        rel = json.loads(resp.read().decode("utf-8"))

    tag = rel.get("tag_name") or rel.get("name") or ""
    download_url = ""
    for asset in rel.get("assets", []):
        name = (asset.get("name") or "").lower()
        if name.endswith(".zip"):
            download_url = asset.get("browser_download_url", "")
            break
    if not download_url:
        download_url = rel.get("zipball_url", "")
    return {"tag": tag, "url": download_url, "notes": rel.get("body", "") or ""}


async def check() -> dict:
    current = get_current_version()
    try:
        loop = asyncio.get_event_loop()
        latest = await loop.run_in_executor(None, _fetch_latest_blocking)
    except Exception as e:
        logger.warning(f"[updater] check failed: {e}")
        return {"current": current, "latest": None, "update_available": False,
                "url": "", "notes": "", "error": str(e)}

    available = (
        bool(latest["tag"])
        and bool(latest["url"])
        and _parse_version(latest["tag"]) > _parse_version(current)
    )
    return {
        "current": current,
        "latest": latest["tag"],
        "update_available": available,
        "url": latest["url"],
        "notes": latest["notes"],
    }


def _content_root(extracted: Path) -> Path:
    entries = [p for p in extracted.iterdir() if not p.name.startswith("__MACOSX")]
    if len(entries) == 1 and entries[0].is_dir():
        return entries[0]
    return extracted


def _apply_blocking(url: str) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        zip_path = tmp / "update.zip"
        req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
        with urllib.request.urlopen(req, timeout=120, context=_ssl_context()) as resp, open(zip_path, "wb") as f:
            shutil.copyfileobj(resp, f)

        extract_dir = tmp / "x"
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(extract_dir)

        root = _content_root(extract_dir)
        for src in root.rglob("*"):
            rel = src.relative_to(root)
            dst = PLUGIN_DIR / rel
            if src.is_dir():
                dst.mkdir(parents=True, exist_ok=True)
            else:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)


async def apply(url: str) -> bool:
    if not url:
        return False
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _apply_blocking, url)
        logger.info("[updater] update unpacked; restarting plugin_loader")
        return True
    except Exception as e:
        logger.error(f"[updater] apply failed: {e}")
        return False


def restart_loader() -> None:
    try:
        subprocess.Popen(["systemctl", "restart", "plugin_loader"])
    except Exception as e:
        logger.error(f"[updater] restart failed: {e}")
