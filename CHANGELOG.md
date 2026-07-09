# Changelog

All notable changes to BC250-Toolkit are documented here.

## [0.4.7] - 2026-07-09

### Fixed
- **Update failures are now visible.** When installing an update fails (for
  example on a root-owned local install: Permission denied), the QAM shows the
  error under the update button instead of staying on "installing…" forever.

## [0.4.6] - 2026-07-06

### Fixed
- **System tab really scrolls with a controller now.** Each info row is wrapped
  in a focusable so the D-pad steps through them and the Quick Access Menu
  scrolls to follow the focus (the previous scroll-container approach didn't
  move without focusable children).

## [0.4.5] - 2026-07-06

### Fixed
- **System tab is scrollable with a controller again.** The tab is made of
  display-only fields (no focusable element when bc250-tweaks isn't installed),
  so after the fan/clock rows were added the gamepad got stuck at the top and
  couldn't reach the lower info. The tab is now wrapped in a scrollable
  focusable container, and the temperature + clock are shown on one line per
  chip (CPU / GPU) to keep it short.

## [0.4.4] - 2026-07-06

### Added
- **Live GPU and CPU clocks** in the System tab, next to the temperatures and
  fan. GPU shader clock from the amdgpu sensor, CPU clock averaged from
  `/proc/cpuinfo`. (Fan *control* was evaluated and deliberately left out — the
  board's PWM mode isn't reliably controllable and forcing it risks
  overheating; monitoring only.)

## [0.4.3] - 2026-07-06

### Added
- **Fan speed** in the System tab, next to the CPU/GPU temperatures. Read from
  the board's Super-I/O sensor (nct6686 on the BC-250); the fastest spinning
  header is reported as the active fan (RPM).

## [0.4.2] - 2026-07-06

### Changed
- **umr auto-install now detects the OS** and adds Fedora (`dnf`) and
  Debian/Ubuntu (`apt`) on top of the existing rpm-ostree + Arch family
  (`pacman`/`paru`/`yay`/`shelly`). A new `_is_ostree()` check keeps
  rpm-ostree as the only method on immutable images (Bazzite/SteamOS), so a
  mutable BC-250 (Fedora/Debian) can now install umr from the button too.
- READMEs (9 languages): added a compatibility section — the plugin targets
  every OS documented for the BC-250 with automatic OS detection.

## [0.4.1] - 2026-07-06

### Added
- **CachyOS/Arch support for the umr installation** — the install button now
  detects the package manager (`rpm-ostree` on Bazzite/SteamOS, `pacman`,
  `paru` or `yay` on CachyOS/Arch) instead of assuming rpm-ostree.
  Contributed by [@AyeZeeBB](https://github.com/AyeZeeBB), merged from their fork.
- **GPU instance fallback** — umr reads/writes now try `cyan_skillfish@1`,
  then `cyan_skillfish@0`, then umr's own auto-detection, so the CU tools
  keep working on kernels/systems where the GPU enumerates on a different
  debugfs instance. Contributed by [@AyeZeeBB](https://github.com/AyeZeeBB).

### Changed
- READMEs (9 languages): CachyOS listed in supported systems and requirements,
  umr install wording updated, new **Community contributors** section.

## [0.4.0] - 2026-07-02

### Added
- **VRAM (UMA) management** — new section in the CU tab to set the BIOS
  *UMA Frame Buffer Size* (**Auto / 2G / 4G / 8G**) by patching the `AmdSetup`
  EFI NVRAM variable directly, without entering the BIOS screen. Takes effect
  at the **next reboot**; the panel shows the live VRAM and the value staged
  in the BIOS.
- Guard rails: BIOS version whitelist (P3.00), NVRAM layout/size check,
  automatic backup before every write (with a `restore_uma_backup` rollback
  method); the buttons are disabled on unrecognized BIOSes.
- Permanent warning in the panel: **Auto (≈8 GB) is the safe recommended
  value** — if graphical artifacts (e.g. green glitches) appear after a
  change, switch back to Auto.
- **Resources section in the System tab** — shows the enabled system RAM
  (what the OS gets after the UMA carve-out), the used RAM (with a colored
  usage percentage) and the number of active CUs.

### Changed
- The **CU** tab is now labeled **CU/UMA** to reflect the new VRAM section.
- UMA writes now go through the root helper `bc250-uma-helper` (installed by
  bc250-tweaks) with a NOPASSWD sudoers rule — no more sudo password prompt
  from the QAM. Writing UMA requires an up-to-date bc250-tweaks install.

## [0.3.2] - 2026-06-29

### Changed
- **Consistent action buttons** — every action button (System update, DB
  refresh, update check/install, CU UMR install, games refresh, About/GitHub)
  now uses the same focusable `CardBtn` card style as the Games/CU lists. The
  "update available" button turns green to stand out.

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

[0.3.2]: https://github.com/Necrosiak/bc250-toolkit-decky/releases/tag/v0.3.2
[0.3.1]: https://github.com/Necrosiak/bc250-toolkit-decky/releases/tag/v0.3.1
[0.3.0]: https://github.com/Necrosiak/bc250-toolkit-decky/releases/tag/v0.3.0
[0.2.0]: https://github.com/Necrosiak/bc250-toolkit-decky/releases/tag/v0.2.0
