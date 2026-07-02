# BC250 Toolkit — Плагин DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Плагин [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) для **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) под управлением Bazzite или SteamOS Linux.

Общественная база данных оптимизированных параметров запуска для BC-250 — применяется одним кликом из Quick Access Menu Steam.

---

## Возможности

### Вкладка Игры
- Автоматически определяет выбранную игру в библиотеке Steam
- Отображает рекомендуемые настройки для BC-250 (версия Proton, параметры запуска, заметки, требования к оборудованию)
- **Варианты конфигурации** — когда у игры несколько оптимизированных профилей (например, *Stable* и *Performance*), один выбирается из селектора; выбор запоминается
- **Кнопка Применить** — одним действием записывает параметры запуска, выбирает сборку Proton/GE-Proton и применяет переопределения GPU для игры (опции RADV в `~/.drirc`)
- **Авто-применение** (opt-in) — автоматически применяет полную конфигурацию при запуске известной игры; при включении также предварительно настраивает все установленные игры из базы данных

### Вкладка CU/UMA (Compute Units и VRAM)
- Отображение в реальном времени числа активных CU через SPI-регистры GPU
- 4 профиля:
  - **24 CU** (стандарт BC-250)
  - **32 CU**
  - **36 CU**
  - **40 CU** (полный — все WGP активны)
- Применение без перезагрузки
- Переключатель **Сохранить при загрузке** — устанавливает службу systemd, восстанавливающую профиль при каждом запуске
- Требует `umr` — **автоматическая установка кнопкой** (`rpm-ostree install --apply-live`, без перезагрузки)
- Встроенное предупреждение и рекомендации по стабильности
- **Управление VRAM (UMA)** — задавайте *UMA Frame Buffer Size* BIOS (**Auto / 2G / 4G / 8G**) прямо из панели, патча EFI-переменную NVRAM (`AmdSetup`) — больше не нужно заходить в экран BIOS. Вступает в силу при **следующей перезагрузке**; панель показывает текущую VRAM и значение, ожидающее в BIOS
  - Защита: белый список версий BIOS (P3.00), проверка структуры NVRAM, автоматическая резервная копия перед каждой записью (кнопки отключены на неизвестном BIOS)
  - Для записи в BIOS требуется актуальный [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) (содержит root-helper `bc250-uma-helper` — без запроса пароля sudo)
  - **Auto (≈8 ГБ) — рекомендуемое безопасное значение** — если после изменения появились графические артефакты (например, зелёные), вернитесь на Auto

### Вкладка Система
- Температуры CPU/GPU в реальном времени
- **Ресурсы** — активная ОЗУ системы (то, что остаётся ОС после выделения UMA), использованная ОЗУ с процентом и число активных CU
- Статус scx_lavd, профиль tuned, статус демона gamemode
- Кнопка ручного обновления [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Вкладка Настройки
- Переключатель авто-применения
- Обновление базы данных с GitHub
- О плагине — версия плагина, автор и ссылка на GitHub

---

## Язык интерфейса

Плагин автоматически определяет язык Steam:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Установка

### Через DeckyLoader (рекомендуется)
> Плагин ожидает отправки в Decky Plugin Store.

Ручная установка в ожидании:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Требования
- Установленный [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader)
- Bazzite или SteamOS на BC-250

---

## База данных игр

База находится в [`games_db.json`](games_db.json) и автоматически обновляется с GitHub.

### Поддерживаемые игры

| Игра | Proton | Заметки |
|---|---|---|
| Crimson Desert | Proton Experimental (bleeding-edge) | Требуется GPU spoof 731F |
| Cyberpunk 2077 | GE-Proton | Рекомендуется отключить RT |
| Elden Ring | GE-Proton | ~60 FPS — играбельно |
| Red Dead Redemption 2 | GE-Proton | Обязателен режим Vulkan |
| Control | GE-Proton | RT работает (RDNA 1.5) |
| Counter-Strike 2 | Proton Experimental | 100+ FPS |
| Rocket League | Proton Experimental | 120+ FPS |
| Devil May Cry 5 | GE-Proton | ~100 FPS Высокие настройки |
| Company of Heroes 3 | GE-Proton | Требуется разделение VRAM от 4 ГБ |
| Detroit: Become Human | Proton Experimental | Стабильные 60 FPS |
| The Last of Us Part I | GE-Proton | 60 FPS Средние-Высокие |
| Black Myth: Wukong | GE-Proton | Файлы игры без изменений |
| Code Vein 2 | GE-Proton | UE5 DX12 — нужен UMA Frame Buffer = Auto (~8G) + фикс unified-heap для игры (применяется автоматически, см. пресет ниже) |
| Stardew Valley | Proton Experimental | Идеально |

### Известные несовместимые игры
- **Fortnite** / **Valorant** — EAC на уровне ядра, несовместимо с Linux
- **FF VII Rebirth** — проверяет ID GPU, Cyan Skillfish не распознан, исправления нет

---

## Участие в проекте

### Простой способ — Веб-форма

Используйте **[форму отправки](https://necrosiak.github.io/bc250-toolkit-decky/)** — заполните данные, нажмите Отправить, и issue на GitHub создастся автоматически. После одобрения игра добавляется через PR.

### Способ для разработчиков — Прямой PR

1. Сделайте форк этого репозитория
2. Отредактируйте `games_db.json` в соответствии с существующим форматом
3. Откройте Pull Request

### Формат записи

```json
"STEAM_APP_ID": {
  "name": "Название игры",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "Заметки, специфичные для BC-250",
  "tested_on": "BC-250"
}
```

Необязательные расширенные поля (плагин применяет их автоматически при нажатии **Применить**):

- **`compat_tool`** — сборка Proton/GE-Proton, выбираемая через сопоставление совместимости Steam
- **`radv`** — переопределения Mesa RADV для игры, записываемые в `~/.drirc`, сопоставление по имени исполняемого файла, например `{"match": "Game-Win64-Shipping.exe", "options": {"radv_enable_unified_heap_on_apu": false}}`
- **`requires`** — требования к оборудованию, показываемые пользователю (`uma_min_mb`, `gttsize`)
- **`configs`** — массив альтернативных вариантов, каждый со своими `label`, `stability`, `compat_tool`, `launch_options`, `radv`, `requires`; пользователь выбирает один на вкладке Игры

> Steam AppID можно найти в URL страницы игры в Steam Store.

### Переиспользуемый пресет — UE5 DX12 «out of video memory»

Некоторые игры на Unreal Engine 5 в DX12 падают при инициализации рендера (`D3D12Util.cpp:926 — Out of video memory`) **даже при большом объёме свободной VRAM**, потому что unified heap RADV на APU скрывает выделенную VRAM от VKD3D (`DedicatedVideoMemory ≈ 0`). `games_db.json` содержит переиспользуемый профиль **`ue5_dx12_oom`** в `_meta.presets`: отключить unified heap для исполняемого файла игры + установить **UMA Frame Buffer** в BIOS на **Auto** (уже даёт ~8 ГБ на BC-250 с 16 ГБ — форсировать 4G не нужно) + использовать GE-Proton для видеокодеков. Чтобы исправить новую затронутую игру, скопируйте пресет в её запись и задайте `radv.match` равным её исполняемому файлу. Сначала проверено на **Code Vein 2**.

---

## Сборка (для разработчиков)

```bash
pnpm install
pnpm run build

# Локальное развёртывание
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py updater.py bios_uma.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Смотрите также

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — полные системные твики + авто-обновление
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — вики сообщества
- [bc250.info](https://bc250.info)
