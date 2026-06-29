# Changelog

All notable changes to BC250-Toolkit are documented here.

## [0.3.1] - 2026-06-29

### Added
- **UI overhaul** — horizontal tab bar (Games / CU / System / Settings) with
  controller focus highlight, matching the Steamcord style.
- **Games list as cards** — each game shows its Steam library icon (fetched via
  `appStore`, with a colored-initial fallback) plus a focus halo.
- **Inline per-game config** — a game's settings (variants, Proton, launch
  options, notes) now expand directly under the selected game instead of at the
  bottom of the list; config variants are picked from small focusable buttons.
- **CU profiles as cards** (`CardBtn`) with active/focus states.
- **About section** in Settings — plugin name, version, author and a button to
  open the GitHub repository.

### Changed
- **Native Steam notifications** — all in-plugin toasts now use
  `DisplayClientNotification` (popup + sound) instead of the Decky toaster,
  with a guard against an empty Steam ID (which would otherwise crash the panel).

### Backend
- New `get_version` method exposing the installed version (read from
  `package.json`) to the UI.

## [0.3.0] - 2026-06-28

### Added
- **Multi-config per game** — a game can ship several tuned profiles (e.g.
  *Stable* vs *Performance*); the chosen variant is remembered.
- **Auto-apply** (opt-in) — applies a known game's full config on launch and
  pre-configures every installed game from the database.
- Per-game **GPU / RADV** overrides written to `~/.drirc`.
- Reusable **`ue5_dx12_oom`** preset for Unreal Engine 5 DX12 games that crash
  with *Out of video memory* despite free VRAM (first validated on Code Vein 2).

## [0.2.0] - 2026-06-28

### Added
- Release-based **auto-update** (silent auto-update, manual button, toggle).

[0.3.1]: https://github.com/Necrosiak/bc250-toolkit-decky/releases/tag/v0.3.1
[0.3.0]: https://github.com/Necrosiak/bc250-toolkit-decky/releases/tag/v0.3.0
[0.2.0]: https://github.com/Necrosiak/bc250-toolkit-decky/releases/tag/v0.2.0
