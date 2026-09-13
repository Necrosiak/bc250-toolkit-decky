import asyncio
import json
import os
import re
import struct
import shutil
import stat
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

# Déverrouillage CPU au boot (8C/16T). Les scripts sont RECOPIÉS hors du dossier
# du plugin : celui-ci est réécrit à chaque mise à jour Decky, et un service du
# système ne doit pas dépendre d'un chemin que Decky peut effacer.
CORE_BOOT_SCRIPT   = Path("/usr/local/bin/bc250-core-boot")
CORE_SERVICE_NAME  = "bc250-core-unlock"
CORE_SERVICE_PATH  = Path(f"/etc/systemd/system/{CORE_SERVICE_NAME}.service")
CORE_LIB_DIR       = Path("/usr/local/lib/bc250-core-unlock")
CORE_STATE_DIR     = Path("/var/lib/bc250-core-unlock")
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


# How many release checks, and how long between two. The check runs a few
# seconds after the backend, which is often BEFORE the network is reachable:
# the logs on the test machine show three boots out of four dying on
# "Temporary failure in name resolution". Nothing retried, so the plugin stayed
# on its version until the next boot — which failed the same way.
UPDATE_CHECK_TRIES = 10
UPDATE_CHECK_DELAY_S = 30


async def _recheck(updater):
    """`updater.check()`, retried for as long as it is the network that is missing."""
    from asyncio import sleep as _sleep
    info = await updater.check()
    for _ in range(UPDATE_CHECK_TRIES - 1):
        if not info.get("error"):
            break
        await _sleep(UPDATE_CHECK_DELAY_S)
        info = await updater.check()
    return info


# ── Pont vers BC250 Control Center (movacx/bc250-control-center, MIT) ─────────
# Quand le Control Center est installé, le Toolkit ne garde AUCUN état matériel
# à lui : il passe par le helper root du Control Center, exactement comme le
# plugin Decky livré avec ce dernier. Les deux interfaces lisent et écrivent
# donc les mêmes fichiers (/etc/bc250-cu-live-manager.conf, /etc/bc250-smu-oc.conf,
# TOML du governor…) : ce qui change au bureau apparaît en gamemode et
# inversement, sans synchro à maintenir. Sans Control Center, le Toolkit
# retombe sur son propre code.
CC_HELPER = Path("/usr/libexec/bc250-control-center/bc250-quick-access-helper")
CC_PROTOCOL = 13  # celui du helper de la v1.19.0 ; renvoyé par `status`
CC_GPU_PROFILES = (
    "recovery", "balanced", "gaming", "benchmark",
    "oberon-1500", "oberon-1850", "oberon-2000",
)
CC_FAN_CHANNELS = (2, 3, 4, 5)
CC_CPU_FREQUENCIES = tuple(range(3500, 4201, 50))
CC_CPU_VIDS = tuple(range(950, 1326, 5))
CC_CPU_SCALES = tuple(range(-50, 1))
# Le statut complet coûte umr + hwmon + systemctl : l'onglet CU et l'onglet
# Système le sondent toutes les 5-10 s, on partage donc une lecture récente.
CC_STATUS_MAX_AGE = 4.0
# Installation depuis l'onglet : version FIGÉE sur celle dont on parle le
# protocole (CC_PROTOCOL) et empreinte vérifiée avant de passer le paquet à
# rpm-ostree en root. Changer les trois ensemble, jamais « latest ».
CC_RPM_VERSION = "1.19.0"
CC_RPM_URL = ("https://github.com/movacx/bc250-control-center/releases/download/"
              "v1.19.0/bc250-control-center-1.19.0-1.fc44.noarch.rpm")
CC_RPM_SHA256 = "914d1879f6ab6c1cd7767ce52d142f5876a1864ec878018df1a36471c618309b"
RPM_OSTREE = Path("/usr/bin/rpm-ostree")

_cc_helper_lock = asyncio.Lock()     # sérialise TOUT appel au helper, lectures comprises
_cc_operation_lock = asyncio.Lock()  # refuse une 2e écriture au lieu de la mettre en file
_cc_status_cache: dict = {"at": 0.0, "value": None}


