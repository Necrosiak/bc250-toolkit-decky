# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Un plugin [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) per l'**ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) con Bazzite o SteamOS Linux.

Database comunitario di opzioni di avvio ottimizzate per il BC-250 — applicabili con un clic dal Quick Access Menu di Steam.

---

## Funzionalità

### Scheda Giochi
- Rileva automaticamente il gioco selezionato nella libreria Steam
- Mostra le impostazioni consigliate per il BC-250 (versione Proton, opzioni di avvio, note)
- **Pulsante Applica** — scrive le opzioni di avvio e seleziona Proton direttamente tramite backend
- **Auto-apply** (opt-in) — applica automaticamente le impostazioni all'avvio di un gioco noto

### Scheda CU (Compute Units)
- Lettura live del numero di CU attivi tramite i registri SPI della GPU
- 4 profili:
  - **24 CU** (BC-250 stock)
  - **32 CU**
  - **36 CU**
  - **40 CU** (completo — tutti i WGP attivi)
- Applicazione live senza riavvio
- Toggle **Salva all'avvio** — installa un servizio systemd che ripristina il profilo ad ogni avvio
- Richiede `umr` — **installazione automatica tramite pulsante** (`rpm-ostree install --apply-live`, senza riavvio)
- Avviso e raccomandazioni di stabilità integrati

### Scheda Sistema
- Temperature CPU/GPU in tempo reale
- Stato scx_lavd, profilo tuned, stato daemon gamemode
- Pulsante di aggiornamento manuale di [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Scheda Impostazioni
- Toggle auto-apply
- Aggiornamento DB da GitHub

---

## Lingua dell'interfaccia

Il plugin rileva automaticamente la lingua di Steam:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Installazione

### Tramite DeckyLoader (consigliato)
> Plugin in attesa di invio al Decky Plugin Store.

Installazione manuale nel frattempo:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Requisiti
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) installato
- Bazzite o SteamOS su BC-250

---

## Database giochi

Il DB si trova in [`games_db.json`](games_db.json) e si aggiorna automaticamente da GitHub.

### Giochi supportati

| Gioco | Proton | Note |
|---|---|---|
| Crimson Desert | Proton Experimental (bleeding-edge) | Spoof GPU 731F necessario |
| Cyberpunk 2077 | GE-Proton | RT disabilitato consigliato |
| Elden Ring | GE-Proton | ~60 FPS giocabile |
| Red Dead Redemption 2 | GE-Proton | Modalità Vulkan obbligatoria |
| Control | GE-Proton | RT funziona (RDNA 1.5) |
| Counter-Strike 2 | Proton Experimental | 100+ FPS |
| Rocket League | Proton Experimental | 120+ FPS |
| Devil May Cry 5 | GE-Proton | ~100 FPS Alto |
| Company of Heroes 3 | GE-Proton | VRAM split min. 4 GB richiesto |
| Detroit: Become Human | Proton Experimental | 60 FPS stabili |
| The Last of Us Part I | GE-Proton | 60 FPS Medio-Alto |
| Black Myth: Wukong | GE-Proton | File di gioco non modificati richiesti |
| Stardew Valley | Proton Experimental | Perfetto |

### Giochi incompatibili noti
- **Fortnite** / **Valorant** — EAC a livello kernel, incompatibile con Linux
- **FF VII Rebirth** — Controlla l'ID GPU, Cyan Skillfish non riconosciuto, nessuna soluzione disponibile

---

## Contribuire

### Metodo semplice — Modulo web

Usa il **[modulo di invio](https://necrosiak.github.io/bc250-toolkit-decky/)** — compila i campi, clicca su Invia e verrà creata automaticamente una issue su GitHub. Dopo l'approvazione, il gioco viene aggiunto tramite PR.

### Metodo sviluppatore — PR diretta

1. Fai un fork di questo repository
2. Modifica `games_db.json` seguendo il formato esistente
3. Apri una Pull Request

### Formato di una voce

```json
"STEAM_APP_ID": {
  "name": "Nome del gioco",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "Note specifiche per BC-250",
  "tested_on": "BC-250"
}
```

> L'AppID di Steam si trova nell'URL della pagina del gioco sullo Steam Store.

---

## Build (sviluppatori)

```bash
pnpm install
pnpm run build

# Deploy locale
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Vedi anche

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks di sistema completi + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki della comunità
- [bc250.info](https://bc250.info)
