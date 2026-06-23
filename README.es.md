# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Un plugin de [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) para el **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) con Bazzite o SteamOS Linux.

Base de datos comunitaria de opciones de lanzamiento optimizadas para el BC-250 — aplicables con un clic desde el Quick Access Menu de Steam.

---

## Funcionalidades

### Pestaña Juegos
- Detecta automáticamente el juego seleccionado en la biblioteca de Steam
- Muestra la configuración recomendada para el BC-250 (versión Proton, opciones de lanzamiento, notas)
- **Botón Aplicar** — escribe las opciones de lanzamiento y selecciona Proton directamente desde el backend
- **Auto-apply** (opt-in) — aplica la configuración automáticamente al iniciar un juego conocido

### Pestaña CU (Compute Units)
- Lectura en vivo del número de CU activos a través de los registros SPI de la GPU
- 4 perfiles:
  - **24 CU** (BC-250 estándar)
  - **32 CU**
  - **36 CU**
  - **40 CU** (completo — todos los WGP activos)
- Aplicación en vivo sin reinicio
- Toggle **Guardar al arranque** — instala un servicio systemd que restaura el perfil en cada inicio
- Requiere `umr` — **instalación automática con un botón** (`rpm-ostree install --apply-live`, sin reinicio)
- Aviso y recomendaciones de estabilidad integrados

### Pestaña Sistema
- Temperaturas de CPU/GPU en tiempo real
- Estado de scx_lavd, perfil tuned, estado del daemon gamemode
- Botón de actualización manual de [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Pestaña Ajustes
- Toggle de auto-apply
- Actualización de la DB desde GitHub

---

## Idioma de la interfaz

El plugin detecta automáticamente el idioma de Steam:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Instalación

### Vía DeckyLoader (recomendado)
> Plugin pendiente de envío a la Decky Plugin Store.

Instalación manual mientras tanto:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Requisitos
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) instalado
- Bazzite o SteamOS en BC-250

---

## Base de datos de juegos

La DB está en [`games_db.json`](games_db.json) y se actualiza automáticamente desde GitHub.

### Juegos compatibles

| Juego | Proton | Notas |
|---|---|---|
| Crimson Desert | Proton Experimental (bleeding-edge) | Spoof GPU 731F necesario |
| Cyberpunk 2077 | GE-Proton | RT desactivado recomendado |
| Elden Ring | GE-Proton | ~60 FPS jugable |
| Red Dead Redemption 2 | GE-Proton | Modo Vulkan obligatorio |
| Control | GE-Proton | RT funciona (RDNA 1.5) |
| Counter-Strike 2 | Proton Experimental | 100+ FPS |
| Rocket League | Proton Experimental | 120+ FPS |
| Devil May Cry 5 | GE-Proton | ~100 FPS Alto |
| Company of Heroes 3 | GE-Proton | VRAM mínimo 4 GB requerido |
| Detroit: Become Human | Proton Experimental | 60 FPS estable |
| The Last of Us Part I | GE-Proton | 60 FPS Medio-Alto |
| Black Myth: Wukong | GE-Proton | Archivos del juego sin modificar |
| Stardew Valley | Proton Experimental | Perfecto |

### Juegos incompatibles conocidos
- **Fortnite** / **Valorant** — EAC a nivel de kernel, incompatible con Linux
- **FF VII Rebirth** — Verifica el ID de GPU, Cyan Skillfish no reconocido, sin solución disponible

---

## Contribuir

### Método fácil — Formulario web

Usa el **[formulario de envío](https://necrosiak.github.io/bc250-toolkit-decky/)** — rellena los datos, haz clic en Enviar y se creará un issue en GitHub automáticamente. Tras su aprobación, el juego se añade mediante PR.

### Método desarrollador — PR directa

1. Haz un fork de este repositorio
2. Edita `games_db.json` siguiendo el formato existente
3. Abre un Pull Request

### Formato de entrada

```json
"STEAM_APP_ID": {
  "name": "Nombre del juego",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "Notas específicas del BC-250",
  "tested_on": "BC-250"
}
```

> El AppID de Steam se encuentra en la URL de la página del juego en Steam Store.

---

## Build (desarrolladores)

```bash
pnpm install
pnpm run build

# Desplegar localmente
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Ver también

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks completos del sistema + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki comunitaria
- [bc250.info](https://bc250.info)