def _cc_helper_trusted() -> bool:
    """N'exécute jamais un helper remplacé : fichier régulier root, non inscriptible."""
    try:
        st = CC_HELPER.lstat()
    except OSError:
        return False
    return (
        stat.S_ISREG(st.st_mode)
        and st.st_uid == 0
        and not st.st_mode & 0o022
        and bool(st.st_mode & stat.S_IXUSR)
    )


def _cc_run(*args: str, timeout: int = 190) -> dict:
    if not _cc_helper_trusted():
        return {"ok": False, "error": "BC250 Control Center helper is missing or not protected."}
    try:
        r = subprocess.run(
            [str(CC_HELPER), *args], text=True, capture_output=True,
            timeout=timeout, check=False,
            env={"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8"},
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "BC250 Control Center operation timed out."}
    except OSError as e:
        return {"ok": False, "error": str(e)}
    out = (r.stdout or "").strip()
    if r.returncode:
        return {"ok": False, "error": (r.stderr or out or "helper failed").strip()[-2000:]}
    try:
        payload = json.loads(out)
    except json.JSONDecodeError:
        payload = {"ok": True, "message": out[-2000:]}
    return payload if isinstance(payload, dict) else {"ok": True, "value": payload}


def _cc_status_blocking() -> dict:
    r = _cc_run("status", timeout=20)
    if r.get("ok") is False:
        return r
    if type(r.get("protocol")) is not int or r["protocol"] != CC_PROTOCOL:
        return {
            "ok": False,
            "protocol_mismatch": True,
            "error": f"helper protocol {r.get('protocol')!r}, expected {CC_PROTOCOL}",
        }
    return r


def _cc_gpu_profiles(lo: int, hi: int, governor: str) -> list:
    """Mêmes bornes que bc250cc/domain/gpu/profiles.py du Control Center."""
    if governor == "oberon":
        cands = (
            ("oberon-1500", "Balanced", 1000, 1500),
            ("oberon-1850", "Gaming", 1000, 1850),
            ("oberon-2000", "Benchmark", 1000, 2000),
        )
    else:
        cands = (
            ("balanced", "Balanced", max(500, lo), 1500),
            ("gaming", "Gaming", max(1000, lo), 1850),
            ("benchmark", "Benchmark", max(1000, lo), 2000),
        )
    out = []
    for key, name, pmin, pmax in cands:
        a, b = max(lo, pmin), min(hi, pmax)
        if a <= b:
            out.append({"key": key, "name": name, "min": a, "max": b})
    return out


def _cc_masks_error(masks) -> str | None:
    if not isinstance(masks, (list, tuple)) or len(masks) != 4:
        return "A CU table must contain exactly four row masks."
    if any(type(m) is not int or not 0 <= m <= 0x1F for m in masks):
        return "Every CU row mask must be an integer from 0 through 31."
    if sum(bin(m).count("1") * 2 for m in masks) not in range(24, 41, 2):
        return "A CU table must route 24 through 40 CUs."
    return None


