import asyncio
import json
import os
import subprocess
import urllib.request
import urllib.error
from pathlib import Path
import vdf as _vdf

GAMES_DB_URL = "https://raw.githubusercontent.com/Necrosiak/bc250-toolkit-decky/main/games_db.json"
LOCAL_DB_PATH = Path(os.path.dirname(__file__)) / "games_db.json"
CACHE_DB_PATH = Path("/tmp/bc250_games_db_cache.json")
TWEAKS_APPLY = "/opt/bc250-tweaks/apply.sh"
TWEAKS_UPDATE = "/opt/bc250-tweaks/update.sh"

BC250_DATA_DIR = Path.home() / ".local/share/bc250-toolkit"
PENDING_LO_FILE = BC250_DATA_DIR / "pending_launch_options.json"
PRE_STEAM_SCRIPT = BC250_DATA_DIR / "bc250-apply-vdf.py"
STEAM_DROPIN_DIR = Path.home() / ".config/systemd/user/app-steam@autostart.service.d"
STEAM_DROPIN = STEAM_DROPIN_DIR / "bc250-vdf-apply.conf"

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
        self._install_pre_steam_hook()
        await self._load_db()

    def _install_pre_steam_hook(self):
        """Installe ExecStartPre dans le service Steam pour appliquer les VDF pending au démarrage."""
        try:
            BC250_DATA_DIR.mkdir(parents=True, exist_ok=True)
            PRE_STEAM_SCRIPT.write_text(_APPLY_VDF_SCRIPT)
            PRE_STEAM_SCRIPT.chmod(0o755)
            STEAM_DROPIN_DIR.mkdir(parents=True, exist_ok=True)
            STEAM_DROPIN.write_text(f"[Service]\nExecStartPre=-{PRE_STEAM_SCRIPT}\n")
            subprocess.run(["systemctl", "--user", "daemon-reload"],
                           capture_output=True, timeout=5)
        except Exception:
            pass

    async def _unload(self):
        pass

    # ── Games database ───────────────────────────────────────────────────────

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

        # Fallback: cache réseau
        if CACHE_DB_PATH.exists():
            try:
                self._games_db = json.loads(CACHE_DB_PATH.read_text())
                return
            except Exception:
                pass

        # Fallback: DB bundlée avec le plugin
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

    # ── System status ────────────────────────────────────────────────────────

    async def get_system_status(self) -> dict:
        status: dict = {}

        # Températures
        try:
            raw = Path("/sys/class/hwmon")
            for hwmon in raw.iterdir():
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

        # Scheduler SCX
        try:
            scx_state = Path("/sys/kernel/sched_ext/state").read_text().strip()
            status["scx_state"] = scx_state
            if scx_state == "enabled":
                scx_sched = Path("/sys/kernel/sched_ext/root/ops").read_text().strip()
                status["scx_sched"] = scx_sched
        except Exception:
            status["scx_state"] = "unknown"

        # Tuned
        try:
            status["tuned_profile"] = Path("/etc/tuned/active_profile").read_text().strip()
        except Exception:
            status["tuned_profile"] = "unknown"

        # Gamemode daemon actif
        try:
            r = subprocess.run(
                ["systemctl", "--user", "is-active", "gamemoded"],
                capture_output=True, text=True, timeout=2
            )
            status["gamemode_active"] = r.stdout.strip() == "active"
        except Exception:
            status["gamemode_active"] = False

        # bc250-tweaks installé
        status["tweaks_installed"] = os.path.isfile(TWEAKS_APPLY)

        # Date du dernier update des tweaks
        try:
            log = Path("/var/log/bc250-tweaks.log")
            if log.exists():
                lines = log.read_text().splitlines()
                for line in reversed(lines):
                    if "══" in line and "update.sh" in line:
                        status["tweaks_last_update"] = line.strip().lstrip("═ ").replace(" — update.sh", "")
                        break
        except Exception:
            pass

        return status

    # ── Tweaks update ────────────────────────────────────────────────────────

    async def run_tweaks_update(self) -> dict:
        if not os.path.isfile(TWEAKS_UPDATE):
            return {"success": False, "error": "bc250-tweaks non installé dans /opt/bc250-tweaks"}
        try:
            result = subprocess.run(
                ["sudo", TWEAKS_UPDATE],
                capture_output=True, text=True, timeout=120
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

    # ── Steam settings via VDF ───────────────────────────────────────────────

    def _find_steam_userid(self) -> str | None:
        """Trouve l'userid Steam actif depuis loginusers.vdf."""
        try:
            loginusers = Path.home() / ".steam" / "steam" / "config" / "loginusers.vdf"
            data = _vdf.load(open(loginusers))
            users = data.get("users", {})
            # Préférer le MostRecent
            for uid, info in users.items():
                if info.get("MostRecent") == "1":
                    # uid est le SteamID64, on veut le répertoire userdata (SteamID32)
                    steamid64 = int(uid)
                    steamid32 = steamid64 & 0xFFFFFFFF
                    return str(steamid32)
            # Sinon premier trouvé
            for uid in users:
                steamid64 = int(uid)
                return str(steamid64 & 0xFFFFFFFF)
        except Exception:
            pass
        # Fallback: lister userdata/
        try:
            userdata = Path.home() / ".steam" / "steam" / "userdata"
            dirs = [d for d in userdata.iterdir() if d.is_dir() and d.name.isdigit() and d.name != "0"]
            if dirs:
                return dirs[0].name
        except Exception:
            pass
        return None

    async def apply_compat_tool(self, app_id: int, tool_name: str) -> dict:
        """Écrit le compat tool dans config.vdf (CompatToolMapping)."""
        config_path = Path.home() / ".steam" / "steam" / "config" / "config.vdf"
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
        """Écrit les launch options dans localconfig.vdf + fichier pending (ExecStartPre au prochain démarrage Steam)."""
        # Sauvegarde dans le fichier pending — garantit la persistance même si Steam écrase le VDF à sa sortie
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

        # Écriture directe dans le VDF (sera écrasée par Steam à sa fermeture,
        # mais le pending file garantit l'application au prochain démarrage Steam)
        userid = self._find_steam_userid()
        if not userid:
            return {"ok": True, "detail": "pending only — Steam user introuvable"}
        lc_path = Path.home() / ".steam" / "steam" / "userdata" / userid / "config" / "localconfig.vdf"
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
            return {"ok": True, "detail": f"pending only: {str(e)}"}

    # ── DB info ──────────────────────────────────────────────────────────────

    async def get_db_meta(self) -> dict:
        return self._games_db.get("_meta", {})

    async def get_db_game_count(self) -> int:
        return sum(1 for k in self._games_db if not k.startswith("_"))
