# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Un plugin de [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) para el **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) con Bazzite, SteamOS Linux o CachyOS.

Base de datos comunitaria de opciones de lanzamiento optimizadas para el BC-250 — aplicables con un clic desde el Quick Access Menu de Steam.

---

## Funcionalidades

### Pestaña Juegos
- Detecta automáticamente el juego seleccionado en la biblioteca de Steam
- Muestra la configuración recomendada para el BC-250 (versión Proton, opciones de lanzamiento, notas, requisitos de hardware)
- **Variantes de configuración** — cuando un juego ofrece varios perfiles optimizados (p. ej. *Stable* vs *Performance*), se elige uno con un selector; la elección se recuerda
- **Botón Aplicar** — en una sola acción escribe las opciones de lanzamiento, selecciona el build de Proton/GE-Proton y aplica los overrides de GPU por juego (opciones RADV de `~/.drirc`)
- **Auto-apply** (opt-in) — aplica la configuración completa automáticamente al iniciar un juego conocido; al activarlo también preconfigura todos los juegos instalados que estén en la base de datos

### Pestaña CU/UMA (Compute Units y VRAM)
- Lectura en vivo del número de CU activos a través de los registros SPI de la GPU
- 4 perfiles:
  - **24 CU** (BC-250 estándar)
  - **32 CU**
  - **36 CU**
  - **40 CU** (completo — todos los WGP activos)
- Aplicación en vivo sin reinicio
- Toggle **Guardar al arranque** — instala un servicio systemd que restaura el perfil en cada inicio
- Requiere `umr` — **instalación automática con un botón** (`rpm-ostree` en Bazzite/SteamOS, `pacman` en CachyOS/Arch)
- Aviso y recomendaciones de estabilidad integrados
- **Gestión de VRAM (UMA)** — ajusta el *UMA Frame Buffer Size* del BIOS (**Auto / 2G / 4G / 8G**) directamente desde el panel parcheando la variable NVRAM EFI (`AmdSetup`) — sin pasar por la pantalla del BIOS. Surte efecto en el **próximo reinicio**; el panel muestra la VRAM en vivo y el valor pendiente en el BIOS
  - Salvaguardas: lista blanca de versiones de BIOS (P3.00), verificación del layout NVRAM, copia de seguridad automática antes de cada escritura (botones desactivados en BIOS desconocidos)
  - Escribir en el BIOS requiere un [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) actualizado (proporciona el helper root `bc250-uma-helper` — sin contraseña sudo)
  - **Auto (≈8 GB) es el valor seguro recomendado** — si aparecen artefactos gráficos (p. ej. verdes) tras un cambio, vuelve a Auto

### Pestaña Sistema
- Temperaturas de CPU/GPU en tiempo real, velocidad del ventilador y frecuencias GPU/CPU
- **Recursos** — RAM del sistema activada (lo que queda para el SO tras la reserva UMA), RAM usada con porcentaje y número de CUs activos
- Estado de scx_lavd, perfil tuned, estado del daemon gamemode
- Botón de actualización manual de [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Pestaña Ajustes
- Toggle de auto-apply
- Actualización de la DB desde GitHub
- Acerca de — versión del plugin, autor y enlace a GitHub

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
- Bazzite, SteamOS o CachyOS en BC-250

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
| Code Vein 2 | GE-Proton | UE5 DX12 — requiere UMA Frame Buffer = Auto (~8G) + fix unified-heap por juego (auto-aplicado, ver preset abajo) |
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

Campos avanzados opcionales (el plugin los aplica automáticamente al pulsar **Aplicar**):

- **`compat_tool`** — build de Proton/GE-Proton a seleccionar mediante el mapeo de compatibilidad de Steam
- **`radv`** — overrides de Mesa RADV por juego escritos en `~/.drirc`, con match por el nombre del ejecutable, p. ej. `{"match": "Game-Win64-Shipping.exe", "options": {"radv_enable_unified_heap_on_apu": false}}`
- **`requires`** — requisitos de hardware mostrados al usuario (`uma_min_mb`, `gttsize`)
- **`configs`** — array de variantes alternativas, cada una con su `label`, `stability`, `compat_tool`, `launch_options`, `radv`, `requires`; el usuario elige una en la pestaña Juegos

> El AppID de Steam se encuentra en la URL de la página del juego en Steam Store.

### Preset reutilizable — UE5 DX12 «out of video memory»

Algunos juegos Unreal Engine 5 en DX12 fallan al inicializar el render (`D3D12Util.cpp:926 — Out of video memory`) **aun con mucha VRAM libre**, porque el unified heap de RADV en APU oculta la VRAM dedicada a VKD3D (`DedicatedVideoMemory ≈ 0`). `games_db.json` incluye un perfil reutilizable **`ue5_dx12_oom`** en `_meta.presets`: desactivar el unified heap para el ejecutable del juego + poner el **UMA Frame Buffer** del BIOS en **Auto** (ya da ~8 GB en un BC-250 de 16 GB — no hace falta forzar 4G) + usar GE-Proton para los códecs de vídeo. Para arreglar un juego nuevo afectado, copia el preset en su entrada y ajusta `radv.match` a su ejecutable. Validado primero en **Code Vein 2**.

---

## Build (desarrolladores)

```bash
pnpm install
pnpm run build

# Desplegar localmente
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py updater.py bios_uma.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Ver también

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks completos del sistema + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki comunitaria
- [bc250.info](https://bc250.info)

---

## Contribuidores de la comunidad

- [@AyeZeeBB](https://github.com/AyeZeeBB) — soporte CachyOS/Arch para la instalación de umr + fallback de instancia GPU (integrado desde su fork)

---

## 🐧 Compatibilidad

Trabajamos activamente para que este plugin funcione en **todos los sistemas operativos documentados para la BC-250** ([documentación comunitaria](https://elektricm.github.io/amd-bc250-docs)) — Bazzite, SteamOS, CachyOS/Arch, Fedora… — con **detección automática del SO** (gestor de paquetes, instancia GPU) para aplicar el método correcto en tu distribución.
