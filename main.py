import asyncio
import json
import os
import re
import struct
import shutil
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

# Même chargement explicite pour bios_uma (règle générale : tout module maison à
# la racine du plugin est importé par chemin pour éviter toute collision Decky).
# Best-effort : si le fichier manque (zip incomplet), le plugin doit survivre —
# l'UI affichera simplement « UMA non supporté » au lieu de tuer tout le plugin.
try:
    _bspec = _ilu.spec_from_file_location(
        "bc250_bios_uma", os.path.join(os.path.dirname(os.path.abspath(__file__)), "bios_uma.py")
    )
    bios_uma = _ilu.module_from_spec(_bspec)
    _bspec.loader.exec_module(bios_uma)
except Exception:
    bios_uma = None

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
CU_ASIC_INSTANCE_CANDIDATES = (CU_ASIC_INSTANCE, "cyan_skillfish@0", None)
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


def _cmd_exists(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def _sudo_cmd(cmd: list) -> list:
    if os.geteuid() == 0:
        return cmd
    return ["sudo", "-n"] + cmd


def _is_ostree() -> bool:
    """Système immuable basé sur ostree (Bazzite/SteamOS/Silverblue) : rpm-ostree
    ET dnf y coexistent, mais seul rpm-ostree installe (le / est en lecture seule)."""
    return _cmd_exists("rpm-ostree") and (
        os.path.isdir("/run/ostree") or os.path.isdir("/ostree"))


def _umr_install_hint() -> str:
    if _is_ostree():
        return "rpm-ostree install --apply-live umr"
    if _cmd_exists("pacman"):
        return "sudo pacman -S umr"
    if _cmd_exists("paru"):
        return "paru -S umr"
    if _cmd_exists("yay"):
        return "yay -S umr"
    if _cmd_exists("shelly"):
        return "shelly aur install umr"
    if _cmd_exists("dnf"):
        return "sudo dnf install umr"
    if _cmd_exists("apt-get"):
        return "sudo apt install umr"
    return "installer le paquet umr"


def _umr_cmd_prefix(umr: str) -> list:
    # Repli si le flag root du plugin.json n'a pas été honoré : umr exige root pour debugfs
    if os.geteuid() != 0:
        return ["sudo", "-n", umr]
    return [umr]


def _umr_cmd_base(umr: str, instance: str | None) -> list:
    cmd = _umr_cmd_prefix(umr)
    if instance:
        cmd += ["-g", instance]
    return cmd


def _umr_write(umr: str, reg: str, value: int,
               se: int | None = None, sh: int | None = None) -> bool:
    # -g sélectionne l'instance GPU (instance 1 sur kernel 6.17+)
    # -b DOIT précéder -w : umr traite les flags séquentiellement
    for instance in CU_ASIC_INSTANCE_CANDIDATES:
        cmd = _umr_cmd_base(umr, instance)
        if se is not None and sh is not None:
            cmd += ["-b", str(se), str(sh), "0xffffffff"]
        cmd += ["-w", f"{CU_ASIC}.{reg}", hex(value)]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            if result.returncode == 0:
                return True
            print(f"[BC250 CU] umr write failed instance={instance}: rc={result.returncode} stderr={result.stderr[:200]!r}")
        except Exception as e:
            print(f"[BC250 CU] umr write exception instance={instance}: {e}")
    return False


def _umr_read(umr: str, reg: str,
              se: int | None = None, sh: int | None = None) -> int | None:
    # -g sélectionne l'instance GPU (instance 1 sur kernel 6.17+)
    # -b DOIT précéder -r
    for instance in CU_ASIC_INSTANCE_CANDIDATES:
        cmd = _umr_cmd_base(umr, instance)
        if se is not None and sh is not None:
            cmd += ["-b", str(se), str(sh), "0xffffffff"]
        cmd += ["-r", f"{CU_ASIC}.{reg}"]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            m = re.search(r'0x[0-9a-fA-F]+', result.stdout)
            if m:
                return int(m.group(), 16)
            # Certaines versions umr écrivent sur stderr
            m = re.search(r'0x[0-9a-fA-F]+', result.stderr)
            if m:
                return int(m.group(), 16)
            print(f"[BC250 CU] umr read failed instance={instance}: rc={result.returncode} stderr={result.stderr[:200]!r} stdout={result.stdout[:100]!r}")
        except Exception as e:
            print(f"[BC250 CU] umr read exception instance={instance}: {e}")
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
import re
import sys
from pathlib import Path

try:
    import vdf as _vdf
except ImportError:
    sys.exit(0)

PENDING_FILE = Path.home() / ".local/share/bc250-toolkit/pending_launch_options.json"

def _pick_active_steam_user(users, home):
    """SteamID64 du compte ACTIF parmi ceux de loginusers.vdf, ou None.

    ⚠️ Steam a CHANGÉ ce fichier (constaté le 25/08/2026) : "MostRecent" a
    disparu, remplacé par "AutoLogin" + "Timestamp", et registry.vdf n'expose
    plus "ActiveUser" numérique mais "AutoLoginUser" (le NOM du compte). Le code
    d'origine retombait alors sur « le PREMIER utilisateur du fichier » — juste
    par hasard sur une machine mono-compte, faux dès qu'il y en a plusieurs.
    On garde "MostRecent" en premier : un Steam plus ancien ne change pas.
    """
    autologin_name = ""
    try:
        reg = (home / ".steam/registry.vdf").read_text(errors="ignore")
        m = re.search(r'"AutoLoginUser"\s+"([^"]+)"', reg)
        if m:
            autologin_name = m.group(1)
    except Exception:
        pass
    by_name = by_flag = by_time = None
    newest = -1
    for uid, info in (users or {}).items():
        if not isinstance(info, dict):
            continue
        if autologin_name and info.get("AccountName") == autologin_name:
            by_name = by_name or uid
        if by_flag is None and (info.get("MostRecent") == "1"
                                or info.get("AutoLogin") == "1"):
            by_flag = uid
        try:
            ts = int(info.get("Timestamp", 0))
        except (TypeError, ValueError):
            ts = 0
        if ts > newest:
            newest, by_time = ts, uid
    return by_name or by_flag or by_time


def find_userid():
    try:
        data = _vdf.load(open(Path.home() / ".steam/steam/config/loginusers.vdf"))
        uid = _pick_active_steam_user(data.get("users", {}), Path.home())
        if uid:
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


def _pick_active_steam_user(users, home):
    """SteamID64 du compte ACTIF parmi ceux de loginusers.vdf, ou None.

    ⚠️ Steam a CHANGÉ ce fichier (constaté le 25/08/2026) : "MostRecent" a
    disparu, remplacé par "AutoLogin" + "Timestamp", et registry.vdf n'expose
    plus "ActiveUser" numérique mais "AutoLoginUser" (le NOM du compte). Le code
    d'origine retombait alors sur « le PREMIER utilisateur du fichier » — juste
    par hasard sur une machine mono-compte, faux dès qu'il y en a plusieurs.
    On garde "MostRecent" en premier : un Steam plus ancien ne change pas.
    """
    autologin_name = ""
    try:
        reg = (home / ".steam/registry.vdf").read_text(errors="ignore")
        m = re.search(r'"AutoLoginUser"\s+"([^"]+)"', reg)
        if m:
            autologin_name = m.group(1)
    except Exception:
        pass
    by_name = by_flag = by_time = None
    newest = -1
    for uid, info in (users or {}).items():
        if not isinstance(info, dict):
            continue
        if autologin_name and info.get("AccountName") == autologin_name:
            by_name = by_name or uid
        if by_flag is None and (info.get("MostRecent") == "1"
                                or info.get("AutoLogin") == "1"):
            by_flag = uid
        try:
            ts = int(info.get("Timestamp", 0))
        except (TypeError, ValueError):
            ts = 0
        if ts > newest:
            newest, by_time = ts, uid
    return by_name or by_flag or by_time


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
            # apply() returns a dict: {"ok": False, "error": …} is always
            # truthy, so a failure used to pass for a success and the loader
            # was restarted anyway — on a loop, since the installed version
            # had not changed. Read the field, not the dict.
            res = await updater.apply(info["url"])
            if res.get("ok"):
                updater.restart_loader()
            else:
                print(f"[BC250 updater] update aborted: {res.get('error', 'unknown reason')}")
        except Exception as e:
            print(f"[BC250 updater] auto-check error: {e}")

    async def check_update(self):
        return await updater.check()

    async def get_version(self):
        return updater.get_current_version()

    async def apply_update(self, url):
        res = await updater.apply(url)
        if res.get("ok"):
            updater.restart_loader()
        return res

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
        _chown_user(BC250_DATA_DIR)
        TOOLKIT_SETTINGS_FILE.write_text(json.dumps(data, indent=2))
        _chown_user(TOOLKIT_SETTINGS_FILE)

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
            _chown_user(BC250_DATA_DIR)
            PRE_STEAM_SCRIPT.write_text(_APPLY_VDF_SCRIPT)
            PRE_STEAM_SCRIPT.chmod(0o755)
            _chown_user(PRE_STEAM_SCRIPT)
            STEAM_DROPIN_DIR.mkdir(parents=True, exist_ok=True)
            _chown_user(STEAM_DROPIN_DIR)
            STEAM_DROPIN.write_text(f"[Service]\nExecStartPre=-{PRE_STEAM_SCRIPT}\n")
            _chown_user(STEAM_DROPIN)
            # daemon-reload dans le contexte user (le plugin tourne en root).
            # _user_uid() et PAS le propriétaire de BC250_DATA_DIR : ce dossier
            # est créé par nous, donc par root — on aurait pointé
            # XDG_RUNTIME_DIR sur /run/user/0 et parlé au mauvais systemd.
            user_uid = _user_uid()
            if user_uid:
                subprocess.run(
                    ["systemctl", "--user", "daemon-reload"],
                    capture_output=True, timeout=5,
                    env=_clean_env(HOME=str(_USER_HOME),
                                   XDG_RUNTIME_DIR=f"/run/user/{user_uid}"),
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

    # Instantané fdinfo précédent, pour calculer la charge GPU par DIFFÉRENCE.
    # L'interface interroge périodiquement : chaque appel mesure donc la charge
    # écoulée depuis le précédent, sans thread ni échantillonnage bloquant.
    _gpu_prev: tuple | None = None

    async def get_system_status(self) -> dict:
        status: dict = {}

        # ── GPU : mesures RÉELLES (cf. _read_gpu_metrics / _drm_gfx_snapshot) ──
        try:
            metrics = _read_gpu_metrics()
            status.update({k: v for k, v in metrics.items()
                           if k != "gfx_activity_supported"})
            # Dit à l'interface que le MATÉRIEL ne mesure pas la charge : c'est
            # cette sentinelle que MangoHud affiche en 655 %.
            status["gpu_activity_from_firmware"] = metrics.get(
                "gfx_activity_supported", False)
        except Exception:
            pass
        try:
            now = time.monotonic_ns()
            snap = _drm_gfx_snapshot()
            prev = self._gpu_prev
            self._gpu_prev = (snap, now)
            if prev:
                old_snap, old_ns = prev
                elapsed = now - old_ns
                # Sous ~200 ms la division amplifie le bruit d'échantillonnage ;
                # au-delà de 30 s l'instantané précédent ne décrit plus rien.
                if 200_000_000 <= elapsed <= 30_000_000_000:
                    busy = sum(max(0, ns - old_snap.get(cid, ns))
                               for cid, ns in snap.items())
                    status["gpu_load_pct"] = round(
                        min(100.0, busy / elapsed * 100), 1)
        except Exception:
            pass

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
                    freq = hwmon / "freq1_input"     # GPU shader clock (Hz)
                    if freq.exists():
                        try:
                            status["gpu_clock_mhz"] = round(
                                int(freq.read_text()) / 1_000_000)
                        except (OSError, ValueError):
                            pass
        except Exception:
            pass

        # CPU clock — average of the per-core current MHz (cpufreq isn't always
        # exposed on this APU, so read /proc/cpuinfo which always is).
        try:
            mhz = [float(l.split(":")[1]) for l in
                   Path("/proc/cpuinfo").read_text().splitlines()
                   if l.lower().startswith("cpu mhz")]
            if mhz:
                status["cpu_clock_mhz"] = round(sum(mhz) / len(mhz))
        except Exception:
            pass

        # CPU topology — cores / threads. The BC-250 enumerates 6 of the 8 Zen 2
        # cores on its Oberon die (6C/12T); boards running the community core
        # unlock report 8C/16T, so surfacing both numbers makes the state
        # obvious. /proc/cpuinfo only lists ONLINE CPUs, and its "physical id"
        # + "core id" pair is what distinguishes a core from its SMT sibling.
        try:
            pairs, threads = set(), 0
            phys = core = None
            for line in Path("/proc/cpuinfo").read_text().splitlines() + [""]:
                key, _, val = line.partition(":")
                key, val = key.strip(), val.strip()
                if key == "processor":
                    threads += 1
                elif key == "physical id":
                    phys = val
                elif key == "core id":
                    core = val
                elif not key:                       # blank line = end of block
                    if core is not None:
                        pairs.add((phys, core))
                    phys = core = None
            if threads:
                status["cpu_threads"] = threads
            if pairs:
                status["cpu_cores"] = len(pairs)
        except Exception:
            pass

        # Fan speed — the BC-250's fan shows up as a Super-I/O sensor (nct6686 on
        # this board); most fanN_input headers read 0 (unused), so report the
        # fastest spinning one as the active fan.
        try:
            rpms = []
            for hwmon in Path("/sys/class/hwmon").iterdir():
                for fan in sorted(hwmon.glob("fan*_input")):
                    try:
                        rpm = int(fan.read_text())
                    except (OSError, ValueError):
                        continue
                    if rpm > 0:
                        rpms.append(rpm)
            if rpms:
                status["fan_rpm"] = max(rpms)
        except Exception:
            pass

        # RAM système = ce qui reste à l'OS après le carve-out UMA (MemTotal bouge
        # avec le réglage UMA du BIOS). used = MemTotal - MemAvailable (vision htop).
        try:
            mem: dict = {}
            for line in Path("/proc/meminfo").read_text().splitlines():
                key, _, rest = line.partition(":")
                if key in ("MemTotal", "MemAvailable"):
                    mem[key] = int(rest.strip().split()[0])  # kB
            if "MemTotal" in mem:
                status["mem_total_mb"] = mem["MemTotal"] // 1024
                if "MemAvailable" in mem:
                    status["mem_used_mb"] = max(0, mem["MemTotal"] - mem["MemAvailable"]) // 1024
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
                env=_clean_env(HOME=str(_USER_HOME),
                               XDG_RUNTIME_DIR=f"/run/user/{_user_uid()}"),
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
            uid = _pick_active_steam_user(data.get("users", {}), _USER_HOME)
            if uid:
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
            _chown_user(BC250_DATA_DIR)
            PENDING_LO_FILE.write_text(json.dumps(pending))
            _chown_user(PENDING_LO_FILE)
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
            _chown_user(BC250_DATA_DIR)
            RADV_STATE_FILE.write_text(json.dumps(state, indent=2))
            _chown_user(RADV_STATE_FILE)
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
            return {"ok": False, "error": f"umr non trouvé — installer: {_umr_install_hint()}"}

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
        """Installe umr selon l'OS : rpm-ostree (Bazzite/SteamOS), pacman/paru/yay
        (Arch/CachyOS), dnf (Fedora), apt (Debian/Ubuntu). Bloquant ~30s."""
        if _find_umr():
            return {"ok": True, "already": True}

        commands: list[tuple[str, list]] = []
        if _is_ostree():
            # Immuable : rpm-ostree est LA méthode (dnf échouerait sur / en RO).
            commands.append(("rpm-ostree", ["rpm-ostree", "install", "--apply-live", "--assumeyes", "umr"]))
        else:
            if _cmd_exists("pacman"):
                commands.append(("pacman", _sudo_cmd(["pacman", "-S", "--noconfirm", "umr"])))
            if _cmd_exists("paru"):
                commands.append(("paru", ["paru", "-S", "--noconfirm", "umr"]))
            if _cmd_exists("yay"):
                commands.append(("yay", ["yay", "-S", "--noconfirm", "umr"]))
            if _cmd_exists("shelly"):
                commands.append(("shelly", ["shelly", "aur", "install", "umr"]))
            if _cmd_exists("dnf"):
                commands.append(("dnf", _sudo_cmd(["dnf", "install", "-y", "umr"])))
            if _cmd_exists("apt-get"):
                commands.append(("apt", _sudo_cmd(["apt-get", "install", "-y", "umr"])))

        if not commands:
            return {"ok": False, "error": f"Aucun gestionnaire de paquets supporté trouvé — {_umr_install_hint()}"}

        errors = []
        for name, cmd in commands:
            try:
                r = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
                if r.returncode == 0:
                    return {"ok": True, "already": False, "method": name}
                errors.append(f"{name}: {(r.stderr or r.stdout)[-500:]}")
            except subprocess.TimeoutExpired:
                errors.append(f"{name}: Timeout (180s)")
            except Exception as e:
                errors.append(f"{name}: {e}")

        return {"ok": False, "error": "\n".join(errors)[-1000:]}

    # ── Déverrouillage des 2 cœurs CPU désactivés (6C/12T → 8C/16T) ───────────
    # Le BC-250 n'énumère que 6 des 8 cœurs Zen 2 de sa puce Oberon. Le masque de
    # présence (SMN 0x0115A870) n'est PAS accessible en écriture depuis l'hôte :
    # il faut passer par une primitive SMU. Tout l'écriture est déléguée au script
    # de rw-r-r-0644 (tools/bc250-core-unlock/, MIT, gardé intact) ; nous ne
    # faisons que la lecture d'état et l'orchestration.
    #
    # ⚠️ VOLATILE, ET C'EST VOULU : le masque tient les redémarrages à chaud mais
    # une coupure secteur le remet à 0x77. On n'installe DÉLIBÉRÉMENT aucun
    # service au boot — le rendre permanent exigerait un reboot automatique
    # supplémentaire à chaque démarrage à froid. La vraie persistance passe par
    # le BIOS modifié « -T » (voir le README), qui l'expose avec un interrupteur.

    def _core_tool(self, name: str) -> Path:
        """Chemin d'un outil, que le plugin soit déployé à plat ou en dépôt."""
        here = Path(__file__).resolve().parent
        for base in (here / "core_unlock", here / "defaults" / "core_unlock"):
            p = base / name
            if p.exists():
                return p
        return here / "core_unlock" / name

    async def get_cpu_unlock_status(self) -> dict:
        """État du déverrouillage. Lecture seule, n'écrit jamais le masque."""
        script = self._core_tool("bc250-core-status.py")
        if not script.exists():
            return {"ok": False, "error": "sonde de statut introuvable"}
        try:
            r = await asyncio.get_event_loop().run_in_executor(
                None, lambda: subprocess.run(
                    _sudo_cmd(["python3", str(script)]),
                    capture_output=True, text=True, timeout=20))
        except Exception as e:
            return {"ok": False, "error": str(e)}
        if r.returncode != 0 or not r.stdout.strip():
            # Cas le plus courant hors Bazzite : pas de sudo sans mot de passe.
            # On le dit explicitement plutôt que de rendre un état vide.
            err = (r.stderr or "").strip() or f"code de sortie {r.returncode}"
            if "password" in err.lower() or "sudo" in err.lower():
                err = ("privilèges root indisponibles (sudo sans mot de passe "
                       "non configuré)")
            return {"ok": False, "error": err}
        try:
            data = json.loads(r.stdout.strip().splitlines()[-1])
        except Exception as e:
            return {"ok": False, "error": f"sortie illisible: {e}"}
        data["ok"] = True
        return data

    async def apply_cpu_unlock(self) -> dict:
        """Écrit le masque via le script upstream. Effectif au PROCHAIN reboot."""
        status = await self.get_cpu_unlock_status()
        if not status.get("ok"):
            return status
        if status.get("already_unlocked"):
            return {"ok": True, "already": True,
                    "need_reboot": (status.get("cores") or 0) < 8}
        if not status.get("eligible"):
            return {"ok": False,
                    "error": status.get("error") or "carte non éligible"}

        script = self._core_tool("upstream/bc250-unlock-cores.py")
        if not script.exists():
            return {"ok": False, "error": "script de déverrouillage introuvable"}

        # Le gouverneur SMU se dispute la boîte aux lettres : on l'arrête le
        # temps de l'écriture, et on le REMET quoi qu'il arrive — le laisser à
        # l'arrêt priverait la carte de sa gestion de fréquences.
        gov = (status.get("governor") or {}).get("unit")
        was_active = bool((status.get("governor") or {}).get("active"))
        loop = asyncio.get_event_loop()

        def _run(cmd, timeout=30):
            return subprocess.run(_sudo_cmd(cmd), capture_output=True,
                                  text=True, timeout=timeout)

        try:
            if gov and was_active:
                await loop.run_in_executor(
                    None, lambda: _run(["systemctl", "stop", gov + ".service"]))
            r = await loop.run_in_executor(
                None, lambda: _run(["python3", str(script)], 60))
        except Exception as e:
            return {"ok": False, "error": str(e)}
        finally:
            if gov and was_active:
                try:
                    await loop.run_in_executor(
                        None,
                        lambda: _run(["systemctl", "start", gov + ".service"]))
                except Exception:
                    pass

        out = ((r.stdout or "") + (r.stderr or "")).strip()
        if r.returncode != 0:
            return {"ok": False, "error": out or f"code de sortie {r.returncode}"}
        return {"ok": True, "need_reboot": True, "output": out}

    # ── UMA (VRAM) via variable EFI AmdSetup ──────────────────────────────────
    # Contrairement aux CU (pokés à chaud), l'UMA est un carve-out décidé au POST :
    # on patche la NVRAM du BIOS et le changement ne prend effet qu'au REBOOT.

    async def get_uma_status(self) -> dict:
        if bios_uma is None:
            return {"profile_ready": False, "layout_ok": False,
                    "layout_detail": "module bios_uma absent", "current": {},
                    "bios_version": None, "vram_total_mb": _read_vram_total_mb()}
        st = bios_uma.get_status()
        st["vram_total_mb"] = _read_vram_total_mb()
        return st

    async def set_uma_frame_buffer(self, label: str) -> dict:
        if bios_uma is None:
            return {"ok": False, "error": "module bios_uma absent"}
        return bios_uma.set_uma_frame_buffer(label, backup_dir=BC250_DATA_DIR / "bios_backups")

    async def list_uma_backups(self) -> list:
        d = BC250_DATA_DIR / "bios_backups"
        return sorted(str(p) for p in d.glob("AmdSetup_*.bin")) if d.is_dir() else []

    async def restore_uma_backup(self, path: str) -> dict:
        if bios_uma is None:
            return {"ok": False, "error": "module bios_uma absent"}
        p = Path(path)
        if p.parent != (BC250_DATA_DIR / "bios_backups"):
            return {"ok": False, "error": "Chemin hors du dossier de backups"}
        return bios_uma.restore_backup(p)

    # ── DB info ───────────────────────────────────────────────────────────────

    async def get_db_meta(self) -> dict:
        return self._games_db.get("_meta", {})

    async def get_db_game_count(self) -> int:
        return sum(1 for k in self._games_db if not k.startswith("_"))


# ── Mesures GPU réelles sur BC-250 ────────────────────────────────────────────
# Le firmware de cette puce NE MESURE PAS la charge GPU : `gpu_busy_percent`
# répond EOPNOTSUPP, et `gpu_metrics.average_gfx_activity` vaut 0xFFFF, la
# sentinelle « non supporté ». MangoHud la divise par 100 et affiche 655 %.
# On ne convertit donc JAMAIS une sentinelle : on rend None, et l'interface dit
# « non mesuré » plutôt que d'inventer un chiffre.
#
# La charge, elle, se calcule depuis les compteurs par moteur de fdinfo
# (`drm-engine-gfx`, en ns) — la méthode de nvtop/btop. Vérifié sur BC-250 :
# ~58 % interface Steam seule, ~75 % en jeu, corrélé à la température (40→44 °C)
# et à la puissance GPU (28,7→43,7 W).
# ⚠️ NE PAS échantillonner mmGRBM_STATUS : sur gfx1013 il rend une valeur
# CONSTANTE avec et sans charge (vérifié sur des dizaines de lectures).
_GPU_SENTINELS = (0xFFFF, 0xFFFFFFFF)


def _drm_gfx_snapshot() -> dict:
    """{drm-client-id: nanosecondes GFX cumulées}.

    Dédupliqué par client : un même client ouvre plusieurs fd, les additionner
    compterait son temps plusieurs fois.
    """
    out: dict = {}
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        d = f"/proc/{pid}/fdinfo"
        try:
            fds = os.listdir(d)
        except OSError:
            continue
        for fd in fds:
            try:
                with open(f"{d}/{fd}") as f:
                    txt = f.read()
            except OSError:
                continue
            if "drm-engine-gfx" not in txt:
                continue
            cid = re.search(r"drm-client-id:\s*(\d+)", txt)
            ns = re.search(r"drm-engine-gfx:\s*(\d+)", txt)
            if cid and ns:
                out[cid.group(1)] = int(ns.group(1))
    return out


def _read_gpu_metrics() -> dict:
    """Champs utiles de `gpu_metrics`, sentinelles écartées.

    Struct gpu_metrics_v2_x (APU). On ne lit que ce qu'on a VÉRIFIÉ sur BC-250 :
    températures gfx/soc (centièmes de °C) et puissances soc/gfx (mW).
    `average_socket_power` est volontairement ignoré : relevé à 19,5 W alors que
    le GPU seul en consommait 43,7 — champ incohérent sur cette puce.
    """
    out: dict = {}
    try:
        raw = Path("/sys/class/drm/card1/device/gpu_metrics").read_bytes()
    except OSError:
        for c in sorted(Path("/sys/class/drm").glob("card*/device/gpu_metrics")):
            try:
                raw = c.read_bytes()
                break
            except OSError:
                continue
        else:
            return out
    if len(raw) < 64:
        return out
    try:
        _size, fmt, _cont = struct.unpack_from("<HBB", raw, 0)
        if fmt != 2:                      # v1_x = dGPU, pas la table APU
            return out
        o = 4
        tgfx, tsoc = struct.unpack_from("<HH", raw, o); o += 4
        o += 2 * 10                       # temperature_core[8] + temperature_l3[2]
        act, _mm = struct.unpack_from("<HH", raw, o); o += 4
        o += (8 - o % 8) % 8              # alignement du system_clock_counter
        o += 8
        # ⚠️ Les PUISSANCES de cette table sont INEXPLOITABLES sur BC-250 :
        # mesuré sous charge CONSTANTE, average_gfx_power saute de 869 à
        # 62460 mW et average_socket_power de 4447 à 50458 en quelques
        # secondes. Le décodage est pourtant bon (la température est stable et
        # average_cpu_power reste la sentinelle) : ce sont les données du
        # firmware qui sont fausses. On ne les expose pas — MangoHud, lui, lit
        # ce même champ, d'où ses watts fantaisistes.
        for key, val, div in (("gpu_temp_c", tgfx, 100.0), ("soc_temp_c", tsoc, 100.0)):
            if val not in _GPU_SENTINELS:
                out[key] = round(val / div, 1)
        # Rendu tel quel pour que l'interface puisse DIRE que le matériel ne le
        # mesure pas, au lieu de laisser croire à une valeur manquante.
        out["gfx_activity_supported"] = act not in _GPU_SENTINELS
    except (struct.error, ValueError):
        pass
    return out


def _read_vram_total_mb() -> int | None:
    """VRAM totale vue par amdgpu (Mo) — reflète le carve-out UMA effectif."""
    try:
        for p in sorted(Path("/sys/class/drm").glob("card*/device/mem_info_vram_total")):
            return int(p.read_text().strip()) // (1024 * 1024)
    except Exception:
        pass
    return None


def _user_uid() -> int:
    """UID du VRAI utilisateur, jamais celui du plugin.

    On interroge le HOME et pas BC250_DATA_DIR : le plugin tourne en root, donc
    il crée lui-même ce dossier et son propriétaire serait alors `0`. On
    renverrait root, et le chown de ~/.drirc donnerait la config mesa de
    l'utilisateur à root — silencieusement. Le home, lui, appartient toujours à
    l'utilisateur. BC250_DATA_DIR ne sert plus que de repli, et seulement s'il
    n'appartient pas à root.
    """
    try:
        uid = _USER_HOME.stat().st_uid
        if uid != 0:
            return uid
    except Exception:
        pass
    try:
        uid = BC250_DATA_DIR.stat().st_uid
        if uid != 0:
            return uid
    except Exception:
        pass
    return 1000


def _clean_env(**overrides) -> dict:
    """Env pour un binaire SYSTÈME, débarrassé de l'env PyInstaller.

    plugin_loader est un binaire PyInstaller : il pointe LD_LIBRARY_PATH (et
    parfois LD_PRELOAD) vers ses libs embarquées (/tmp/_MEI...). Un enfant les
    hérite, donc `systemctl`/`flatpak` chargent le mauvais libcrypto et
    abandonnent (« OPENSSL_3.4.0 not found »). PyInstaller garde l'original dans
    LD_LIBRARY_PATH_ORIG : on le restaure, sinon on retire la variable.
    Trouvé via Steamcord #38, où le même défaut cassait le partage d'écran sur
    SteamOS — invisible sur Bazzite, dont les libs système sont compatibles.
    """
    env = {**os.environ, **overrides}
    orig = env.pop("LD_LIBRARY_PATH_ORIG", None)
    if orig is not None:
        env["LD_LIBRARY_PATH"] = orig
    else:
        env.pop("LD_LIBRARY_PATH", None)
    env.pop("LD_PRELOAD", None)
    return env


def _chown_user(path) -> None:
    """Rend à l'utilisateur un fichier que le plugin vient de créer en root.

    Sans ça, tout ce que le plugin écrit dans le home appartiendrait à root :
    illisible en écriture pour les outils qui tournent en session, et un piège
    si le plugin repassait un jour en non-root (il ne pourrait plus rien
    réécrire de ce qu'il a lui-même produit).
    """
    if os.geteuid() != 0:
        return
    try:
        uid = _user_uid()
        os.chown(path, uid, uid)
    except Exception:
        pass
