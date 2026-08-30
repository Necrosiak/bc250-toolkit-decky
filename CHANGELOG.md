# Changelog

All notable changes to BC250-Toolkit are documented here.

## [0.5.5] - 2026-08-30

### Added
- **Keep the 8-core unlock across power cuts.** A new *Restore at boot* toggle
  in the CPU unlock section. The CU profile can simply be re-poked at boot
  because compute units are written live; cores cannot, since the presence mask
  is only read when the CPU initialises. The service therefore checks the mask
  at startup and, only when the cores are missing, rewrites it and reboots the
  machine once. The mask survives warm reboots, so that extra reboot happens
  only after a genuine power-off.
- The unlock status now reports whether that service is enabled, so the toggle
  reflects the real state of the system rather than a remembered preference.

### Notes
- A service that reboots the machine at boot is the most dangerous thing this
  plugin can install, so it is capped at **two attempts** before giving up for
  good, and `bc250.nocoreunlock` on the kernel command line disarms it without
  needing a working system.
- Its scripts are copied to `/usr/local/lib/bc250-core-unlock/`, outside the
  plugin directory that Decky rewrites on every update.
- The toggle needs the `bc250-core-boot` sudoers rules from bc250-tweaks.

## [0.5.4] - 2026-08-25

### Added
- **A GPU load that is actually measured.** The BC-250's firmware does not
  report GPU activity at all: `gpu_busy_percent` answers *operation not
  supported*, and `average_gfx_activity` in the driver's metrics table holds
  `0xFFFF`, the "unsupported" sentinel. Overlays divide that by 100 and show
  **655 %** — a number that never moves, whatever the machine is doing.

  The Resources tab now derives the figure from the kernel's per-engine
  accounting (`drm-engine-gfx` in `fdinfo`), the same source `nvtop` uses.
  Measured on a BC-250: about 58 % with only the Steam interface drawn, 68-75 %
  in a game, tracking the GPU temperature as it climbs from 40 to 46 °C.

### Fixed
- **The SoC temperature is now read from the metrics table** alongside the GPU
  temperature, instead of being unavailable.

### Not shown, deliberately
- **Power draw.** The same metrics table carries GPU and package wattage, and
  both are unusable on this chip: under a *constant* load the GPU figure swings
  between 0.9 W and 62 W within seconds. The decoding is sound — the temperature
  beside it is steady and the CPU power field holds its sentinel — so the
  firmware itself is at fault. Overlays read that field too, which is where
  their wattages come from. No number is better than an invented one.

## [0.5.3] - 2026-08-25

The Toolkit degraded differently: with no `MostRecent`, it fell back to the *first* account listed, which is right only by luck when several exist.

### Fixed

- **The active Steam account could no longer be identified, after Steam changed
  its files.** Steam stopped publishing a numeric `ActiveUser` in `registry.vdf`
  — it now publishes `AutoLoginUser`, holding the account *name* — and dropped
  `MostRecent` from `loginusers.vdf` in favour of `AutoLogin` and `Timestamp`.
  Both probes came back empty and everything fell back to a generic profile.
  The account is now resolved from `AutoLoginUser` matched by name, then
  `AutoLogin`, then the most recent `Timestamp`; the older keys are still tried
  first, so an older Steam behaves exactly as before.

## [0.5.2] - 2026-08-23

