# BC250 Toolkit — DeckyLoader Plugin

> 🌐 [EN](../README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Een [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader)-plugin voor de **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) met Bazzite, SteamOS Linux of CachyOS.

Communitydatabase met geoptimaliseerde startopties voor de BC-250 — met één klik toepasbaar vanuit het Steam Quick Access Menu.

---

## 📸 Screenshots

<p align="center">
  <img src="../assets/screenshots/toolkit-games.jpg" width="49%" alt="Games tab"/>
  <img src="../assets/screenshots/toolkit-cu.jpg" width="49%" alt="CU/UMA tab"/>
</p>
<p align="center">
  <img src="../assets/screenshots/toolkit-uma.jpg" width="49%" alt="UMA frame buffer"/>
  <img src="../assets/screenshots/toolkit-system.jpg" width="49%" alt="System tab"/>
</p>

## Functies

### Tabblad Spellen
- Detecteert automatisch het geselecteerde spel in de Steam-bibliotheek
- Toont aanbevolen instellingen voor de BC-250 (Proton-versie, startopties, opmerkingen, hardwarevereisten)
- **Configuratievarianten** — wanneer een spel meerdere geoptimaliseerde profielen biedt (bijv. *Stable* vs *Performance*), kies je er één via een selector; je keuze wordt onthouden
- **Toepassen-knop** — schrijft in één actie de startopties, selecteert de Proton/GE-Proton-build en past eventuele GPU-overrides per spel toe (RADV-opties in `~/.drirc`)
- **Auto-apply** (opt-in) — past de volledige configuratie automatisch toe bij het starten van een bekend spel; bij inschakelen worden ook alle geïnstalleerde spellen uit de database voorgeconfigureerd

