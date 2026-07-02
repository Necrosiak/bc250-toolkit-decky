"""bios_uma.py — BC250 Toolkit

Lecture/écriture de la variable NVRAM UEFI du BIOS AMI Aptio du BC-250 pour
changer UMA Mode / UMA Frame Buffer Size sans repasser par l'écran BIOS.

CONTRAIREMENT au CU-unlock (registres GPU pokés à chaud via umr), ce module
touche une réservation mémoire décidée AU POST, avant même que Linux démarre.
Le changement n'est donc appliqué qu'au PROCHAIN redémarrage — on ne fait ici
que patcher la variable EFI que le firmware relira à ce moment-là.

DÉCOUVERTES machine réelle (dump BIOS P3.00 du 2026-07-01, IFR VarStore 0x5000) :
  - La variable n'est PAS "Setup" mais **"AmdSetup"**
    (GUID 3A997502-647A-4C82-998E-52EF9486A247, taille data 2229 = 0x8B5).
  - "UMA Mode"              : offset 0x25E, 1 octet.
      Auto=0x0F (défaut), UMA_SPECIFIED=0x01, UMA_AUTO=0x02.
  - "UMA Frame buffer Size" : offset 0x25F, **4 octets little-endian = nb de Mo**
      (PAS un octet indexé). Auto=0xFFFFFFFF, 2G=2048, 4G=4096, 8G=8192, ...

Sécurité — verrous cumulatifs avant tout patch :
  1. bios_version (/sys/class/dmi/id/bios_version) ∈ BIOS_PROFILES (whitelist).
  2. La variable cible existe ET sa taille de data == var_size attendu du profil
     (un rebuild BIOS qui déplacerait les offsets changerait quasi certainement
     cette taille — garde-fou principal, robuste aux valeurs CBS volatiles).
  3. setup_layout_md5 (optionnel) : si renseigné, on LOGGUE un avertissement
     quand l'empreinte diffère, mais on NE BLOQUE PAS dessus (AmdSetup contient
     des valeurs AGESA/CBS qui changent légitimement entre boots).
  4. Sauvegarde brute de la variable écrite sur disque avant tout write, +
     vérification stricte que la taille finale == taille d'origine.
"""

from __future__ import annotations

import hashlib
import struct
import subprocess
import time
from pathlib import Path

EFIVARS_DIR = Path("/sys/firmware/efi/efivars")
DMI_VERSION_FILE = Path("/sys/class/dmi/id/bios_version")
DMI_DATE_FILE = Path("/sys/class/dmi/id/bios_date")

DEFAULT_BACKUP_DIR = Path.home() / ".local/share/bc250-toolkit/bios_backups"


# ─────────────────────────────────────────────────────────────────────────────
# Table de profils BIOS connus — extraits d'un dump réel via
# tools/extract_uma_offsets.sh / find_uma.sh (IFR du VarStore de setup).
# ─────────────────────────────────────────────────────────────────────────────
#
# var_glob      : motif de la variable efivars qui porte le VarStore ("AmdSetup-*").
# var_size      : taille ATTENDUE des données (sans les 4 octets d'attributs EFI).
# <champ>.offset: offset en octets DANS les données de la variable.
# <champ>.width : largeur en octets (1 ou 4), écriture little-endian.
# <champ>.values: mapping "libellé humain" -> entier à écrire.
#
# Valeurs Frame Buffer volontairement PLAFONNÉES À 8G (au-delà = trop peu de RAM
# système sur 16 Go partagés). Le firmware supporte jusqu'à 12G si besoin un jour.

