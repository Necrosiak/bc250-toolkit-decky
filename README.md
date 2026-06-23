# BC250 Toolkit — Plugin DeckyLoader

Plugin [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) pour l'**ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) sous Bazzite / SteamOS Linux.

**Base de données communautaire** d'options de lancement optimisées pour le BC-250 — applicable en un clic depuis le Quick Access Menu de Steam.

---

## Fonctionnalités

### Onglet Jeux
- Détecte automatiquement le jeu sélectionné dans la bibliothèque Steam
- Affiche les settings recommandés pour le BC-250 (Proton, launch options, notes)
- **Bouton Appliquer** — écrit directement les launch options et sélectionne Proton via l'API Steam
- **Auto-apply** (opt-in) — applique automatiquement les settings au lancement d'un jeu connu

### Onglet CU (Compute Units)
- Lecture live du nombre de CU actifs via les registres SPI du GPU
- 4 profils disponibles :
  - **24 CU** (stock BC-250)
  - **32 CU**
  - **36 CU**
  - **40 CU** (full — tous les WGPs actifs)
- Application live sans reboot
- Toggle **Sauvegarder au boot** — installe un service systemd qui restaure le profil à chaque démarrage
- Requiert `umr` — **installation automatique via un bouton** si non présent (`rpm-ostree install --apply-live`, sans reboot)

### Onglet Système
- Températures CPU/GPU en temps réel
- Statut scx_lavd, profil tuned, gamemode daemon
- Bouton de mise à jour manuelle de [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Onglet Réglages
- Toggle auto-apply
- Rafraîchissement de la DB depuis GitHub

---

## Installation

### Via DeckyLoader (méthode recommandée)
> Plugin en cours de soumission au Decky Plugin Store.

En attendant, installation manuelle :

```bash
# Cloner dans le dossier plugins
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit

# Redémarrer DeckyLoader
sudo systemctl restart plugin_loader
```

### Prérequis
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) installé
- Bazzite ou SteamOS sur BC-250

---

## Base de données des jeux

La DB est dans [`games_db.json`](games_db.json) et se met à jour automatiquement depuis GitHub.

### Jeux référencés

| Jeu | Proton | Notes |
|---|---|---|
| Crimson Desert | Proton Experimental (bleeding-edge) | Spoof GPU 731F requis |
| Cyberpunk 2077 | GE-Proton | RT désactivé recommandé |
| Elden Ring | GE-Proton | ~60 FPS jouable |
| Red Dead Redemption 2 | GE-Proton | Mode Vulkan obligatoire |
| Control | GE-Proton | RT fonctionne (RDNA 1.5) |
| Counter-Strike 2 | Proton Experimental | 100+ FPS |
| Rocket League | Proton Experimental | 120+ FPS |
| Devil May Cry 5 | GE-Proton | ~100 FPS High |
| Company of Heroes 3 | GE-Proton | VRAM split 4 Go min requis |
| Detroit: Become Human | Proton Experimental | 60 FPS stable |
| The Last of Us Part I | GE-Proton | 60 FPS Medium-High |
| Black Myth: Wukong | GE-Proton | Fichiers non modifiés requis |
| Stardew Valley | Proton Experimental | Parfait |

### Jeux incompatibles (connus)
- **Fortnite** / **Valorant** — EAC kernel-level, incompatible Linux
- **FF VII Rebirth** — vérifie l'ID GPU, Cyan Skillfish non reconnu, pas de fix actuellement

---

## Contribuer

La force de ce plugin, c'est la communauté BC-250. Pour ajouter un jeu :

1. Fork ce repo
2. Édite `games_db.json` en suivant le format existant
3. Ouvre une Pull Request

### Format d'une entrée

```json
"APP_ID_STEAM": {
  "name": "Nom du jeu",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "Notes spécifiques BC-250",
  "tested_on": "BC-250"
}
```

> L'AppID Steam se trouve dans l'URL de la page du jeu sur le Steam Store.

---

## Build (développeurs)

```bash
# Prérequis : Node.js + pnpm
pnpm install
pnpm run build

# Déployer localement
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Voir aussi

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks système complets + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki communautaire
- [bc250.info](https://bc250.info)