def _cc_bounded(value, allowed) -> int | None:
    """Entier exact et dans la liste autorisée — jamais d'argument libre vers root."""
    if isinstance(value, bool) or type(value) not in (int, str):
        return None
    try:
        n = int(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return n if str(n) == str(value) and n in allowed else None


def _cc_live_gpu_clock(status: dict) -> dict:
    """Le helper du CC lit `pp_dpm_sclk`, qui reste bloqué sur 14-100 MHz même
    avec fix-freq du governor ; `hwmon/freq1_input` (ce que lit MangoHud) donne
    la vraie horloge. Copie : le cache du statut garde la valeur du helper."""
    try:
        for hwmon in Path("/sys/class/hwmon").iterdir():
            if (hwmon / "name").read_text().strip() != "amdgpu":
                continue
            mhz = round(int((hwmon / "freq1_input").read_text()) / 1_000_000)
            if mhz > 0:
                return {**status, "gpu_core_mhz": mhz}
    except (OSError, ValueError):
        pass
    return status


# phase : idle → running → staged | failed. `staged` survit au rechargement du
# plugin grâce à la lecture de rpm-ostree, faite une seule fois (le démon est
# réveillé à chaque `status`, pas question de le sonder toutes les 5 s).
_cc_install_state: dict = {"phase": "idle", "error": None, "checked": False, "task": None}


def _cc_install_supported() -> bool:
    return Path("/run/ostree-booted").exists() and RPM_OSTREE.is_file()


def _cc_install_staged_blocking() -> bool:
    """Le prochain déploiement (index 0), pas encore booté, embarque déjà le paquet."""
    try:
        r = subprocess.run([str(RPM_OSTREE), "status", "--json"], text=True,
                           capture_output=True, timeout=30, check=False)
        deps = json.loads(r.stdout or "{}").get("deployments") or []
    except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return False
    if not deps or deps[0].get("booted"):
        return False
    return any(str(p).startswith("bc250-control-center-")
               for p in deps[0].get("requested-local-packages") or [])


def _cc_install_blocking() -> None:
    import hashlib
    import tempfile
    work = Path(tempfile.mkdtemp(prefix="bc250-toolkit-cc-", dir="/var/tmp"))
    rpm = work / CC_RPM_URL.rsplit("/", 1)[1]
    try:
        digest = hashlib.sha256()
        req = urllib.request.Request(CC_RPM_URL, headers={"User-Agent": "BC250-Toolkit-Decky"})
        with urllib.request.urlopen(req, timeout=60, context=updater._ssl_context()) as resp, \
                open(rpm, "wb") as f:
            while chunk := resp.read(1 << 16):
                digest.update(chunk)
                f.write(chunk)
        if digest.hexdigest() != CC_RPM_SHA256:
            raise RuntimeError("checksum mismatch, package rejected")
        r = subprocess.run(
            [str(RPM_OSTREE), "install", "--idempotent", str(rpm)],
            text=True, capture_output=True, timeout=1800, check=False,
            env={"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8"},
        )
        if r.returncode:
            raise RuntimeError((r.stderr or r.stdout or "rpm-ostree failed").strip()[-600:])
        _cc_install_state.update(phase="staged", error=None, checked=True)
    except Exception as e:
        _cc_install_state.update(phase="failed", error=str(e)[-600:] or type(e).__name__)
    finally:
        shutil.rmtree(work, ignore_errors=True)


def _retire_toolkit_cu_service() -> bool:
    """Le Control Center restaure les CU au boot : notre service ferait un 2e
    passage, peut-être avec une AUTRE table. On le désactive sans supprimer ses
    fichiers, pour que ce soit réversible."""
    unit = f"{CU_SERVICE_NAME}.service"
    try:
        r = subprocess.run(["systemctl", "is-enabled", unit], capture_output=True, text=True, timeout=5)
        if r.stdout.strip() != "enabled":
            return False
        d = subprocess.run(_sudo_cmd(["systemctl", "disable", unit]), capture_output=True, timeout=15)
        return d.returncode == 0
    except Exception:
        return False


class Plugin:
    async def _main(self):
        self._games_db: dict = {}
        if _cc_helper_trusted():
            asyncio.create_task(self._cc_retire_duplicate_cu_boot())
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
        await asyncio.get_event_loop().run_in_executor(None, self._refresh_core_boot_script)
        await self._load_db()
        asyncio.create_task(self._autoupdate_check())

    async def _autoupdate_check(self):
        # Silent release check at boot: if enabled and a newer release exists,
        # download + unpack over the plugin dir and restart plugin_loader.
        try:
            if not updater.is_autoupdate_enabled():
                return
            info = await _recheck(updater)
            if not info.get("update_available"):
                return
            print(f"[BC250 updater] {info['latest']} available (have {info['current']}); applying")
            # apply() returns a dict: {"ok": False, "error": …} is always
            # truthy, so a failure used to pass for a success and the loader
            # was restarted anyway — on a loop, since the installed version
            # had not changed. Read the field, not the dict.
            # We apply it OURSELVES. This plugin declares `flags: ["root"]`, so
            # its backend runs as root and can always write — which is exactly
            # why it never hit the Permission denied the others did.
            #
            # ⛔ Do NOT delegate to `utilities/install_plugin`: that is the Decky
            # Store route, and it reports the install to plugins.deckbrew.xyz.
            # Our plugins are not there → 404 → the rest never runs: files
            # written, plugin never reloaded, and a frozen modal across the
            # Steam UI. Measured here on 2026-09-13.
            res = await updater.apply(info["url"])
            if res.get("ok"):
                updater.restart_loader()
                return
            print(f"[BC250 updater] update aborted: {res.get('error', 'unknown reason')}")
            self._pending_update = {"version": info["latest"],
                                    "error": res.get("error", "")}
        except Exception as e:
            print(f"[BC250 updater] auto-check error: {e}")

    # Failure notice parked by _autoupdate_check, taken by the frontend that notifies.
    _pending_update = None

    async def take_pending_update(self):
        """Hand the failed-update notice to the frontend, once.

        Cleared on read: the notification must fire ONCE, not on every QAM open.
        """
        pending, self._pending_update = self._pending_update, None
        return pending or {}

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

    # ── BC250 Control Center (pont) ───────────────────────────────────────────

    async def cc_status(self, max_age: float = 0.0) -> dict:
        if not _cc_helper_trusted():
            return {"ok": False, "available": False, "install": await self._cc_install_info()}
        cached = _cc_status_cache["value"]
        if max_age and cached is not None and time.monotonic() - _cc_status_cache["at"] < max_age:
            return _cc_live_gpu_clock(cached)
        async with _cc_helper_lock:
            r = await asyncio.to_thread(_cc_status_blocking)
        r["available"] = True
        if r.get("ok") is not False:
            allowed = r.get("gpu_allowed_range")
            if isinstance(allowed, (list, tuple)) and len(allowed) == 2:
                try:
                    r["gpu_profiles"] = _cc_gpu_profiles(
                        int(allowed[0]), int(allowed[1]), str(r.get("gpu_governor", "cyan")))
                except (TypeError, ValueError):
                    pass
            _cc_status_cache.update(at=time.monotonic(), value=r)
        return _cc_live_gpu_clock(r)

    async def cc_cpu_telemetry(self) -> dict:
        if not _cc_helper_trusted():
            return {"ok": False, "available": False}
        # Hors des verrous : doit répondre PENDANT une détection CPU de plusieurs minutes.
        r = await asyncio.to_thread(_cc_run, "cpu-telemetry", timeout=5)
        if r.get("ok") is not False and r.get("protocol") != CC_PROTOCOL:
            return {"ok": False, "protocol_mismatch": True, "error": "helper protocol mismatch"}
        return r

    async def _cc_operation(self, *args: str, timeout: int = 190, verify: bool = True) -> dict:
        if _cc_operation_lock.locked():
            return {"ok": False, "error": "busy"}

        def blocking() -> dict:
            if verify:
                st = _cc_status_blocking()
                if st.get("ok") is False:
                    return st
            return _cc_run(*args, timeout=timeout)

        async with _cc_operation_lock, _cc_helper_lock:
            r = await asyncio.to_thread(blocking)
        _cc_status_cache["at"] = 0.0  # la prochaine lecture doit refléter l'écriture
        return r

    async def cc_gpu_profile(self, profile: str) -> dict:
        if profile not in CC_GPU_PROFILES:
            return {"ok": False, "error": "Unsupported GPU profile."}
        # Le helper valide lui-même le governor actif et relit le résultat.
        return await self._cc_operation("gpu-profile", profile, timeout=30, verify=False)

    async def cc_gpu_safe_point(self, frequency) -> dict:
        n = _cc_bounded(frequency, range(500, 2601))
        if n is None:
            return {"ok": False, "error": "Unsupported GPU safe-point."}
        return await self._cc_operation("gpu-safe-point", str(n), timeout=30, verify=False)

    async def cc_cu_table(self, masks) -> dict:
        err = _cc_masks_error(masks)
        if err:
            return {"ok": False, "error": err}
        return await self._cc_operation("cu-table", *(str(m) for m in masks), timeout=480)

    async def cc_cu_save(self, masks) -> dict:
        err = _cc_masks_error(masks)
        if err:
            return {"ok": False, "error": err}
        r = await self._cc_operation("cu-save", *(str(m) for m in masks), timeout=660)
        if r.get("ok") is not False:
            await asyncio.to_thread(_retire_toolkit_cu_service)
        return r

    async def cc_cu_service(self, action: str) -> dict:
        if action not in ("install", "remove"):
            return {"ok": False, "error": "Unsupported CU service action."}
        r = await self._cc_operation("cu-service", action, timeout=240 if action == "install" else 90)
        if action == "install" and r.get("ok") is not False:
            await asyncio.to_thread(_retire_toolkit_cu_service)
        return r

    async def cc_fan_channel(self, channel, target) -> dict:
        ch = _cc_bounded(channel, CC_FAN_CHANNELS)
        if ch is None:
            return {"ok": False, "error": "Unsupported fan channel."}
        if target == "automatic":
            tgt = "automatic"
        else:
            pct = _cc_bounded(target, range(20, 101))
            if pct is None:
                return {"ok": False, "error": "Fan speed must be Automatic or 20-100%."}
            tgt = str(pct)
        return await self._cc_operation("fan-channel", str(ch), tgt, timeout=30)

    async def cc_cpu_tuning(self, frequency, vid) -> dict:
        f = _cc_bounded(frequency, CC_CPU_FREQUENCIES)
        v = _cc_bounded(vid, CC_CPU_VIDS)
        if f is None or v is None:
            return {"ok": False, "error": "Unsupported CPU frequency or voltage."}
        return await self._cc_operation("cpu-detect", str(f), str(v), timeout=920)

    async def cc_cpu_scale(self, frequency, scale) -> dict:
        f = _cc_bounded(frequency, CC_CPU_FREQUENCIES)
        sc = _cc_bounded(scale, CC_CPU_SCALES)
        if f is None or sc is None:
            return {"ok": False, "error": "Unsupported CPU frequency or scale."}
        return await self._cc_operation("cpu-scale", str(f), str(sc), timeout=200)

    async def cc_cpu_service(self, action: str) -> dict:
        if action not in ("install", "remove"):
            return {"ok": False, "error": "Unsupported CPU service action."}
        return await self._cc_operation("cpu-service", action, timeout=180 if action == "install" else 90)

    async def _cc_install_info(self) -> dict:
        s = _cc_install_state
        supported = _cc_install_supported()
        if supported and not s["checked"] and s["phase"] == "idle":
            s["checked"] = True
            if await asyncio.to_thread(_cc_install_staged_blocking):
                s["phase"] = "staged"
        return {"supported": supported, "phase": s["phase"], "error": s["error"],
                "version": CC_RPM_VERSION}

    async def cc_install(self) -> dict:
        """Installe le RPM figé du Control Center (Bazzite) ; l'onglet suit la phase."""
        if _cc_helper_trusted():
            return {"ok": False, "error": "BC250 Control Center is already installed."}
        if not _cc_install_supported():
            return {"ok": False, "error": "Automatic install needs an rpm-ostree system such as Bazzite."}
        if _cc_install_state["phase"] in ("running", "staged"):
            return {"ok": True}
        _cc_install_state.update(phase="running", error=None)
        _cc_install_state["task"] = asyncio.create_task(asyncio.to_thread(_cc_install_blocking))
        return {"ok": True}

    async def _cc_retire_duplicate_cu_boot(self):
        st = await self.cc_status()
        if st.get("ok") is not False and st.get("cu_service_enabled"):
            await asyncio.to_thread(_retire_toolkit_cu_service)

    async def _cc_cu_snapshot(self) -> dict | None:
        """Statut CU vu par le Control Center, au format de get_cu_status."""
        if not _cc_helper_trusted():
            return None
        st = await self.cc_status(max_age=CC_STATUS_MAX_AGE)
        masks = st.get("cu_masks")
        if st.get("ok") is False or not isinstance(masks, list) or len(masks) != 4:
            return None  # helper indisponible → lecture umr du Toolkit
        live = [int(m) & 0x1f for m in masks]
        saved = st.get("cu_saved_masks")
        boot = ([int(m) & 0x1f for m in saved]
                if isinstance(saved, list) and len(saved) == 4 and st.get("cu_service_enabled") else None)
        return {
            "umr_available": bool(st.get("cu_backend_ready", True)),
            "current_profile": _identify_profile(live),
            "cu_count": st.get("cu_active_cus") or _masks_cu_count(live),
            "boot_profile": _identify_profile(boot) if boot else None,
            "boot_cu": _masks_cu_count(boot) if boot else None,
            "profiles": {name: {"label": p["label"], "cu": p["cu"]} for name, p in CU_PROFILES.items()},
            "source": "control_center",
        }

    async def get_cu_status(self) -> dict:
        """Retourne le statut CU actuel."""
        cc = await self._cc_cu_snapshot()
        if cc is not None:
            return cc
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
        try:
            cache_age = time.time() - CU_LIVE_CACHE.stat().st_mtime
        except OSError:
            cache_age = None
        # Relecture aussi quand le cache vieillit : un autre outil (Control Center,
        # terminal) peut avoir changé les CU sans passer par nous.
        need_read = (result["cu_count"] is None or result["cu_count"] == 0
                     or (cache_age is not None and cache_age > 60))
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

        if _cc_helper_trusted():
            # Le Control Center est la source de vérité : on écrit par lui, jamais à côté.
            masks = list(CU_PROFILES[profile]["masks"])
            r = await (self.cc_cu_save(masks) if save_boot else self.cc_cu_table(masks))
            if r.get("ok") is False:
                return {"ok": False, "error": r.get("error") or "BC250 Control Center refused the CU table."}
            out = {"ok": True, "profile": profile, "cu_count": CU_PROFILES[profile]["cu"],
                   "source": "control_center"}
            if save_boot:
                st = await self.cc_status()
                if st.get("cu_service_installed"):
                    out["boot_saved"] = True
                else:
                    svc = await self.cc_cu_service("install")
                    out["boot_saved"] = svc.get("ok") is not False
                    if not out["boot_saved"]:
                        out["boot_error"] = svc.get("error")
            try:
                CU_LIVE_CACHE.write_text(json.dumps({"cu_count": out["cu_count"], "current_profile": profile}))
            except Exception:
                pass
            return out

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
        # État du service de boot : lu ici pour que l'interface n'ait qu'un appel.
        try:
            r2 = subprocess.run(
                ["systemctl", "is-enabled", f"{CORE_SERVICE_NAME}.service"],
                capture_output=True, text=True, timeout=5)
            data["boot_enabled"] = r2.stdout.strip() == "enabled"
        except Exception:
            data["boot_enabled"] = False
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

    # ── Persistance du déverrouillage CPU au boot ─────────────────────────────
    # Les CU se pokent à chaud : un service au boot suffit. Les cœurs, NON — le
    # masque de présence n'est lu qu'à l'init du CPU, donc les 2 cœurs
    # n'apparaissent qu'au redémarrage SUIVANT. Le service écrit donc le masque
    # puis redémarre UNE fois, et seulement quand c'est nécessaire : le masque
    # survit aux redémarrages à chaud, seule une coupure secteur le remet à 0x77.
    # En pratique, ce redémarrage supplémentaire n'a lieu qu'après un démarrage
    # à froid. La persistance sans ce coût existe : le BIOS modifié « -T ».
    #
    # Garde-fous, parce qu'un service qui redémarre la machine au boot est ce
    # qu'on peut écrire de plus dangereux :
    #   - 2 tentatives au maximum, comptées dans un fichier d'état persistant,
    #     puis abandon définitif (pas de boucle de redémarrage) ;
    #   - `bc250.nocoreunlock` sur la ligne de commande du noyau désarme tout,
    #     ce qui donne une porte de sortie sans système démarré.

    def _core_boot_script(self) -> str:
        return f"""#!/usr/bin/bash
# BC-250 : rétablit le masque 8C/16T au démarrage — BC250-Toolkit-Decky
# Écrit par le plugin. Voir les garde-fous dans main.py (_core_boot_script).
set -u
STATE={CORE_STATE_DIR}
LIB={CORE_LIB_DIR}
STATUS="$LIB/bc250-core-status.py"
UNLOCK="$LIB/bc250-unlock-cores.py"
MAX_ATTEMPTS=2

log() {{ printf 'bc250-core-boot: %s\n' "$*"; }}
field() {{ printf '%s' "$JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('$1'))" 2>/dev/null; }}

if grep -qw 'bc250.nocoreunlock' /proc/cmdline 2>/dev/null; then
    log "désarmé par bc250.nocoreunlock sur la ligne de commande du noyau"
    exit 0
fi

mkdir -p "$STATE"
attempts=$(cat "$STATE/attempts" 2>/dev/null || echo 0)
case "$attempts" in ''|*[!0-9]*) attempts=0 ;; esac

JSON=$(python3 "$STATUS" 2>/dev/null | tail -1)
if [ -z "$JSON" ]; then
    log "sonde de statut muette — abandon (aucun redémarrage)"
    exit 0
fi

cores=$(field cores)
eligible=$(field eligible)
unlocked=$(field already_unlocked)
case "$cores" in ''|*[!0-9]*) cores=0 ;; esac

if [ "$cores" -ge 8 ]; then
    log "$cores cœurs déjà actifs — rien à faire"
    rm -f "$STATE/attempts"
    exit 0
fi
if [ "$eligible" != "True" ] && [ "$unlocked" != "True" ]; then
    log "masque inattendu — cette carte n'est pas concernée"
    exit 0
fi
if [ "$attempts" -ge "$MAX_ATTEMPTS" ]; then
    log "$attempts tentatives sans succès — abandon définitif ; désactiver le"
    log "service depuis le Toolkit, ou flasher le BIOS -T pour une vraie persistance"
    exit 0
fi

gov=$(printf '%s' "$JSON" | python3 -c "import json,sys; g=json.load(sys.stdin).get('governor') or {{}}; print(g.get('unit') or '')" 2>/dev/null)

if [ "$unlocked" = "True" ]; then
    log "masque déjà à 0xFF mais seulement $cores cœurs — redémarrage pour l'appliquer"
else
    # Le gouverneur SMU se dispute la boîte aux lettres : on l'arrête le temps
    # de l'écriture et on le remet quoi qu'il arrive.
    [ -n "$gov" ] && systemctl stop "$gov.service" 2>/dev/null
    python3 "$UNLOCK" >/dev/null 2>&1
    rc=$?
    [ -n "$gov" ] && systemctl start "$gov.service" 2>/dev/null
    if [ "$rc" -ne 0 ]; then
        log "écriture du masque en échec (code $rc) — aucun redémarrage"
        exit 1
    fi
    log "masque écrit"
fi

echo $((attempts + 1)) > "$STATE/attempts"
log "redémarrage pour activer les 8 cœurs / 16 threads"
# Un inhibiteur « block » peut refuser le redémarrage en plein démarrage : vécu
# le 13/09 après une coupure de courant (« Operation denied due to active block
# inhibitor »), la machine est restée en 6C/12T et la tentative était comptée
# pour rien. On réessaie 30 s en journalisant qui bloque, puis on passe outre :
# rien d'irréversible ne s'écrit au démarrage (rpm-ostree finalise un
# déploiement à l'ARRÊT), et un service oneshot n'a pas de délai de démarrage.
for i in 1 2 3 4 5 6; do
    systemctl reboot && exit 0
    log "redémarrage refusé (essai $i/6) — inhibiteurs actifs :"
    systemd-inhibit --list --no-legend --no-pager 2>/dev/null | while read -r l; do log "  $l"; done
    sleep 5
done
log "toujours refusé après 30 s — redémarrage en ignorant les inhibiteurs"
systemctl reboot --check-inhibitors=no && exit 0
# Aucun redémarrage n'a eu lieu : cette tentative ne compte pas.
echo "$attempts" > "$STATE/attempts"
log "redémarrage impossible — tentative non comptée"
exit 1
"""

    def _refresh_core_boot_script(self) -> None:
        """Réécrit le script de boot installé s'il vient d'une version précédente.

        Il n'est écrit qu'à l'activation de l'interrupteur : sans ça, une
        machine qui l'a activé garderait l'ancien script — et ses défauts —
        malgré la mise à jour du plugin."""
        try:
            if not CORE_BOOT_SCRIPT.exists():
                return
            want = self._core_boot_script()
            if CORE_BOOT_SCRIPT.read_text() == want:
                return
            r = subprocess.run(["sudo", "tee", str(CORE_BOOT_SCRIPT)],
                               input=want, text=True, capture_output=True, timeout=10)
            if r.returncode != 0:
                print(f"[BC250 core] mise à jour du script de boot KO: {r.stderr.strip()}")
                return
            print("[BC250 core] script de boot mis à jour vers la version du plugin")
        except Exception as e:
            print(f"[BC250 core] mise à jour du script de boot KO: {e!r}")

    def _write_core_boot_service(self) -> tuple[bool, str]:
        """Installe le script de boot + le service, activés au démarrage."""
        status_src = self._core_tool("bc250-core-status.py")
        unlock_src = self._core_tool("upstream/bc250-unlock-cores.py")
        if not status_src.exists() or not unlock_src.exists():
            return False, "scripts de déverrouillage introuvables"

        # Les scripts sont RECOPIÉS hors du dossier du plugin : Decky réécrit ce
        # dossier à chaque mise à jour, et un service du système ne doit pas
        # dépendre d'un chemin que Decky peut effacer entre deux démarrages.
        r = subprocess.run(["sudo", "mkdir", "-p", str(CORE_LIB_DIR)],
                           capture_output=True, timeout=10)
        if r.returncode != 0:
            return False, f"mkdir {CORE_LIB_DIR}: {r.stderr.decode().strip()}"
        for src, name in ((status_src, "bc250-core-status.py"),
                          (unlock_src, "bc250-unlock-cores.py")):
            r = subprocess.run(["sudo", "tee", str(CORE_LIB_DIR / name)],
                               input=src.read_text(), text=True,
                               capture_output=True, timeout=10)
            if r.returncode != 0:
                return False, f"tee {name}: {r.stderr.strip()}"

        r = subprocess.run(["sudo", "tee", str(CORE_BOOT_SCRIPT)],
                           input=self._core_boot_script(), text=True,
                           capture_output=True, timeout=10)
        if r.returncode != 0:
            return False, f"tee script de boot: {r.stderr.strip()}"
        subprocess.run(["sudo", "chmod", "755", str(CORE_BOOT_SCRIPT)],
                       capture_output=True, timeout=5)

        service = "\n".join([
            "[Unit]",
            "Description=BC-250 8C/16T core unlock at boot",
            "After=basic.target",
            # Le redémarrage éventuel doit tomber AVANT la session graphique,
            # sinon l'utilisateur le prend en pleine figure dans Steam.
            "Before=display-manager.service graphical.target",
            "",
            "[Service]",
            "Type=oneshot",
            f"ExecStart={CORE_BOOT_SCRIPT}",
            "RemainAfterExit=yes",
            "",
            "[Install]",
            "WantedBy=multi-user.target",
        ]) + "\n"
        r = subprocess.run(["sudo", "tee", str(CORE_SERVICE_PATH)],
                           input=service, text=True, capture_output=True, timeout=10)
        if r.returncode != 0:
            return False, f"tee service: {r.stderr.strip()}"

        subprocess.run(["sudo", "systemctl", "daemon-reload"],
                       capture_output=True, timeout=10)
        r = subprocess.run(
            ["sudo", "systemctl", "enable", f"{CORE_SERVICE_NAME}.service"],
            capture_output=True, timeout=10)
        if r.returncode != 0:
            return False, f"systemctl enable: {r.stderr.decode().strip()}"
        return True, "ok"

    async def set_cpu_unlock_boot(self, enabled: bool) -> dict:
        """Active ou désactive le rétablissement des 8 cœurs au démarrage."""
        loop = asyncio.get_event_loop()
        if not enabled:
            def _disable():
                subprocess.run(
                    ["sudo", "systemctl", "disable",
                     f"{CORE_SERVICE_NAME}.service"],
                    capture_output=True, timeout=10)
                # Le compteur de tentatives repart à zéro : une réactivation
                # ultérieure ne doit pas hériter d'un abandon précédent.
                subprocess.run(["sudo", "rm", "-f",
                                str(CORE_STATE_DIR / "attempts")],
                               capture_output=True, timeout=5)
            await loop.run_in_executor(None, _disable)
            return {"ok": True, "boot_enabled": False}

        status = await self.get_cpu_unlock_status()
        if not status.get("ok"):
            return status
        if not status.get("eligible") and not status.get("already_unlocked"):
            return {"ok": False,
                    "error": status.get("error") or "carte non éligible"}
        ok, err = await loop.run_in_executor(None, self._write_core_boot_service)
        if not ok:
            return {"ok": False, "error": err}
        return {"ok": True, "boot_enabled": True}

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
