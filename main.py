import asyncio
import json
import os
import re
import subprocess
import time
import urllib.request
import urllib.error
from pathlib import Path
import vdf as _vdf

# Decky enregistre son PROPRE module `updater` dans sys.modules → un simple
# `import updater` renvoie celui de Decky (sans is_autoupdate_enabled) au lieu du
# nôtre, cassant silencieusement l'auto-update après une MAJ Decky. On charge notre
# fichier explicitement par chemin, sous un nom unique, pour éviter la collision.
import importlib.util as _ilu
_uspec = _ilu.spec_from_file_location(
    "bc250_updater", os.path.join(os.path.dirname(os.path.abspath(__file__)), "updater.py")
)
updater = _ilu.module_from_spec(_uspec)
_uspec.loader.exec_module(updater)

GAMES_DB_URL = "https://raw.githubusercontent.com/Necrosiak/bc250-toolkit-decky/main/games_db.json"
LOCAL_DB_PATH = Path(os.path.dirname(__file__)) / "games_db.json"
CACHE_DB_PATH = Path("/tmp/bc250_games_db_cache.json")
TWEAKS_APPLY = "/opt/bc250-tweaks/apply.sh"
TWEAKS_UPDATE = "/opt/bc250-tweaks/update.sh"

# ── User home resolution ───────────────────────────────────────────────────────
# Le plugin tourne en root (HOME=/root). SUDO_HOME contient le vrai home user.

def _get_user_home() -> Path:
    sudo_home = os.environ.get("SUDO_HOME")
    if sudo_home and Path(sudo_home).is_dir():
        return Path(sudo_home)
    try:
        import decky  # injecté par DeckyLoader au runtime
        h = getattr(decky, "DECKY_USER_HOME", None)
        if h:
            return Path(h)
    except ImportError:
        pass
    try:
        root_home = os.environ.get("HOME", "/root")
        loader_json = Path(root_home) / "homebrew/settings/loader.json"
        data = json.loads(loader_json.read_text())
        h = data.get("user_info.user_home")
        if h:
            return Path(h)
    except Exception:
        pass
    import pwd
    for entry in pwd.getpwall():
        if 1000 <= entry.pw_uid < 65000:
            return Path(entry.pw_dir)
    return Path.home()


_USER_HOME = _get_user_home()

BC250_DATA_DIR  = _USER_HOME / ".local/share/bc250-toolkit"
PENDING_LO_FILE = BC250_DATA_DIR / "pending_launch_options.json"
PRE_STEAM_SCRIPT = BC250_DATA_DIR / "bc250-apply-vdf.py"
STEAM_DROPIN_DIR = _USER_HOME / ".config/systemd/user/app-steam@autostart.service.d"
STEAM_DROPIN     = STEAM_DROPIN_DIR / "bc250-vdf-apply.conf"

# ── Per-game radv/drirc options ───────────────────────────────────────────────
# Certaines configs ont besoin d'options mesa radv par-jeu (ex: désactiver le
# unified heap pour les jeux DX12/VKD3D, cf Code Vein 2). On possède entièrement
# ~/.drirc : on le régénère depuis un état JSON. Match sur le pApplicationName
# que DXVK/vkd3d passent à radv (= nom de l'exe, ex "Jeu-Win64-Shipping.exe").
DRIRC_PATH      = _USER_HOME / ".drirc"
RADV_STATE_FILE = BC250_DATA_DIR / "radv_configs.json"

# ── Réglages du plugin (auto-apply + variante choisie par jeu) ─────────────────
# { "auto_apply": bool, "variants": { "<appid>": <index|null> } }
TOOLKIT_SETTINGS_FILE = BC250_DATA_DIR / "toolkit_settings.json"

# ── CU management ─────────────────────────────────────────────────────────────
# Hardware : 5 WGPs × 2 CU × 4 rangées (SE0.SH0, SE0.SH1, SE1.SH0, SE1.SH1) = 40 CU max
# Stock BC-250 : WGP0-2 actifs (mask 0x07) = 6 CU/rangée × 4 = 24 CU

