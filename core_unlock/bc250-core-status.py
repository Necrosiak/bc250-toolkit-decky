#!/usr/bin/env python3
"""Statut du déverrouillage des 2 cœurs CPU désactivés du BC-250 (LECTURE SEULE).

Sort un JSON sur stdout. N'écrit JAMAIS le masque — le déverrouillage lui-même
est délégué au script upstream de rw-r-r-0644 (tools/bc250-core-unlock/,
MIT), qu'on garde intact.

Portable à toutes les distributions Linux qui font tourner un BC-250 : rien
n'est supposé du système de fichiers, du gestionnaire de paquets ni du nom du
service gouverneur SMU — tout est détecté.
"""
import json
import os
import struct
import subprocess
import sys

# Masque de présence des cœurs, adresse SMN. 0x77 = 6 cœurs sur 8 activés.
MASK_REG = 0x0115A870
PCI_CFG = "/sys/bus/pci/devices/0000:00:00.0/config"
SMN_INDEX, SMN_DATA = 0xB8, 0xBC

# Le gouverneur SMU se dispute la fenêtre SMN avec nous. Son nom d'unité varie
# selon la distribution et le paquet installé — on essaie les noms connus, puis
# on balaie les unités dont le nom évoque un gouverneur pour cet APU.
GOVERNOR_CANDIDATES = (
    "cyan-skillfish-governor-smu",
    "cyan-skillfish-governor",
    "oberon-governor",
    "bc250-governor",
)


def cpu_topology():
    """(cœurs, threads) depuis /proc/cpuinfo — présent sur toute distro."""
    pairs, threads = set(), 0
    phys = core = None
    try:
        lines = open("/proc/cpuinfo").read().splitlines()
    except OSError:
        return None, None
    for line in lines + [""]:
        key, _, val = line.partition(":")
        key, val = key.strip(), val.strip()
        if key == "processor":
            threads += 1
        elif key == "physical id":
            phys = val
        elif key == "core id":
            core = val
        elif not key:
            if core is not None:
                pairs.add((phys, core))
            phys = core = None
    return (len(pairs) or None), (threads or None)


def is_bc250():
    """Reconnaît la carte sans dépendre de dmidecode (souvent absent)."""
    for path in ("/sys/class/dmi/id/board_name", "/sys/class/dmi/id/product_name"):
        try:
            if "bc-250" in open(path).read().strip().lower():
                return True
        except OSError:
            pass
    try:
        for line in open("/proc/cpuinfo"):
            if line.lower().startswith("model name") and "bc-250" in line.lower():
                return True
    except OSError:
        pass
    return False


def find_governor():
    """(nom_unité, actif) du gouverneur SMU, ou (None, False) s'il n'y en a pas."""
    if not _have("systemctl"):
        return None, False
    names = list(GOVERNOR_CANDIDATES)
    try:
        out = subprocess.run(
            ["systemctl", "list-unit-files", "--type=service", "--no-legend",
             "--no-pager"],
            capture_output=True, text=True, timeout=5).stdout
        for line in out.splitlines():
            unit = line.split()[0] if line.split() else ""
            base = unit[:-8] if unit.endswith(".service") else unit
            low = base.lower()
            if base and base not in names and "governor" in low and (
                    "skillfish" in low or "oberon" in low or "bc250" in low
                    or "bc-250" in low):
                names.append(base)
    except Exception:
        pass
    for name in names:
        try:
            r = subprocess.run(["systemctl", "is-active", name + ".service"],
                               capture_output=True, text=True, timeout=5)
            state = r.stdout.strip()
            # "inactive"/"failed" = l'unité EXISTE mais ne tourne pas ;
            # "unknown"/vide = elle n'existe pas du tout.
            if state and state != "unknown":
                return name, state == "active"
        except Exception:
            continue
    return None, False


def _have(prog):
    return any(os.access(os.path.join(p, prog), os.X_OK)
               for p in os.environ.get("PATH", "/usr/bin:/bin").split(os.pathsep))


def read_mask():
    """Lit le masque. Trois lectures concordantes exigées.

    Le gouverneur SMU utilise la MÊME fenêtre SMN (index 0xB8 / donnée 0xBC) :
    une lecture prise au milieu d'une de ses transactions rend une valeur d'un
    autre registre. On ne se fie donc qu'à une valeur stable sur trois passes.
    """
    try:
        fd = os.open(PCI_CFG, os.O_RDWR)
    except OSError as e:
        return None, f"accès PCI impossible ({e.strerror}) — privilèges root requis"
    try:
        seen = []
        for _ in range(3):
            os.pwrite(fd, struct.pack("<I", MASK_REG), SMN_INDEX)
            seen.append(struct.unpack("<I", os.pread(fd, 4, SMN_DATA))[0])
        if len(set(seen)) != 1:
            return None, ("lectures incohérentes %s — le gouverneur SMU utilise "
                          "la même fenêtre, réessayer" % [hex(v) for v in seen])
        return seen[0], None
    except OSError as e:
        return None, f"lecture SMN impossible ({e.strerror})"
    finally:
        os.close(fd)


def main():
    cores, threads = cpu_topology()
    out = {
        "board_is_bc250": is_bc250(),
        "cores": cores,
        "threads": threads,
        "mask": None,
        "eligible": False,
        "already_unlocked": False,
        "error": None,
    }
    gov_name, gov_active = find_governor()
    out["governor"] = {"unit": gov_name, "active": gov_active}

    if not out["board_is_bc250"]:
        out["error"] = "carte non reconnue comme un BC-250"
        print(json.dumps(out))
        return 0

    mask, err = read_mask()
    if err:
        out["error"] = err
        print(json.dumps(out))
        return 0

    low = mask & 0xFF
    out["mask"] = "0x%02X" % low
    out["already_unlocked"] = low == 0xFF
    # UNIQUEMENT 0x77. Un masque asymétrique ressemble à du vrai tri de défauts
    # d'usine, et la primitive SMU écrit 0xFF sans distinction — activer en
    # aveugle y serait un bien plus mauvais pari. Décision de l'upstream, qu'on
    # ne contourne pas.
    out["eligible"] = low == 0x77
    if not out["eligible"] and not out["already_unlocked"]:
        out["error"] = ("masque 0x%02X inattendu (0x77 attendu) — cette carte "
                        "n'est pas concernée" % low)
    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