BIOS_PROFILES: dict = {
    "P3.00": {
        "label": "BC-250 modded chipset menu P3.00",
        "var_glob": "AmdSetup-*",
        "var_size": 2229,  # 0x8B5
        "setup_layout_md5": "51199c85841c8ca89f70fc2546b90681",  # informatif (non bloquant)
        "uma_mode": {
            "offset": 0x25E,
            "width": 1,
            "values": {
                "Auto": 0x0F,
                "Specified": 0x01,   # "UMA_SPECIFIED" — requis pour appliquer une taille fixe
                "UMA_Auto": 0x02,
            },
        },
        "uma_frame_buffer": {
            "offset": 0x25F,
            "width": 4,              # little-endian, valeur = nb de Mo
            "values": {
                "Auto": 0xFFFFFFFF,
                "2G": 2048,
                "4G": 4096,
                "8G": 8192,
            },
        },
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# BIOS version / matching
# ─────────────────────────────────────────────────────────────────────────────

def get_bios_version() -> str | None:
    try:
        return DMI_VERSION_FILE.read_text().strip()
    except Exception:
        return None


def get_bios_date() -> str | None:
    try:
        return DMI_DATE_FILE.read_text().strip()
    except Exception:
        return None


def get_profile(version: str | None = None) -> dict | None:
    version = version or get_bios_version()
    if not version:
        return None
    return BIOS_PROFILES.get(version)


def is_profile_ready(version: str | None = None) -> bool:
    """True si le profil existe et que tous ses champs UMA ont offset+width+values."""
    p = get_profile(version)
    if not p or not p.get("var_glob") or not p.get("var_size"):
        return False
    for key in ("uma_mode", "uma_frame_buffer"):
        entry = p.get(key) or {}
        if entry.get("offset") is None or not entry.get("width") or not entry.get("values"):
            return False
    return True


# ─────────────────────────────────────────────────────────────────────────────
# Accès à la variable EFI cible (AmdSetup sur le BC-250)
# ─────────────────────────────────────────────────────────────────────────────

def find_setup_variable(version: str | None = None) -> Path | None:
    """Localise la variable efivars du profil (ex: AmdSetup-<GUID>)."""
    if not EFIVARS_DIR.is_dir():
        return None
    p = get_profile(version)
    glob = (p or {}).get("var_glob", "AmdSetup-*")
    candidates = sorted(EFIVARS_DIR.glob(glob))
    if not candidates:  # repli tolérant
        candidates = sorted(EFIVARS_DIR.glob("AmdSetup-*")) or sorted(EFIVARS_DIR.glob("Setup-*"))
    return candidates[0] if candidates else None


def read_setup_raw(version: str | None = None) -> bytes | None:
    p = find_setup_variable(version)
    if not p:
        return None
    try:
        return p.read_bytes()
    except PermissionError:
        try:
            r = subprocess.run(["sudo", "-n", "cat", str(p)], capture_output=True, timeout=5)
            return r.stdout if r.returncode == 0 else None
        except Exception:
            return None


def read_setup_data(version: str | None = None) -> bytes | None:
    """Données SANS le header d'attributs EFI (4 octets little-endian)."""
    raw = read_setup_raw(version)
    return raw[4:] if raw else None


def compute_layout_fingerprint(patch_ranges: list[tuple[int, int]], version: str | None = None) -> str | None:
    """MD5 de la variable actuelle, octets aux plages cibles (offset,width) mis à 0."""
    data = read_setup_data(version)
    if data is None:
        return None
    masked = bytearray(data)
    for off, width in patch_ranges:
        for i in range(off, off + width):
            if 0 <= i < len(masked):
                masked[i] = 0
    return hashlib.md5(bytes(masked)).hexdigest()


def check_layout(version: str | None = None) -> tuple[bool, str]:
    """Garde-fou principal : profil connu + variable présente + TAILLE exacte.
    L'empreinte MD5 n'est qu'informative (non bloquante)."""
    p = get_profile(version)
    if not p:
        return False, f"Profil BIOS inconnu (version détectée: {get_bios_version()})"
    data = read_setup_data(version)
    if data is None:
        return False, "Impossible de lire la variable Setup EFI (efivarfs absent ?)"
    if len(data) != p["var_size"]:
        return False, (
            f"Taille de variable inattendue ({len(data)} vs {p['var_size']} attendus) "
            f"— BIOS possiblement rebuild différent. Refus par sécurité."
        )
    # borne : les offsets doivent tenir dans la variable
    for key in ("uma_mode", "uma_frame_buffer"):
        f = p[key]
        if f["offset"] + f["width"] > len(data):
            return False, f"Offset {key} hors limites — profil incohérent."
    return True, "ok"


# ─────────────────────────────────────────────────────────────────────────────
# Backup + écriture
# ─────────────────────────────────────────────────────────────────────────────

def backup_setup_variable(backup_dir: Path = DEFAULT_BACKUP_DIR, version: str | None = None) -> Path | None:
    raw = read_setup_raw(version)
    if raw is None:
        return None
    backup_dir.mkdir(parents=True, exist_ok=True)
    dest = backup_dir / f"AmdSetup_{int(time.time())}.bin"
    dest.write_bytes(raw)
    return dest


def _set_immutable(path: Path, immutable: bool) -> None:
    subprocess.run(["chattr", "+i" if immutable else "-i", str(path)], capture_output=True, timeout=5)


def write_setup_data(new_data: bytes, version: str | None = None) -> tuple[bool, str]:
    """Réécrit les données de la variable en conservant les 4 octets d'attributs.
    Refuse si la taille ne correspond pas exactement (protection anti-brick)."""
    p = find_setup_variable(version)
    if not p:
        return False, "Variable Setup introuvable sous /sys/firmware/efi/efivars"
    raw = read_setup_raw(version)
    if raw is None:
        return False, "Lecture de la variable Setup impossible"

    attrs, current_data = raw[:4], raw[4:]
    if len(new_data) != len(current_data):
        return False, f"Taille invalide ({len(new_data)} vs {len(current_data)}) — écriture refusée"

    payload = attrs + new_data
    try:
        _set_immutable(p, False)
        p.write_bytes(payload)
        return True, "ok"
    except PermissionError:
        try:
            r = subprocess.run(["sudo", "-n", "tee", str(p)], input=payload,
                                capture_output=True, timeout=10)
            return (r.returncode == 0), (r.stderr.decode(errors="replace") if r.returncode else "ok")
        except Exception as e:
            return False, str(e)
    except Exception as e:
        return False, str(e)
    finally:
        _set_immutable(p, True)


def _encode(value: int, width: int) -> bytes:
    return struct.pack("<I", value & 0xFFFFFFFF) if width == 4 else bytes([value & 0xFF])


def _apply_field(field_key: str, label: str, backup_dir: Path) -> dict:
    version = get_bios_version()
    if not is_profile_ready(version):
        return {"ok": False, "error": f"Profil '{version}' non prêt (offsets non extraits)"}
    ok, msg = check_layout(version)
    if not ok:
        return {"ok": False, "error": msg}

    field = get_profile(version)[field_key]
    if label not in field["values"]:
        return {"ok": False, "error": f"Valeur '{label}' inconnue. Options: {list(field['values'])}"}

    data = bytearray(read_setup_data(version))
    off, width = field["offset"], field["width"]
    if off + width > len(data):
        return {"ok": False, "error": "Offset hors limites — profil corrompu"}

    backup = backup_setup_variable(backup_dir, version)
    if backup is None:
        return {"ok": False, "error": "Échec de la sauvegarde préalable — écriture annulée"}

    data[off:off + width] = _encode(field["values"][label], width)
    ok, msg = write_setup_data(bytes(data), version)
    if not ok:
        return {"ok": False, "error": f"Écriture échouée: {msg}", "backup": str(backup)}
    return {"ok": True, "applied": label, "reboot_required": True, "backup": str(backup)}


# ─────────────────────────────────────────────────────────────────────────────
# API haut niveau
# ─────────────────────────────────────────────────────────────────────────────

def _decode_current() -> dict:
    """Lit les valeurs UMA actuellement stockées dans la variable (libellé si connu)."""
    version = get_bios_version()
    p = get_profile(version)
    data = read_setup_data(version)
    out = {}
    if not p or data is None:
        return out
    for key in ("uma_mode", "uma_frame_buffer"):
        f = p.get(key) or {}
        if f.get("offset") is None or f["offset"] + f["width"] > len(data):
            continue
        raw = data[f["offset"]:f["offset"] + f["width"]]
        val = struct.unpack("<I", raw)[0] if f["width"] == 4 else raw[0]
        label = next((k for k, v in f["values"].items() if v == val), f"0x{val:X}")
        out[key] = {"value": val, "label": label}
    return out


def get_status() -> dict:
    version = get_bios_version()
    ready = is_profile_ready(version)
    ok_layout, layout_msg = (False, "profil non prêt") if not ready else check_layout(version)
    prof = get_profile(version) or {}
    return {
        "bios_version": version,
        "bios_date": get_bios_date(),
        "profile_known": version in BIOS_PROFILES,
        "profile_ready": ready,
        "setup_variable_found": find_setup_variable(version) is not None,
        "layout_ok": ok_layout,
        "layout_detail": layout_msg,
        "current": _decode_current(),
        "uma_mode_options": list(prof.get("uma_mode", {}).get("values", {}).keys()),
        "uma_frame_buffer_options": list(prof.get("uma_frame_buffer", {}).get("values", {}).keys()),
    }


def set_uma_frame_buffer(label: str, backup_dir: Path = DEFAULT_BACKUP_DIR) -> dict:
    """Patch UMA Frame Buffer Size. Force aussi UMA Mode=Specified pour que la
    taille fixe soit prise en compte ; Auto remet le mode au défaut firmware
    (0x0F) pour retrouver exactement l'état d'usine."""
    _apply_field("uma_mode", "Specified" if label != "Auto" else "Auto", backup_dir)  # best-effort
    return _apply_field("uma_frame_buffer", label, backup_dir)


def set_uma_mode(label: str, backup_dir: Path = DEFAULT_BACKUP_DIR) -> dict:
    return _apply_field("uma_mode", label, backup_dir)


def restore_backup(backup_path: Path) -> dict:
    p = find_setup_variable()
    if not p:
        return {"ok": False, "error": "Variable Setup introuvable"}
    if not backup_path.exists():
        return {"ok": False, "error": f"Backup introuvable: {backup_path}"}
    raw = backup_path.read_bytes()
    try:
        _set_immutable(p, False)
        p.write_bytes(raw)
        return {"ok": True, "reboot_required": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        _set_immutable(p, True)