CU_PROFILES: dict = {
    "stock": {"label": "24 CU (stock)",  "cu": 24, "masks": [0x07, 0x07, 0x07, 0x07]},
    "32cu":  {"label": "32 CU",          "cu": 32, "masks": [0x0f, 0x0f, 0x0f, 0x0f]},
    "36cu":  {"label": "36 CU",          "cu": 36, "masks": [0x1f, 0x1f, 0x0f, 0x0f]},
    "40cu":  {"label": "40 CU (full)",   "cu": 40, "masks": [0x1f, 0x1f, 0x1f, 0x1f]},
}
CU_ASIC          = "cyan_skillfish.gfx1013"
CU_ASIC_INSTANCE = "cyan_skillfish@1"   # instance 1 sur kernel 6.17+ (debugfs /dri/1/)
CU_REG_CC  = "mmCC_GC_SHADER_ARRAY_CONFIG"
CU_REG_SPI = "mmSPI_PG_ENABLE_STATIC_WGP_MASK"
CU_REG_RLC = "mmRLC_PG_ALWAYS_ON_WGP_MASK"
CU_SE_SH   = [(0, 0), (0, 1), (1, 0), (1, 1)]

CU_RESTORE_SCRIPT = Path("/usr/local/bin/bc250-cu-restore")
CU_SERVICE_NAME   = "bc250-cu-profile"
CU_SERVICE_PATH   = Path(f"/etc/systemd/system/{CU_SERVICE_NAME}.service")
CU_MANAGER        = Path("/usr/local/bin/bc250-cu-live-manager")
CU_LIVE_CACHE     = Path("/tmp/bc250-cu-live.json")  # état courant, effacé au reboot
_cu_reading       = False   # verrou simple pour éviter des lectures umr simultanées
_cu_last_attempt  = 0.0     # timestamp du dernier lancement bg read (rate-limit 30s)


def _find_umr() -> str | None:
    for p in ("/usr/bin/umr", "/usr/local/bin/umr"):
        if os.path.isfile(p):
            return p
    return None


def _umr_cmd_prefix(umr: str) -> list:
    # Le plugin tourne en tant que bazzite (non-root) — umr a besoin de root pour debugfs
    if os.geteuid() != 0:
        return ["sudo", umr]
    return [umr]


def _umr_write(umr: str, reg: str, value: int,
               se: int | None = None, sh: int | None = None) -> bool:
    # -g sélectionne l'instance GPU (instance 1 sur kernel 6.17+)
    # -b DOIT précéder -w : umr traite les flags séquentiellement
    cmd = _umr_cmd_prefix(umr) + ["-g", CU_ASIC_INSTANCE]
    if se is not None and sh is not None:
        cmd += ["-b", str(se), str(sh), "0xffffffff"]
    cmd += ["-w", f"{CU_ASIC}.{reg}", hex(value)]
    try:
        subprocess.run(cmd, capture_output=True, timeout=15)
        return True
    except Exception:
        return False


