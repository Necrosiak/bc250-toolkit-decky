# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Plugin [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) pour l'**ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) sous Bazzite / SteamOS Linux.

Base de données communautaire d'options de lancement optimisées pour le BC-250 — applicable en un clic depuis le Quick Access Menu de Steam.

---

## Captures d'écran

<p align="center">
  <img src="assets/screenshots/tab-games.png" width="32%" alt="Onglet Jeux"/>
  <img src="assets/screenshots/tab-cu.png" width="32%" alt="Onglet CU"/>
  <img src="assets/screenshots/tab-system.png" width="32%" alt="Onglet Système"/>
</p>
<p align="center">
  <img src="assets/screenshots/tab-settings.png" width="32%" alt="Onglet Réglages"/>
  <img src="assets/screenshots/game-crimson-desert.png" width="32%" alt="Settings Crimson Desert"/>
</p>

---

## Fonctionnalités

### Onglet Jeux
- Détecte automatiquement le jeu sélectionné dans la bibliothèque Steam
- Affiche les settings recommandés pour le BC-250 (version Proton, options de lancement, notes, prérequis matériels)
- **Variantes de config** — quand un jeu propose plusieurs profils optimisés (ex. *Stable* vs *Performance*), on en choisit un via un sélecteur ; le choix est mémorisé
- **Bouton Appliquer** — en une action : écrit les launch options, sélectionne le build Proton/GE-Proton, et applique les overrides GPU par jeu (options RADV de `~/.drirc`)
- **Auto-apply** (opt-in) — applique automatiquement la config complète au lancement d'un jeu connu ; l'activer pré-configure aussi tous les jeux installés présents dans la base

### Onglet CU (Compute Units)
- Lecture live du nombre de CU actifs via les registres SPI du GPU
- 4 profils disponibles :
  - **24 CU** (stock BC-250)
  - **32 CU**
  - **36 CU**
  - **40 CU** (full — tous les WGPs actifs)
- Application live sans reboot
- Toggle **Sauvegarder au boot** — installe un service systemd qui restaure le profil à chaque démarrage
- Requiert `umr` — **installation automatique via un bouton** (`rpm-ostree install --apply-live`, sans reboot)
- Avertissement et recommandations de stabilité intégrés

### Onglet Système
- Températures CPU/GPU en temps réel
- Statut scx_lavd, profil tuned, daemon gamemode
- Bouton de mise à jour manuelle de [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Onglet Réglages
- Toggle auto-apply
- Rafraîchissement de la DB depuis GitHub

---

## Langue de l'interface

Le plugin détecte automatiquement la langue de l'interface Steam :

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Installation

### Via DeckyLoader (méthode recommandée)
> Plugin disponible dans le Decky Plugin Store — rechercher **BC250 Toolkit**.

Installation manuelle :

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
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
| Code Vein 2 | GE-Proton | UE5 DX12 — requiert UMA Frame Buffer = Auto (~8G) + fix unified-heap par jeu (auto-appliqué, voir preset ci-dessous) |
| Stardew Valley | Proton Experimental | Parfait |

### Jeux incompatibles (connus)
- **Fortnite** / **Valorant** — EAC kernel-level, incompatible Linux
- **FF VII Rebirth** — vérifie l'ID GPU, Cyan Skillfish non reconnu, pas de fix actuellement

---

## Contribuer

La force de ce plugin, c'est la communauté BC-250.

### Méthode simple — Formulaire web

Utilise le **[formulaire de soumission](https://necrosiak.github.io/bc250-toolkit-decky/)** — remplis les informations, clique sur Soumettre, et une issue GitHub est créée automatiquement. Une fois approuvée, le jeu est ajouté via PR.

### Méthode développeur — PR directe

1. Fork ce repo
2. Édite `games_db.json` en suivant le format existant
3. Ouvre une Pull Request

### Format d'une entrée

Entrée minimale :

```json
"APP_ID_STEAM": {
  "name": "Nom du jeu",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "Notes spécifiques BC-250",
  "tested_on": "BC-250"
}
```

Champs avancés optionnels (le plugin les applique automatiquement au clic sur **Appliquer**) :

- **`compat_tool`** — build Proton/GE-Proton à sélectionner via le compat mapping de Steam
- **`radv`** — overrides Mesa RADV par jeu écrits dans `~/.drirc`, match sur le nom de l'exe, ex. `{"match": "Game-Win64-Shipping.exe", "options": {"radv_enable_unified_heap_on_apu": false}}`
- **`requires`** — prérequis matériels affichés à l'utilisateur (`uma_min_mb`, `gttsize`)
- **`configs`** — tableau de variantes alternatives, chacune avec son `label`, `stability`, `compat_tool`, `launch_options`, `radv`, `requires` ; l'utilisateur en choisit une dans l'onglet Jeux

> L'AppID Steam se trouve dans l'URL de la page du jeu sur le Steam Store.

### Preset réutilisable — UE5 DX12 « out of video memory »

Certains jeux Unreal Engine 5 en DX12 crashent à l'init du rendu (`D3D12Util.cpp:926 — Out of video memory`) **alors qu'il reste plein de VRAM libre**, parce que le unified heap de RADV sur APU masque la VRAM dédiée à VKD3D (`DedicatedVideoMemory ≈ 0`). `games_db.json` embarque un profil réutilisable **`ue5_dx12_oom`** dans `_meta.presets` : désactiver le unified heap pour l'exe du jeu + régler l'**UMA Frame Buffer** du BIOS sur **Auto** (donne déjà ~8 Go sur un BC-250 16 Go — pas besoin de forcer 4G) + GE-Proton pour les codecs vidéo. Pour corriger un nouveau jeu touché, copier le preset dans son entrée et régler `radv.match` sur son exe. Validé d'abord sur **Code Vein 2**.

---

## Build (développeurs)

```bash
pnpm install
pnpm run build

# Déployer localement
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py updater.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Voir aussi

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks système complets + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki communautaire
- [bc250.info](https://bc250.info)