### Fixed
- **Calls to `systemctl --user` inherited the plugin loader's PyInstaller
  environment.** Decky's loader is a PyInstaller binary and points
  `LD_LIBRARY_PATH` (and sometimes `LD_PRELOAD`) at its own bundled libraries.
  Child processes inherited them, so system binaries loaded the wrong
  `libcrypto` and aborted with `OPENSSL_3.4.0 not found`. That silently broke
  the user-systemd reload on unload and made gamemode always report itself as
  inactive. Both call sites now run with a cleaned environment, restoring the
  original `LD_LIBRARY_PATH` that PyInstaller saves aside. This never showed on
  Bazzite, whose system libraries happen to match the bundled ones; it was found
  while fixing the same flaw in Steamcord ([Steamcord #38](https://github.com/Necrosiak/Steamcord/issues/38)).

## [0.5.1] - 2026-08-09

### Fixed
- **The in-plugin updater could not update anything on a normal install, and
  said it had.** Decky root-owns the plugin's top-level directory, so creating
  the temporary file the updater writes through failed with `Permission
  denied` — even though the files being replaced belong to the user. Writing
  in place is now used as a fallback when the temporary file cannot be created
  but the destination exists and is writable.
- **A failed automatic update was reported as a success.** `apply()` returns a
  dict, and `{"ok": False, "error": …}` is always truthy in Python, so the
  boot-time auto-updater restarted Decky after a failure as if the update had
  landed — repeating on every boot, since the installed version never changed.
  It now reads the result and logs why it gave up.

## [0.5.0] - 2026-08-02

### Added
- **8-core CPU unlock (6C/12T → 8C/16T).** The BC-250 enumerates only 6 of the
  8 Zen 2 cores on its Oberon die. The CU/UMA tab now reads the core presence
  mask, shows whether this particular board is eligible, and can wake the other
  two cores up. Only a mask of exactly `0x77` is acted on — an asymmetric mask
  looks like genuine factory defect binning, and the SMU primitive writes `0xFF`
  regardless, so those boards are deliberately left alone.
  - **Temporary by design.** The mask survives warm reboots but a full power-off
    reverts it. It is presented as a *compatibility test* to run before
    considering the modified BIOS, which is the only way to make it permanent.
  - The SMU governor is stopped for the write and restarted whatever happens.
    Its unit name is auto-detected (`cyan-skillfish-governor-smu`,
    `oberon-governor`, …) and its absence is handled, so this works on any
    distribution.
  - The status probe requires three consistent reads before it reports a mask:
    the governor shares the same SMN window, so a read taken mid-transaction
    returns an unrelated register.
  - Credit: the unlock primitive and script are the work of
    [rw-r-r-0644](https://github.com/rw-r-r-0644/bc250-core-unlock) (MIT),
    vendored untouched with its licence.
- **CPU cores and threads** in the System tab's Resources section — `6C / 12T`,
  turning green at `8C / 16T`.

### Fixed
- **The plugin was not running as root at all.** The privileged flag in
  `plugin.json` was spelled `_root` instead of `root`, so DeckyLoader ignored it
  and the backend ran as the normal user. Everything that needs privileges — CU
  management, UMA/VRAM writes — was silently relying on passwordless `sudo`
  being configured, which is not the case on most systems. Now fixed.
- **The user ID lookup could return root**, which the fix above would have made
  reachable. `_user_uid()` read the owner of `~/.local/share/bc250-toolkit`
  first; now that the plugin creates that directory itself as root, the function
  returned `0` — and `~/.drirc` would have been chowned to root, silently taking
  the user's mesa configuration away from them. It now asks the home directory,
  which never belongs to root. The same mistake is fixed for the user-context
  `systemctl --user daemon-reload`, which would have talked to root's systemd.
- **Files written into the home directory are now given back to the user**,
  instead of staying root-owned.

## [0.4.9] - 2026-07-23

### Fixed
- **Controller navigation rows could log "Unhandled flow-children" errors.**
  The current Steam client only accepts `row`/`column` (and their variants)
  as `flow-children` values; the legacy `horizontal` value is rejected on
  every render, which can degrade controller navigation on the affected
  button rows. All occurrences now use `row`.

## [0.4.8] - 2026-07-20

### Changed
- **Monochrome SVG icons across the QAM UI**, matching the rest of the
  Necrosiak plugin suite (Steamcord v1.16.1). Color emoji (tabs, refresh,
  download, warning, GitHub) were replaced with monochrome vector icons that
  inherit the surrounding text size and color.

### Fixed
- **In-plugin updates failed on root-owned installs.** The updater overwrote
  files with `shutil.copy2`, which ends with a `chmod` on the destination —
  something a non-root process cannot do on root-owned files even when they
  are world-writable. Files are now replaced via a temp file + atomic
  `os.replace`, which only needs write permission on the directory — and
  every replaced file becomes owned by the user, so a root-owned install
  heals itself as it updates.

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