def _umr_read(umr: str, reg: str,
              se: int | None = None, sh: int | None = None) -> int | None:
    # -g sélectionne l'instance GPU (instance 1 sur kernel 6.17+)
    # -b DOIT précéder -r
    cmd = _umr_cmd_prefix(umr) + ["-g", CU_ASIC_INSTANCE]
    if se is not None and sh is not None:
        cmd += ["-b", str(se), str(sh), "0xffffffff"]
    cmd += ["-r", f"{CU_ASIC}.{reg}"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode != 0 or not result.stdout.strip():
            print(f"[BC250 CU] umr rc={result.returncode} stderr={result.stderr[:200]!r} stdout={result.stdout[:100]!r}")
        m = re.search(r'0x[0-9a-fA-F]+', result.stdout)
        if m:
            return int(m.group(), 16)
        # Certaines versions umr écrivent sur stderr
        m = re.search(r'0x[0-9a-fA-F]+', result.stderr)
        return int(m.group(), 16) if m else None
    except Exception as e:
        print(f"[BC250 CU] umr exception: {e}")
        return None


def _masks_cu_count(masks: list) -> int:
    return sum(bin(m & 0x1f).count("1") * 2 for m in masks)


def _read_all_cu_masks_seq(umr: str) -> list:
    """Lecture séquentielle des 4 masques SPI (utilisé dans un thread executor)."""
    results = []
    for se, sh in CU_SE_SH:
        v = _umr_read(umr, CU_REG_SPI, se, sh)
        print(f"[BC250 CU] SE{se} SH{sh} => {v}")
        results.append(v)
    return results


async def _bg_cu_read(umr: str):
    """Tâche asyncio de fond : lit les registres CU et écrit le cache."""
    global _cu_reading
    try:
        print("[BC250 CU] lecture umr en fond...")
        loop = asyncio.get_running_loop()
        masks_raw = await loop.run_in_executor(None, _read_all_cu_masks_seq, umr)
        print(f"[BC250 CU] masks_raw={masks_raw}")

        # Si tous les reads ont échoué (None ou 0), ne pas écrire un faux cache à 0
        if not any(v is not None and v != 0 for v in masks_raw):
            print("[BC250 CU] bg_cu_read: tous les reads ont échoué — cache non écrit")
            return

        masks = [v or 0 for v in masks_raw]
        cu_count = _masks_cu_count(masks)
        current_profile = _identify_profile(masks)
        print(f"[BC250 CU] cache mis à jour: cu_count={cu_count}, profile={current_profile}")
        CU_LIVE_CACHE.write_text(json.dumps({"cu_count": cu_count, "current_profile": current_profile}))
    except Exception as e:
        print(f"[BC250 CU] erreur bg_cu_read: {e}")
    finally:
        _cu_reading = False


def _identify_profile(masks: list) -> str | None:
    clean = [m & 0x1f for m in masks]
    for name, p in CU_PROFILES.items():
        if clean == p["masks"]:
            return name
    return None


# ── Script d'application des launch options VDF (ExecStartPre Steam) ──────────

_APPLY_VDF_SCRIPT = r'''#!/usr/bin/env python3
"""Applique les launch options en attente dans localconfig.vdf.
Lancé via ExecStartPre avant que Steam démarre."""
import json
import sys
from pathlib import Path

try:
    import vdf as _vdf
except ImportError:
    sys.exit(0)

PENDING_FILE = Path.home() / ".local/share/bc250-toolkit/pending_launch_options.json"

def find_userid():
    try:
        data = _vdf.load(open(Path.home() / ".steam/steam/config/loginusers.vdf"))
        for uid, info in data.get("users", {}).items():
            if info.get("MostRecent") == "1":
                return str(int(uid) & 0xFFFFFFFF)
        for uid in data.get("users", {}):
            return str(int(uid) & 0xFFFFFFFF)
    except Exception:
        pass
    try:
        dirs = [d for d in (Path.home() / ".steam/steam/userdata").iterdir()
                if d.is_dir() and d.name.isdigit() and d.name != "0"]
        if dirs:
            return dirs[0].name
    except Exception:
        pass
    return None

def main():
    if not PENDING_FILE.exists():
        return
    try:
        pending = json.loads(PENDING_FILE.read_text())
    except Exception:
        PENDING_FILE.unlink(missing_ok=True)
        return
    if not pending:
        PENDING_FILE.unlink(missing_ok=True)
        return
    userid = find_userid()
    if not userid:
        return
    lc = Path.home() / ".steam/steam/userdata" / userid / "config/localconfig.vdf"
    if not lc.exists():
        return
    try:
        data = _vdf.load(open(lc))
        apps = (
            data
            .setdefault("UserLocalConfigStore", {})
            .setdefault("Software", {})
            .setdefault("Valve", {})
            .setdefault("Steam", {})
            .setdefault("apps", {})
        )
        for app_id, opts in list(pending.items()):
            if app_id not in apps or not isinstance(apps[app_id], dict):
                apps[app_id] = {}
            apps[app_id]["LaunchOptions"] = opts
            del pending[app_id]
        with open(lc, "w") as f:
            _vdf.dump(data, f)
        if pending:
            PENDING_FILE.write_text(json.dumps(pending))
        else:
            PENDING_FILE.unlink(missing_ok=True)
    except Exception:
        pass

if __name__ == "__main__":
    main()
'''


class Plugin:
    async def _main(self):
        self._games_db: dict = {}
        # Purge le cache CU si cu_count=0 (lecture umr ratée lors d'une session précédente)
        if CU_LIVE_CACHE.exists():
            try:
                cached = json.loads(CU_LIVE_CACHE.read_text())
                if not cached.get("cu_count"):
                    CU_LIVE_CACHE.unlink()
                    print("[BC250 CU] cache invalide (cu_count=0) purgé au démarrage")
            except Exception:
                CU_LIVE_CACHE.unlink(missing_ok=True)
        self._install_pre_steam_hook()
        await self._load_db()
        asyncio.create_task(self._autoupdate_check())

    async def _autoupdate_check(self):
        # Silent release check at boot: if enabled and a newer release exists,
        # download + unpack over the plugin dir and restart plugin_loader.
        try:
            if not updater.is_autoupdate_enabled():
                return
            info = await updater.check()
            if not info.get("update_available"):
                return
            print(f"[BC250 updater] {info['latest']} available (have {info['current']}); auto-applying")
            if await updater.apply(info["url"]):
                updater.restart_loader()
        except Exception as e:
            print(f"[BC250 updater] auto-check error: {e}")

    async def check_update(self):
        return await updater.check()

    async def get_version(self):
        return updater.get_current_version()

    async def apply_update(self, url):
        ok = await updater.apply(url)
        if ok:
            updater.restart_loader()
        return ok

    async def get_autoupdate(self):
        return updater.is_autoupdate_enabled()

    async def set_autoupdate(self, enabled):
        return updater.set_autoupdate_enabled(enabled)

    # ── Réglages plugin : auto-apply + variante par jeu ────────────────────────

    def _read_settings(self) -> dict:
        try:
            if TOOLKIT_SETTINGS_FILE.exists():
                return json.loads(TOOLKIT_SETTINGS_FILE.read_text())
        except Exception:
            pass
        return {}

    def _write_settings(self, data: dict) -> None:
        BC250_DATA_DIR.mkdir(parents=True, exist_ok=True)
        TOOLKIT_SETTINGS_FILE.write_text(json.dumps(data, indent=2))

    async def get_auto_apply(self) -> bool:
        return bool(self._read_settings().get("auto_apply", False))

    async def set_auto_apply(self, enabled: bool) -> bool:
        s = self._read_settings()
        s["auto_apply"] = bool(enabled)
        self._write_settings(s)
        return bool(enabled)

    async def get_game_variants(self) -> dict:
        """Map { "<appid>": variant_index } des variantes choisies par l'utilisateur."""
        return self._read_settings().get("variants", {})

    async def set_game_variant(self, app_id: int, variant_index: int | None) -> dict:
        s = self._read_settings()
        variants = s.get("variants", {})
        if variant_index is None:
            variants.pop(str(app_id), None)
        else:
            variants[str(app_id)] = variant_index
        s["variants"] = variants
        self._write_settings(s)
        return {"ok": True}

    def _install_pre_steam_hook(self):
        """Installe ExecStartPre dans le service Steam pour appliquer les VDF pending."""
        try:
            BC250_DATA_DIR.mkdir(parents=True, exist_ok=True)
            PRE_STEAM_SCRIPT.write_text(_APPLY_VDF_SCRIPT)
            PRE_STEAM_SCRIPT.chmod(0o755)
            STEAM_DROPIN_DIR.mkdir(parents=True, exist_ok=True)
            STEAM_DROPIN.write_text(f"[Service]\nExecStartPre=-{PRE_STEAM_SCRIPT}\n")
            # daemon-reload dans le contexte user (plugin tourne en root)
            user_uid = BC250_DATA_DIR.stat().st_uid if BC250_DATA_DIR.exists() else None
            if user_uid:
                subprocess.run(
                    ["systemctl", "--user", "daemon-reload"],
                    capture_output=True, timeout=5,
                    env={**os.environ, "HOME": str(_USER_HOME),
                         "XDG_RUNTIME_DIR": f"/run/user/{user_uid}"},
                )
        except Exception:
            pass

    async def _unload(self):
        pass

    # ── Games database ────────────────────────────────────────────────────────

    async def _load_db(self):
        try:
            req = urllib.request.Request(
                GAMES_DB_URL,
                headers={"User-Agent": "BC250-Toolkit-Decky/0.1"},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                self._games_db = data
                CACHE_DB_PATH.write_text(json.dumps(data))
                return
        except Exception:
            pass

        if CACHE_DB_PATH.exists():
            try:
                self._games_db = json.loads(CACHE_DB_PATH.read_text())
                return
            except Exception:
                pass

        if LOCAL_DB_PATH.exists():
            try:
                self._games_db = json.loads(LOCAL_DB_PATH.read_text())
            except Exception:
                self._games_db = {}

    async def get_games_db(self) -> dict:
        return self._games_db

    async def refresh_games_db(self) -> dict:
        await self._load_db()
        return self._games_db

    async def get_game_settings(self, app_id: str) -> dict | None:
        return self._games_db.get(str(app_id))

    # ── System status ─────────────────────────────────────────────────────────

    async def get_system_status(self) -> dict:
        status: dict = {}

        try:
            for hwmon in Path("/sys/class/hwmon").iterdir():
                name_f = hwmon / "name"
                if not name_f.exists():
                    continue
                name = name_f.read_text().strip()
                if name == "k10temp":
                    tctl = hwmon / "temp1_input"
                    if tctl.exists():
                        status["cpu_temp"] = round(int(tctl.read_text()) / 1000, 1)
                elif name in ("amdgpu", "gpu_thermal"):
                    edge = hwmon / "temp1_input"
                    if edge.exists():
                        status["gpu_temp"] = round(int(edge.read_text()) / 1000, 1)
        except Exception:
            pass

        try:
            scx_state = Path("/sys/kernel/sched_ext/state").read_text().strip()
            status["scx_state"] = scx_state
            if scx_state == "enabled":
                status["scx_sched"] = Path("/sys/kernel/sched_ext/root/ops").read_text().strip()
        except Exception:
            status["scx_state"] = "unknown"

        try:
            status["tuned_profile"] = Path("/etc/tuned/active_profile").read_text().strip()
        except Exception:
            status["tuned_profile"] = "unknown"

        try:
            r = subprocess.run(
                ["systemctl", "--user", "is-active", "gamemoded"],
                capture_output=True, text=True, timeout=2,
                env={**os.environ, "HOME": str(_USER_HOME),
                     "XDG_RUNTIME_DIR": f"/run/user/{_user_uid()}"},
            )
            status["gamemode_active"] = r.stdout.strip() == "active"
        except Exception:
            status["gamemode_active"] = False

        status["tweaks_installed"] = os.path.isfile(TWEAKS_APPLY)

        try:
            log = Path("/var/log/bc250-tweaks.log")
            if log.exists():
                for line in reversed(log.read_text().splitlines()):
                    if "══" in line and "update.sh" in line:
                        status["tweaks_last_update"] = line.strip().lstrip("═ ").replace(" — update.sh", "")
                        break
        except Exception:
            pass

        return status

    # ── Tweaks update ─────────────────────────────────────────────────────────

    async def run_tweaks_update(self) -> dict:
        if not os.path.isfile(TWEAKS_UPDATE):
            return {"success": False, "error": "bc250-tweaks non installé dans /opt/bc250-tweaks"}
        try:
            result = subprocess.run(
                ["sudo", TWEAKS_UPDATE],
                capture_output=True, text=True, timeout=120,
            )
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout[-2000:],
                "stderr": result.stderr[-500:],
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Timeout (120s)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Steam settings via VDF ────────────────────────────────────────────────

    def _find_steam_userid(self) -> str | None:
        try:
            loginusers = _USER_HOME / ".steam" / "steam" / "config" / "loginusers.vdf"
            data = _vdf.load(open(loginusers))
            users = data.get("users", {})
            for uid, info in users.items():
                if info.get("MostRecent") == "1":
                    return str(int(uid) & 0xFFFFFFFF)
            for uid in users:
                return str(int(uid) & 0xFFFFFFFF)
        except Exception:
            pass
        try:
            userdata = _USER_HOME / ".steam" / "steam" / "userdata"
            dirs = [d for d in userdata.iterdir() if d.is_dir() and d.name.isdigit() and d.name != "0"]
            if dirs:
                return dirs[0].name
        except Exception:
            pass
        return None

    async def apply_compat_tool(self, app_id: int, tool_name: str) -> dict:
        """Écrit le compat tool dans config.vdf (CompatToolMapping). Persistant — Steam ne l'écrase pas."""
        config_path = _USER_HOME / ".steam" / "steam" / "config" / "config.vdf"
        try:
            with open(config_path) as f:
                data = _vdf.load(f)
            mapping = (
                data
                .setdefault("InstallConfigStore", {})
                .setdefault("Software", {})
                .setdefault("Valve", {})
                .setdefault("Steam", {})
                .setdefault("CompatToolMapping", {})
            )
            mapping[str(app_id)] = {
                "name": tool_name,
                "config": "",
                "priority": "250",
            }
            with open(config_path, "w") as f:
                _vdf.dump(data, f)
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    async def apply_launch_options(self, app_id: int, launch_options: str) -> dict:
        """Écrit les launch options dans localconfig.vdf + pending file (ExecStartPre au boot Steam)."""
        # Pending file — garantit la persistance même si Steam écrase le VDF à sa sortie
        try:
            BC250_DATA_DIR.mkdir(parents=True, exist_ok=True)
            pending: dict = {}
            if PENDING_LO_FILE.exists():
                try:
                    pending = json.loads(PENDING_LO_FILE.read_text())
                except Exception:
                    pass
            pending[str(app_id)] = launch_options
            PENDING_LO_FILE.write_text(json.dumps(pending))
        except Exception:
            pass

        # Écriture directe dans le VDF (pour la session en cours)
        userid = self._find_steam_userid()
        if not userid:
            return {"ok": True, "detail": "pending only — Steam user introuvable"}
        lc_path = _USER_HOME / ".steam" / "steam" / "userdata" / userid / "config" / "localconfig.vdf"
        try:
            with open(lc_path) as f:
                data = _vdf.load(f)
            apps = (
                data
                .setdefault("UserLocalConfigStore", {})
                .setdefault("Software", {})
                .setdefault("Valve", {})
                .setdefault("Steam", {})
                .setdefault("apps", {})
            )
            appid_str = str(app_id)
            if appid_str not in apps or not isinstance(apps[appid_str], dict):
                apps[appid_str] = {}
            apps[appid_str]["LaunchOptions"] = launch_options
            with open(lc_path, "w") as f:
                _vdf.dump(data, f)
            return {"ok": True}
        except Exception as e:
            return {"ok": True, "detail": f"pending only: {e}"}

    # ── Per-game radv/drirc options ───────────────────────────────────────────

    @staticmethod
    def _drirc_value(v) -> str:
        if isinstance(v, bool):
            return "true" if v else "false"
        return str(v)

    def _regenerate_drirc(self) -> None:
        """Régénère entièrement ~/.drirc depuis RADV_STATE_FILE (fichier qu'on possède).
        Un bloc <application> par jeu configuré, match sur pApplicationName. Les jeux
        non listés gardent le Default de /etc/drirc (ex: unified heap on)."""
        state: dict = {}
        if RADV_STATE_FILE.exists():
            try:
                state = json.loads(RADV_STATE_FILE.read_text())
            except Exception:
                state = {}
        lines = ['<driconf>', '  <device>',
                 '    <!-- Généré par BC250-Toolkit — NE PAS éditer à la main. '
                 'Overrides radv par-jeu (match sur pApplicationName). -->']
        for app_id, cfg in sorted(state.items()):
            match = cfg.get("match")
            opts = cfg.get("options", {})
            if not match or not opts:
                continue
            name = self._xml_escape(match)
            lines.append(f'    <application name="{name}">')
            for k, v in opts.items():
                lines.append(
                    f'      <option name="{self._xml_escape(str(k))}" '
                    f'value="{self._xml_escape(self._drirc_value(v))}" />'
                )
            lines.append('    </application>')
        lines += ['  </device>', '</driconf>', '']
        DRIRC_PATH.write_text("\n".join(lines))
        try:
            os.chown(DRIRC_PATH, _user_uid(), _user_uid())
        except Exception:
            pass

    @staticmethod
    def _xml_escape(s: str) -> str:
        return (s.replace("&", "&amp;").replace("<", "&lt;")
                 .replace(">", "&gt;").replace('"', "&quot;"))

    async def apply_radv_config(self, app_id: int, match: str, options: dict) -> dict:
        """Enregistre les options radv per-jeu et régénère ~/.drirc."""
        try:
            BC250_DATA_DIR.mkdir(parents=True, exist_ok=True)
            state: dict = {}
            if RADV_STATE_FILE.exists():
                try:
                    state = json.loads(RADV_STATE_FILE.read_text())
                except Exception:
                    state = {}
            if not match or not options:
                state.pop(str(app_id), None)
            else:
                state[str(app_id)] = {"match": match, "options": options}
            RADV_STATE_FILE.write_text(json.dumps(state, indent=2))
            self._regenerate_drirc()
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    async def clear_radv_config(self, app_id: int) -> dict:
        return await self.apply_radv_config(app_id, "", {})

    # ── Orchestrateur : appliquer une config (variante) complète ───────────────

    async def apply_game_config(self, app_id: int, variant_index: int | None = None) -> dict:
        """Applique une config complète d'un jeu : compat_tool + launch_options + radv.
        variant_index=None → config stable (top-level). Sinon → configs[variant_index]."""
        entry = self._games_db.get(str(app_id))
        if not entry:
            return {"ok": False, "error": f"Jeu {app_id} absent de la DB"}
        cfg = entry
        if variant_index is not None:
            variants = entry.get("configs") or []
            if 0 <= variant_index < len(variants):
                cfg = variants[variant_index]
            else:
                return {"ok": False, "error": f"variante {variant_index} invalide"}
        result: dict = {"ok": True, "applied": {}, "requires": cfg.get("requires")}

        compat = cfg.get("compat_tool")
        if compat:
            r = await self.apply_compat_tool(app_id, compat)
            result["applied"]["compat_tool"] = compat
            if not r.get("ok"):
                result["ok"] = False
                result["compat_error"] = r.get("error")

        launch = cfg.get("launch_options")
        if launch:
            r = await self.apply_launch_options(app_id, launch)
            result["applied"]["launch_options"] = launch
            if not r.get("ok"):
                result["ok"] = False
                result["launch_error"] = r.get("detail")

        radv = cfg.get("radv")
        if radv and radv.get("match") and radv.get("options"):
            r = await self.apply_radv_config(app_id, radv["match"], radv["options"])
            result["applied"]["radv"] = radv
            if not r.get("ok"):
                result["ok"] = False
                result["radv_error"] = r.get("error")
        else:
            # variante sans radv → s'assurer qu'aucun override résiduel ne traîne
            await self.clear_radv_config(app_id)

        # compat (config.vdf) + launch (pending) ne sont relus qu'au (re)démarrage de Steam
        result["need_steam_restart"] = bool(compat or launch)
        return result

    # ── CU management ─────────────────────────────────────────────────────────

    async def get_cu_status(self) -> dict:
        """Retourne le statut CU actuel."""
        umr = _find_umr()
        result: dict = {
            "umr_available": umr is not None,
            "current_profile": None,
            "cu_count": None,
            "boot_profile": None,
            "boot_cu": None,
            "profiles": {name: {"label": p["label"], "cu": p["cu"]} for name, p in CU_PROFILES.items()},
        }

        # Chemin rapide : cache écrit par apply_cu_profile
        if CU_LIVE_CACHE.exists():
            try:
                cached = json.loads(CU_LIVE_CACHE.read_text())
                result["cu_count"] = cached.get("cu_count")
                result["current_profile"] = cached.get("current_profile")
            except Exception:
                pass

        # Chemin lent : lecture umr en tâche de fond (non-bloquant, cache mis à jour)
        # Déclenche si : pas de valeur OU valeur = 0 (cache corrompu d'une lecture ratée)
        global _cu_reading, _cu_last_attempt
        need_read = (result["cu_count"] is None or result["cu_count"] == 0)
        throttled = (time.time() - _cu_last_attempt) < 30  # retry max toutes les 30s
        if need_read and umr and not _cu_reading and not throttled:
            _cu_reading = True
            _cu_last_attempt = time.time()
            asyncio.create_task(_bg_cu_read(umr))

        # Profil de boot depuis le conf
        for conf_path in (CU_SERVICE_PATH.parent / "bc250-cu-live-manager.conf",
                          Path("/etc/bc250-cu-live-manager.conf")):
            if conf_path.exists():
                try:
                    for line in conf_path.read_text().splitlines():
                        if line.startswith("BC250_WGP_MASKS="):
                            csv = line.split("=", 1)[1]
                            boot_masks = [int(x, 16) & 0x1f for x in csv.split(",")]
                            result["boot_cu"] = _masks_cu_count(boot_masks)
                            result["boot_profile"] = _identify_profile(boot_masks)
                            break
                    break
                except Exception:
                    pass

        return result

    async def apply_cu_profile(self, profile: str, save_boot: bool = False) -> dict:
        """Applique un profil CU via umr (live) et optionnellement l'installe au boot."""
        if profile not in CU_PROFILES:
            return {"ok": False, "error": f"Profil inconnu: {profile}"}

        umr = _find_umr()
        if not umr:
            return {"ok": False, "error": "umr non trouvé — installer: rpm-ostree install umr"}

        masks = CU_PROFILES[profile]["masks"]
        union = 0
        for m in masks:
            union |= m

        # Clear CC harvest mask (global)
        _umr_write(umr, CU_REG_CC, 0x0)

        # Écriture des masques SPI par rangée
        for idx, (se, sh) in enumerate(CU_SE_SH):
            _umr_write(umr, CU_REG_CC, 0x0, se, sh)
            _umr_write(umr, CU_REG_SPI, masks[idx], se, sh)
            union |= masks[idx]

        # RLC always-on mask
        _umr_write(umr, CU_REG_RLC, union)

        boot_ok = True
        boot_err = None
        if save_boot:
            boot_ok, boot_err = self._write_cu_boot_service(profile, masks, umr)

        cu = CU_PROFILES[profile]["cu"]
        try:
            CU_LIVE_CACHE.write_text(json.dumps({"cu_count": cu, "current_profile": profile}))
        except Exception:
            pass

        result = {"ok": True, "profile": profile, "cu_count": cu}
        if save_boot:
            result["boot_saved"] = boot_ok
            if not boot_ok:
                result["boot_error"] = boot_err
        return result

    def _write_cu_boot_service(self, profile: str, masks: list, umr: str) -> tuple[bool, str]:
        """Crée un script de restauration CU + service systemd activé au boot via sudo."""
        union = 0
        for m in masks:
            union |= m

        script_lines = [
            "#!/usr/bin/bash",
            f"# BC-250 CU profile: {CU_PROFILES[profile]['label']} — BC250-Toolkit-Decky",
            f"UMR={umr}",
            f"ASIC={CU_ASIC}",
            f"INST={CU_ASIC_INSTANCE}",
            "",
            f'"$UMR" -g "$INST" -w "$ASIC".{CU_REG_CC} 0x0 || true',
        ]
        for idx, (se, sh) in enumerate(CU_SE_SH):
            script_lines.append(f'"$UMR" -g "$INST" -b {se} {sh} 0xffffffff -w "$ASIC".{CU_REG_CC} 0x0')
            script_lines.append(f'"$UMR" -g "$INST" -b {se} {sh} 0xffffffff -w "$ASIC".{CU_REG_SPI} {hex(masks[idx])}')
        script_lines.append(f'"$UMR" -g "$INST" -w "$ASIC".{CU_REG_RLC} {hex(union)} || true')
        script_content = "\n".join(script_lines) + "\n"

        # Écriture du script restore via sudo tee (plugin tourne en bazzite, pas root)
        r = subprocess.run(
            ["sudo", "tee", str(CU_RESTORE_SCRIPT)],
            input=script_content, text=True, capture_output=True, timeout=10,
        )
        if r.returncode != 0:
            return False, f"tee restore script: {r.stderr.strip()}"
        subprocess.run(["sudo", "chmod", "755", str(CU_RESTORE_SCRIPT)], capture_output=True, timeout=5)

        wait_line = "for _ in {1..30}; do compgen -G '/dev/dri/renderD*' >/dev/null && exit 0; sleep 1; done; exit 1"
        service_lines = [
            "[Unit]",
            f"Description=BC-250 CU {CU_PROFILES[profile]['label']} restore at boot",
            "After=systemd-udev-settle.service",
            "Wants=systemd-udev-settle.service",
            "",
            "[Service]",
            "Type=oneshot",
            f"ExecStartPre=/usr/bin/bash -c '{wait_line}'",
            f"ExecStart={CU_RESTORE_SCRIPT}",
            "RemainAfterExit=yes",
            "",
            "[Install]",
            "WantedBy=multi-user.target",
        ]
        service_content = "\n".join(service_lines) + "\n"

        # Écriture du service systemd via sudo tee
        r = subprocess.run(
            ["sudo", "tee", str(CU_SERVICE_PATH)],
            input=service_content, text=True, capture_output=True, timeout=10,
        )
        if r.returncode != 0:
            return False, f"tee service file: {r.stderr.strip()}"

        subprocess.run(["sudo", "systemctl", "daemon-reload"], capture_output=True, timeout=10)
        r = subprocess.run(
            ["sudo", "systemctl", "enable", f"{CU_SERVICE_NAME}.service"],
            capture_output=True, timeout=10,
        )
        if r.returncode != 0:
            return False, f"systemctl enable: {r.stderr.strip()}"

        return True, "ok"

    # ── umr auto-install ──────────────────────────────────────────────────────

    async def install_umr(self) -> dict:
        """Lance rpm-ostree install --apply-live umr. Bloquant ~30s."""
        if _find_umr():
            return {"ok": True, "already": True}
        try:
            r = subprocess.run(
                ["rpm-ostree", "install", "--apply-live", "--assumeyes", "umr"],
                capture_output=True, text=True, timeout=180,
            )
            if r.returncode == 0:
                return {"ok": True, "already": False}
            return {"ok": False, "error": (r.stderr or r.stdout)[-500:]}
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "Timeout (180s)"}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # ── DB info ───────────────────────────────────────────────────────────────

    async def get_db_meta(self) -> dict:
        return self._games_db.get("_meta", {})

    async def get_db_game_count(self) -> int:
        return sum(1 for k in self._games_db if not k.startswith("_"))


def _user_uid() -> int:
    try:
        return BC250_DATA_DIR.stat().st_uid if BC250_DATA_DIR.exists() else _USER_HOME.stat().st_uid
    except Exception:
        return 1000