### Tabblad CU/UMA (Compute Units & VRAM)
- Live uitlezing van het aantal actieve CU's via GPU SPI-registers
- 4 profielen:
  - **24 CU** (BC-250 standaard)
  - **32 CU**
  - **36 CU**
  - **40 CU** (vol — alle WGP's actief)
- Live toepassing zonder herstart
- Toggle **Opslaan bij opstarten** — installeert een systemd-service die het profiel bij elke start herstelt
- Vereist `umr` — **automatische installatie via een knop** (`rpm-ostree` op Bazzite/SteamOS, `pacman` op CachyOS/Arch)
- Ingebouwde waarschuwing en stabiliteitaanbevelingen
- **VRAM-beheer (UMA)** — stel de *UMA Frame Buffer Size* van het BIOS (**Auto / 2G / 4G / 8G**) rechtstreeks vanuit het paneel in door de EFI-NVRAM-variabele (`AmdSetup`) te patchen — nooit meer via het BIOS-scherm. Wordt actief bij de **volgende herstart**; het paneel toont de live VRAM en de waarde die in het BIOS klaarstaat
  - Beveiligingen: BIOS-versie-whitelist (P3.00), NVRAM-layoutcontrole, automatische back-up vóór elke schrijfactie (knoppen uitgeschakeld bij onbekend BIOS)
  - Schrijven naar het BIOS vereist een up-to-date [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) (levert de root-helper `bc250-uma-helper` — geen sudo-wachtwoord meer)
  - **Auto (≈8 GB) is de aanbevolen veilige waarde** — zie je grafische artefacten (bv. groene storingen) na een wijziging, zet dan terug op Auto

### Tabblad Systeem
- CPU/GPU-temperaturen in realtime, ventilatortoerental en GPU/CPU-kloksnelheden
- **Systeembronnen** — geactiveerd systeem-RAM (wat het OS overhoudt na de UMA-reservering), gebruikt RAM met percentage en aantal actieve CU's
- scx_lavd-status, tuned-profiel, gamemode-daemon-status
- Handmatige updateknop voor [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Tabblad Instellingen
- Toggle auto-apply
- DB-verversing vanuit GitHub
- Over — pluginversie, auteur en GitHub-link

---

## Interfacetaal

De plugin detecteert automatisch de Steam-taal:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Installatie

### Via DeckyLoader (aanbevolen)
1. Zet de **ontwikkelaarsmodus** aan in Decky's algemene instellingen
2. Decky-instellingen → **Ontwikkelaar** → *Plugin installeren vanaf URL*:
   `https://github.com/Necrosiak/bc250-toolkit-decky/releases/latest/download/BC250-Toolkit.zip`

> Directe distributie via GitHub: de URL hierboven wijst altijd naar de nieuwste release, daarna houdt de plugin zichzelf up-to-date met de ingebouwde auto-update.

Handmatige installatie in de tussentijd:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Vereisten
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) geïnstalleerd
- Bazzite, SteamOS of CachyOS op BC-250

---

## Spellendatabase

De DB staat in [`games_db.json`](../games_db.json) en werkt automatisch bij vanuit GitHub.

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
| Code Vein 2 | GE-Proton | UE5 DX12 — vereist UMA Frame Buffer = Auto (~8G) + unified-heap-fix per spel (automatisch toegepast, zie preset hieronder) |
| Stardew Valley | Proton Experimental | Perfect |

### Bekende incompatibele spellen
- **Fortnite** / **Valorant** — kernel-EAC, Linux incompatibel
- **FF VII Rebirth** — controleert GPU-ID, Cyan Skillfish niet herkend, geen oplossing beschikbaar

---

## Bijdragen

🐛 **Bugs & ideeën: open issues!** Elke melding bepaalt direct mee wat er in de
volgende release komt. Een paar regels zijn genoeg — het liefst met je OS
(Bazzite, CachyOS…), de pluginversie, de betrokken QAM-tab en indien mogelijk
de logs (`~/homebrew/logs/BC250-Toolkit/`, `journalctl -u plugin_loader`).
Featureverzoeken en "werkt op X"-meldingen zijn net zo welkom.

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

Optionele geavanceerde velden (de plugin past ze automatisch toe bij **Toepassen**):

- **`compat_tool`** — Proton/GE-Proton-build die via Steams compatibiliteitsmapping wordt geselecteerd
- **`radv`** — RADV-overrides per spel die naar `~/.drirc` worden geschreven, gematcht op de naam van het uitvoerbare bestand, bijv. `{"match": "Game-Win64-Shipping.exe", "options": {"radv_enable_unified_heap_on_apu": false}}`
- **`requires`** — hardwarevereisten die aan de gebruiker worden getoond (`uma_min_mb`, `gttsize`)
- **`configs`** — array met alternatieve varianten, elk met eigen `label`, `stability`, `compat_tool`, `launch_options`, `radv`, `requires`; de gebruiker kiest er één op het tabblad Spellen

> De Steam-AppID staat in de URL van de spelspagina in de Steam Store.

### Herbruikbare preset — UE5 DX12 "out of video memory"

Sommige Unreal Engine 5-spellen in DX12 crashen bij het initialiseren van de render (`D3D12Util.cpp:926 — Out of video memory`) **terwijl er nog volop VRAM vrij is**, omdat de unified heap van RADV op APU het toegewijde VRAM verbergt voor VKD3D (`DedicatedVideoMemory ≈ 0`). `games_db.json` bevat een herbruikbaar **`ue5_dx12_oom`**-profiel onder `_meta.presets`: schakel de unified heap uit voor het uitvoerbare bestand van het spel + zet de **UMA Frame Buffer** in het BIOS op **Auto** (levert al ~8 GB op een 16 GB BC-250 — 4G forceren is niet nodig) + gebruik GE-Proton voor de videocodecs. Om een nieuw getroffen spel te fixen, kopieer het preset naar de bijbehorende entry en stel `radv.match` in op het uitvoerbare bestand. Eerst gevalideerd op **Code Vein 2**.

---

## Build (ontwikkelaars)

```bash
pnpm install
pnpm run build

# Lokaal implementeren
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py updater.py bios_uma.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Zie ook

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — volledige systeemtweaks + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — community-wiki
- [bc250.info](https://bc250.info)

---

## Communitybijdragers

- [@AyeZeeBB](https://github.com/AyeZeeBB) — CachyOS/Arch-ondersteuning voor de umr-installatie + GPU-instantie-fallback (overgenomen uit zijn fork)

---

## 🐧 Compatibiliteit

We werken er actief aan dat deze plugin draait op **elk besturingssysteem dat voor de BC-250 gedocumenteerd is** ([community-docs](https://elektricm.github.io/amd-bc250-docs)) — Bazzite, SteamOS, CachyOS/Arch, Fedora… — met **automatische OS-detectie** (pakketbeheerder, GPU-instantie) zodat op jouw distributie de juiste methode wordt gebruikt.
