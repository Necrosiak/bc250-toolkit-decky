# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Un plugin [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) per l'**ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) con Bazzite, SteamOS Linux o CachyOS.

Database comunitario di opzioni di avvio ottimizzate per il BC-250 — applicabili con un clic dal Quick Access Menu di Steam.

---

## Funzionalità

### Scheda Giochi
- Rileva automaticamente il gioco selezionato nella libreria Steam
- Mostra le impostazioni consigliate per il BC-250 (versione Proton, opzioni di avvio, note, requisiti hardware)
- **Varianti di configurazione** — quando un gioco offre più profili ottimizzati (es. *Stable* vs *Performance*), se ne sceglie uno da un selettore; la scelta viene memorizzata
- **Pulsante Applica** — in un'unica azione scrive le opzioni di avvio, seleziona il build Proton/GE-Proton e applica eventuali override GPU per gioco (opzioni RADV in `~/.drirc`)
- **Auto-apply** (opt-in) — applica automaticamente la configurazione completa all'avvio di un gioco noto; attivandolo preconfigura anche tutti i giochi installati presenti nel database

### Scheda CU/UMA (Compute Units e VRAM)
- Lettura live del numero di CU attivi tramite i registri SPI della GPU
- 4 profili:
  - **24 CU** (BC-250 stock)
  - **32 CU**
  - **36 CU**
  - **40 CU** (completo — tutti i WGP attivi)
- Applicazione live senza riavvio
- Toggle **Salva all'avvio** — installa un servizio systemd che ripristina il profilo ad ogni avvio
- Richiede `umr` — **installazione automatica tramite pulsante** (`rpm-ostree` su Bazzite/SteamOS, `pacman` su CachyOS/Arch)
- Avviso e raccomandazioni di stabilità integrati
- **Gestione VRAM (UMA)** — imposta la *UMA Frame Buffer Size* del BIOS (**Auto / 2G / 4G / 8G**) direttamente dal pannello patchando la variabile NVRAM EFI (`AmdSetup`) — senza più passare dalla schermata BIOS. Ha effetto al **prossimo riavvio**; il pannello mostra la VRAM live e il valore in attesa nel BIOS
  - Protezioni: whitelist delle versioni BIOS (P3.00), verifica del layout NVRAM, backup automatico prima di ogni scrittura (pulsanti disattivati su BIOS sconosciuti)
  - La scrittura nel BIOS richiede un [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) aggiornato (fornisce l'helper root `bc250-uma-helper` — niente password sudo)
  - **Auto (≈8 GB) è il valore sicuro consigliato** — se compaiono artefatti grafici (es. verdi) dopo una modifica, torna su Auto

### Scheda Sistema
- Temperature CPU/GPU in tempo reale, velocità della ventola e clock GPU/CPU
- **Risorse** — RAM di sistema attiva (ciò che resta all'OS dopo il ritaglio UMA), RAM usata con percentuale e numero di CU attivi
- Stato scx_lavd, profilo tuned, stato daemon gamemode
- Pulsante di aggiornamento manuale di [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Scheda Impostazioni
- Toggle auto-apply
- Aggiornamento DB da GitHub
- Informazioni — versione del plugin, autore e link a GitHub

---

## Lingua dell'interfaccia

Il plugin rileva automaticamente la lingua di Steam:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Installazione

### Tramite DeckyLoader (consigliato)
1. Attivate la **modalità sviluppatore** nelle impostazioni generali di Decky
2. Impostazioni Decky → **Sviluppatore** → *Installa plugin da URL*:
   `https://github.com/Necrosiak/bc250-toolkit-decky/releases/latest/download/BC250-Toolkit.zip`

> Decky Plugin Store: invio in corso — tester benvenuti ([aprite una issue](https://github.com/Necrosiak/bc250-toolkit-decky/issues) per dare una mano).

Installazione manuale nel frattempo:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Requisiti
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) installato
- Bazzite, SteamOS o CachyOS su BC-250

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
| Code Vein 2 | GE-Proton | UE5 DX12 — richiede UMA Frame Buffer = Auto (~8G) + fix unified-heap per gioco (auto-applicato, vedi preset sotto) |
| Stardew Valley | Proton Experimental | Perfetto |

### Giochi incompatibili noti
- **Fortnite** / **Valorant** — EAC a livello kernel, incompatibile con Linux
- **FF VII Rebirth** — Controlla l'ID GPU, Cyan Skillfish non riconosciuto, nessuna soluzione disponibile

---

## Contribuire

🐛 **Bug e idee: aprite issue!** Ogni segnalazione orienta direttamente la
prossima release. Bastano poche righe — idealmente con il vostro OS (Bazzite,
CachyOS…), la versione del plugin, la scheda del QAM coinvolta e, se
possibile, i log (`~/homebrew/logs/BC250-Toolkit/`, `journalctl -u
plugin_loader`). Le richieste di funzionalità e i «funziona su X» sono
altrettanto benvenuti.

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

Campi avanzati opzionali (il plugin li applica automaticamente al clic su **Applica**):

- **`compat_tool`** — build Proton/GE-Proton da selezionare tramite il compat mapping di Steam
- **`radv`** — override Mesa RADV per gioco scritti in `~/.drirc`, match sul nome dell'eseguibile, es. `{"match": "Game-Win64-Shipping.exe", "options": {"radv_enable_unified_heap_on_apu": false}}`
- **`requires`** — requisiti hardware mostrati all'utente (`uma_min_mb`, `gttsize`)
- **`configs`** — array di varianti alternative, ognuna con il proprio `label`, `stability`, `compat_tool`, `launch_options`, `radv`, `requires`; l'utente ne sceglie una nella scheda Giochi

> L'AppID di Steam si trova nell'URL della pagina del gioco sullo Steam Store.

### Preset riutilizzabile — UE5 DX12 «out of video memory»

Alcuni giochi Unreal Engine 5 in DX12 vanno in crash all'inizializzazione del render (`D3D12Util.cpp:926 — Out of video memory`) **pur con molta VRAM libera**, perché l'unified heap di RADV su APU nasconde la VRAM dedicata a VKD3D (`DedicatedVideoMemory ≈ 0`). `games_db.json` include un profilo riutilizzabile **`ue5_dx12_oom`** in `_meta.presets`: disattivare l'unified heap per l'eseguibile del gioco + impostare l'**UMA Frame Buffer** del BIOS su **Auto** (dà già ~8 GB su un BC-250 da 16 GB — non serve forzare 4G) + usare GE-Proton per i codec video. Per correggere un nuovo gioco interessato, copia il preset nella sua voce e imposta `radv.match` sul suo eseguibile. Validato inizialmente su **Code Vein 2**.

---

## Build (sviluppatori)

```bash
pnpm install
pnpm run build

# Deploy locale
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py updater.py bios_uma.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Vedi anche

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks di sistema completi + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki della comunità
- [bc250.info](https://bc250.info)

---

## Contributori della comunità

- [@AyeZeeBB](https://github.com/AyeZeeBB) — supporto CachyOS/Arch per l'installazione di umr + fallback dell'istanza GPU (integrato dal suo fork)

---

## 🐧 Compatibilità

Lavoriamo attivamente perché questo plugin funzioni su **tutti i sistemi operativi documentati per la BC-250** ([documentazione della comunità](https://elektricm.github.io/amd-bc250-docs)) — Bazzite, SteamOS, CachyOS/Arch, Fedora… — con **rilevamento automatico dell'OS** (gestore pacchetti, istanza GPU) per usare il metodo giusto sulla tua distribuzione.
