# BC250 Toolkit — DeckyLoader Plugin

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Een [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader)-plugin voor de **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) met Bazzite of SteamOS Linux.

Communitydatabase met geoptimaliseerde startopties voor de BC-250 — met één klik toepasbaar vanuit het Steam Quick Access Menu.

---

## Functies

### Tabblad Spellen
- Detecteert automatisch het geselecteerde spel in de Steam-bibliotheek
- Toont aanbevolen instellingen voor de BC-250 (Proton-versie, startopties, opmerkingen)
- **Toepassen-knop** — schrijft startopties en selecteert Proton rechtstreeks via de backend
- **Auto-apply** (opt-in) — past instellingen automatisch toe bij het starten van een bekend spel

### Tabblad CU (Compute Units)
- Live uitlezing van het aantal actieve CU's via GPU SPI-registers
- 4 profielen:
  - **24 CU** (BC-250 standaard)
  - **32 CU**
  - **36 CU**
  - **40 CU** (vol — alle WGP's actief)
- Live toepassing zonder herstart
- Toggle **Opslaan bij opstarten** — installeert een systemd-service die het profiel bij elke start herstelt
- Vereist `umr` — **automatische installatie via een knop** (`rpm-ostree install --apply-live`, geen herstart nodig)
- Ingebouwde waarschuwing en stabiliteitaanbevelingen

### Tabblad Systeem
- CPU/GPU-temperaturen in realtime
- scx_lavd-status, tuned-profiel, gamemode-daemon-status
- Handmatige updateknop voor [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Tabblad Instellingen
- Toggle auto-apply
- DB-verversing vanuit GitHub

---

## Interfacetaal

De plugin detecteert automatisch de Steam-taal:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Installatie

### Via DeckyLoader (aanbevolen)
> Plugin wacht op indiening bij de Decky Plugin Store.

Handmatige installatie in de tussentijd:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Vereisten
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) geïnstalleerd
- Bazzite of SteamOS op BC-250

---

## Spellendatabase

De DB staat in [`games_db.json`](games_db.json) en werkt automatisch bij vanuit GitHub.

### Ondersteunde spellen

| Spel | Proton | Opmerkingen |
|---|---|---|
| Crimson Desert | Proton Experimental (bleeding-edge) | GPU-spoof 731F vereist |
| Cyberpunk 2077 | GE-Proton | RT uitschakelen aanbevolen |
| Elden Ring | GE-Proton | ~60 FPS speelbaar |
| Red Dead Redemption 2 | GE-Proton | Vulkan-modus verplicht |
| Control | GE-Proton | RT werkt (RDNA 1.5) |
| Counter-Strike 2 | Proton Experimental | 100+ FPS |
| Rocket League | Proton Experimental | 120+ FPS |
| Devil May Cry 5 | GE-Proton | ~100 FPS Hoog |
| Company of Heroes 3 | GE-Proton | VRAM-split min. 4 GB vereist |
| Detroit: Become Human | Proton Experimental | Stabiele 60 FPS |
| The Last of Us Part I | GE-Proton | 60 FPS Medium-Hoog |
| Black Myth: Wukong | GE-Proton | Ongewijzigde spelbestanden vereist |
| Stardew Valley | Proton Experimental | Perfect |

### Bekende incompatibele spellen
- **Fortnite** / **Valorant** — kernel-EAC, Linux incompatibel
- **FF VII Rebirth** — controleert GPU-ID, Cyan Skillfish niet herkend, geen oplossing beschikbaar

---

## Bijdragen

### Eenvoudige methode — Webformulier

Gebruik het **[indieningsformulier](https://necrosiak.github.io/bc250-toolkit-decky/)** — vul de gegevens in, klik op Indienen en een GitHub-issue wordt automatisch aangemaakt. Na goedkeuring wordt het spel via PR toegevoegd.

### Ontwikkelaarsmethode — Directe PR

1. Fork dit repository
2. Bewerk `games_db.json` volgens het bestaande formaat
3. Open een Pull Request

### Invoerformaat

```json
"STEAM_APP_ID": {
  "name": "Spelnaam",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "BC-250-specifieke opmerkingen",
  "tested_on": "BC-250"
}
```

> De Steam-AppID staat in de URL van de spelspagina in de Steam Store.

---

## Build (ontwikkelaars)

```bash
pnpm install
pnpm run build

# Lokaal implementeren
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Zie ook

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — volledige systeemtweaks + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — community-wiki
- [bc250.info](https://bc250.info)
