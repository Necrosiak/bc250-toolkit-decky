# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Plugin [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) dla **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) z Bazzite lub SteamOS Linux.

Baza danych społeczności ze zoptymalizowanymi opcjami uruchamiania dla BC-250 — możliwe do zastosowania jednym kliknięciem z menu Quick Access Menu Steam.

---

## Funkcje

### Zakładka Gry
- Automatycznie wykrywa wybraną grę w bibliotece Steam
- Wyświetla zalecane ustawienia dla BC-250 (wersja Proton, opcje uruchamiania, uwagi)
- **Przycisk Zastosuj** — zapisuje opcje uruchamiania i wybiera Proton bezpośrednio przez backend
- **Auto-apply** (opt-in) — automatycznie stosuje ustawienia przy uruchamianiu znanych gier

### Zakładka CU (Compute Units)
- Odczyt na żywo liczby aktywnych CU przez rejestry SPI GPU
- 4 profile:
  - **24 CU** (BC-250 stock)
  - **32 CU**
  - **36 CU**
  - **40 CU** (pełny — wszystkie WGP aktywne)
- Aplikacja na żywo bez ponownego uruchomienia
- Przełącznik **Zapisz przy starcie** — instaluje usługę systemd przywracającą profil przy każdym uruchomieniu
- Wymaga `umr` — **automatyczna instalacja przyciskiem** (`rpm-ostree install --apply-live`, bez restartu)
- Wbudowane ostrzeżenie i zalecenia dotyczące stabilności

### Zakładka System
- Temperatury CPU/GPU w czasie rzeczywistym
- Stan scx_lavd, profil tuned, stan daemona gamemode
- Przycisk ręcznej aktualizacji [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Zakładka Ustawienia
- Przełącznik auto-apply
- Odświeżanie bazy danych z GitHub

---

## Język interfejsu

Plugin automatycznie wykrywa język Steam:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Instalacja

### Przez DeckyLoader (zalecane)
> Plugin oczekuje na zgłoszenie do Decky Plugin Store.

Ręczna instalacja w międzyczasie:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Wymagania
- Zainstalowany [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader)
- Bazzite lub SteamOS na BC-250

---

## Baza danych gier

Baza danych znajduje się w [`games_db.json`](games_db.json) i aktualizuje się automatycznie z GitHub.

### Obsługiwane gry

| Gra | Proton | Uwagi |
|---|---|---|
| Crimson Desert | Proton Experimental (bleeding-edge) | Wymagany GPU spoof 731F |
| Cyberpunk 2077 | GE-Proton | Zalecane wyłączenie RT |
| Elden Ring | GE-Proton | ~60 FPS grywalny |
| Red Dead Redemption 2 | GE-Proton | Wymagany tryb Vulkan |
| Control | GE-Proton | RT działa (RDNA 1.5) |
| Counter-Strike 2 | Proton Experimental | 100+ FPS |
| Rocket League | Proton Experimental | 120+ FPS |
| Devil May Cry 5 | GE-Proton | ~100 FPS Wysoka |
| Company of Heroes 3 | GE-Proton | Wymagany podział VRAM min. 4 GB |
| Detroit: Become Human | Proton Experimental | Stabilne 60 FPS |
| The Last of Us Part I | GE-Proton | 60 FPS Średnio-Wysoka |
| Black Myth: Wukong | GE-Proton | Wymagane niezmodyfikowane pliki gry |
| Stardew Valley | Proton Experimental | Perfekcyjnie |

### Znane gry niekompatybilne
- **Fortnite** / **Valorant** — EAC na poziomie kernela, niekompatybilne z Linuksem
- **FF VII Rebirth** — sprawdza ID GPU, Cyan Skillfish nierozpoznany, brak rozwiązania

---

## Współtworzenie

### Prosta metoda — Formularz internetowy

Użyj **[formularza zgłoszeniowego](https://necrosiak.github.io/bc250-toolkit-decky/)** — wypełnij dane, kliknij Wyślij, a issue na GitHub zostanie automatycznie utworzone. Po zatwierdzeniu gra jest dodawana przez PR.

### Metoda deweloperska — Bezpośredni PR

1. Sforkuj to repozytorium
2. Edytuj `games_db.json` zgodnie z istniejącym formatem
3. Otwórz Pull Request

### Format wpisu

```json
"STEAM_APP_ID": {
  "name": "Nazwa gry",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "Uwagi specyficzne dla BC-250",
  "tested_on": "BC-250"
}
```

> AppID Steam można znaleźć w URL strony gry w Steam Store.

---

## Build (deweloperzy)

```bash
pnpm install
pnpm run build

# Lokalne wdrożenie
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Zobacz również

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — pełne tweaki systemowe + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki społeczności
- [bc250.info](https://bc250.info)
