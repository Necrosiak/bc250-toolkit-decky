import asyncio
import json
import os
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

GAMES_DB_URL = "https://raw.githubusercontent.com/Necrosiak/bc250-toolkit-decky/main/games_db.json"
LOCAL_DB_PATH = Path(os.path.dirname(__file__)) / "games_db.json"
CACHE_DB_PATH = Path("/tmp/bc250_games_db_cache.json")
TWEAKS_APPLY = "/opt/bc250-tweaks/apply.sh"
TWEAKS_UPDATE = "/opt/bc250-tweaks/update.sh"


class Plugin:
    async def _main(self):
        self._games_db: dict = {}
        await self._load_db()

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

    # ── DB info ──────────────────────────────────────────────────────────────

    async def get_db_meta(self) -> dict:
        return self._games_db.get("_meta", {})

    async def get_db_game_count(self) -> int:
        return sum(1 for k in self._games_db if not k.startswith("_"))
