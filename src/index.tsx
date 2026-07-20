import { useEffect, useState, useCallback, ReactNode } from "react";
import { FaMicrochip } from "react-icons/fa";
import {
  IcController, IcDownload, IcGear, IcGithub, IcLightning, IcRefresh,
  IcThermometer, IcWarn,
} from "./components/Icons";
import {
  staticClasses,
  PanelSection,
  PanelSectionRow,
  Field,
  ToggleField,
  SteamSpinner,
  Focusable,
  DialogButton,
} from "@decky/ui";
import { definePlugin, call } from "@decky/api";
import { t } from "./i18n";

// Notif native Steam (DisplayClientNotification, type 1 = popup + son). Le toaster
// Decky crée des entrées SANS notification_type qui ne s'affichent pas ET font
// PLANTER le panneau de notifs Steam sur ce build. Même forme que toaster.toast
// (title/body) → remplacement transparent partout.
function notify(data: { title?: string; body: string; duration?: number }) {
  try {
    const App = (window as any).App;
    const steamid = App?.GetCurrentUser?.()?.strSteamID || App?.m_CurrentUser?.strSteamID || "";
    // steamid OBLIGATOIRE : sans lui DisplayClientNotification crée une entrée
    // malformée qui fait planter le panneau de notifs Steam → on s'abstient.
    if (!steamid) return;
    (window as any).SteamClient?.ClientNotifications?.DisplayClientNotification?.(
      1,
      JSON.stringify({ title: data.title || "BC250 Toolkit", body: data.body, state: "active", steamid }),
      () => {},
    );
  } catch (e) { console.error("[BC250] notify failed", e); }
}

// Ouvre une URL dans le navigateur intégré du gamemode Steam.
const openUrl = (url: string) => {
  try { (window as any).SteamClient?.URL?.ExecuteSteamURL?.("steam://openurl/" + url); } catch {}
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RadvConfig {
  match: string;
  options: Record<string, boolean | string | number>;
}

interface GameRequires {
  uma_min_mb?: number;
  gttsize?: number;
  note?: string;
}

interface GameVariant {
  label: string;
  stability?: string;
  compat_tool?: string;
  launch_options?: string;
  radv?: RadvConfig;
  requires?: GameRequires;
}

interface GameEntry {
  name: string;
  proton: string;
  compat_tool?: string;
  proton_branch?: string;
  proton_note?: string;
  launch_options: string;
  notes?: string;
  tested_on?: string;
  radv?: RadvConfig;
  requires?: GameRequires;
  stability?: string;
  configs?: GameVariant[];
}

interface ApplyResult {
  ok: boolean;
  applied?: Record<string, unknown>;
  requires?: GameRequires | null;
  need_steam_restart?: boolean;
  compat_error?: string;
  launch_error?: string;
  radv_error?: string;
  error?: string;
}

interface GamesDB {
  [key: string]: GameEntry | Record<string, string>;
}

interface SystemStatus {
  cpu_temp?: number;
  gpu_temp?: number;
  fan_rpm?: number;
  gpu_clock_mhz?: number;
  cpu_clock_mhz?: number;
  mem_total_mb?: number;
  mem_used_mb?: number;
  scx_state?: string;
  scx_sched?: string;
  tuned_profile?: string;
  gamemode_active?: boolean;
  tweaks_installed?: boolean;
  tweaks_last_update?: string;
}

interface CuStatus {
  umr_available: boolean;
  current_profile: string | null;
  cu_count: number | null;
  boot_profile: string | null;
  boot_cu: number | null;
  profiles: Record<string, { label: string; cu: number }>;
}

interface UmaStatus {
  bios_version: string | null;
  profile_ready: boolean;
  layout_ok: boolean;
  layout_detail: string;
  vram_total_mb: number | null;
  current: {
    uma_mode?: { value: number; label: string };
    uma_frame_buffer?: { value: number; label: string };
  };
  uma_frame_buffer_options: string[];
}

type TabId = "games" | "cu" | "system" | "settings";

// ── Steam helpers (via backend Python — SteamClient.Apps.Set* cassé dans QAM) ─

// Orchestrateur backend : applique compat_tool + launch_options + radv/drirc
// d'un coup. variantIndex = null → config stable (clés top-level) ; sinon configs[i].
async function applyGameConfig(appId: number, variantIndex: number | null): Promise<ApplyResult> {
  try {
    return await call<[number, number | null], ApplyResult>("apply_game_config", appId, variantIndex);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Onglet Jeux ───────────────────────────────────────────────────────────────

interface InstalledEntry {
  appid: number;
  name: string;
  game: GameEntry;
}

function getInstalledDbGames(gamesDb: GamesDB): InstalledEntry[] {
  try {
    const allApps: any[] = (window as any).appStore?.allApps ?? [];
    return allApps
      .filter((app: any) => {
        if (!app?.installed) return false;
        const entry = gamesDb[String(app.appid)];
        return entry && "proton" in entry;
      })
      .map((app: any) => ({
        appid: app.appid as number,
        name: (app.display_name ?? app.strDisplayName ?? `App ${app.appid}`) as string,
        game: gamesDb[String(app.appid)] as GameEntry,
      }));
  } catch (_) {
    return [];
  }
}

function GamesTab({ gamesDb, savedVariants }: { gamesDb: GamesDB; savedVariants: Record<string, number> }) {
  const [installed, setInstalled] = useState<InstalledEntry[]>([]);
  const [selected, setSelected] = useState<InstalledEntry | null>(null);
  const [variantIdx, setVariantIdx] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [rowFocus, setRowFocus] = useState<number | null>(null);
  const [variantFocus, setVariantFocus] = useState<number | null>(null);

  const gameCount = Object.keys(gamesDb).filter((k) => !k.startsWith("_")).length;

  const refresh = useCallback(() => {
    const list = getInstalledDbGames(gamesDb);
    setInstalled(list);
    setSelected((prev) => (prev && list.find((e) => e.appid === prev.appid) ? prev : null));
    setApplied(false);
  }, [gamesDb]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  // Variantes du jeu sélectionné — init depuis le choix sauvegardé, sinon variante 0.
  const variants = selected?.game.configs ?? [];
  const hasConfigs = variants.length > 0;

  useEffect(() => {
    if (!selected) { setVariantIdx(null); return; }
    if (hasConfigs) {
      const saved = savedVariants[String(selected.appid)];
      setVariantIdx(typeof saved === "number" && saved >= 0 && saved < variants.length ? saved : 0);
    } else {
      setVariantIdx(null);
    }
    setApplied(false);
  }, [selected, savedVariants]); // eslint-disable-line react-hooks/exhaustive-deps

  // Config affichée = variante active si présente, sinon clés top-level.
  const activeCfg: GameVariant | null = hasConfigs && variantIdx != null ? variants[variantIdx] : null;
  const dispProton   = activeCfg?.compat_tool ?? selected?.game.compat_tool ?? selected?.game.proton;
  const dispLaunch   = activeCfg?.launch_options ?? selected?.game.launch_options;
  const dispRadv     = activeCfg?.radv ?? selected?.game.radv;
  const dispRequires = activeCfg?.requires ?? selected?.game.requires;

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      const idx = hasConfigs ? variantIdx : null;
      const r = await applyGameConfig(selected.appid, idx);
      // Mémoriser le choix de variante (réutilisé par l'auto-apply).
      call<[number, number | null], unknown>("set_game_variant", selected.appid, idx).catch(() => {});
      if (r.ok) {
        setApplied(true);
        notify({
          title: "BC250 Toolkit",
          body: r.need_steam_restart ? t("toast_persistent") : t("toast_applied", { name: selected.game.name }),
          duration: 4000,
        });
      } else {
        const detail = r.error ?? r.compat_error ?? r.launch_error ?? r.radv_error ?? "?";
        notify({ title: "BC250 Toolkit", body: t("toast_error", { detail }), duration: 5000 });
        setApplied(false);
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <PanelSection>
        <PanelSectionRow>
          <Field label="DB" description={t("db_optimized")}>
            <span style={{ color: "#67a3ff", fontWeight: "bold" }}>{t("db_count", { count: gameCount })}</span>
          </Field>
        </PanelSectionRow>
      </PanelSection>

      {installed.length > 0 ? (
        <PanelSection title={t("installed_compat")}>
          <PanelSectionRow>
            <Focusable style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
              {installed.map((entry) => {
                const isSelected = selected?.appid === entry.appid;
                return (
                  <div key={entry.appid}>
                    <GameRow
                      name={entry.name}
                      appid={entry.appid}
                      selected={isSelected}
                      focused={rowFocus === entry.appid}
                      onClick={() => { setSelected(isSelected ? null : entry); setApplied(false); }}
                      onFocus={() => setRowFocus(entry.appid)}
                      onBlur={() => setRowFocus((f: any) => (f === entry.appid ? null : f))}
                    />
                    {/* Options du jeu — dépliées INLINE juste sous le jeu (façon lobby
                        sous un serveur Steamcord), compactes, pas besoin de scroller. */}
                    {isSelected && (
                      <div style={{
                        marginLeft: 10, marginTop: 4, marginBottom: 6, paddingLeft: 8,
                        borderLeft: "2px solid rgba(88,101,242,0.45)",
                        display: "flex", flexDirection: "column", gap: 5,
                      }}>
                        {hasConfigs && (
                          <Focusable flow-children="horizontal" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {variants.map((v, i) => {
                              const isActive = variantIdx === i;
                              const isFocused = variantFocus === i;
                              const color = v.stability === "experimental" ? "#ff9800" : "#4caf50";
                              return (
                                <Btn key={i} onClick={() => { setVariantIdx(i); setApplied(false); }}
                                  onFocus={() => setVariantFocus(i)}
                                  onBlur={() => setVariantFocus((f) => (f === i ? null : f))}
                                  style={{
                                    padding: "3px 8px", fontSize: 10, minHeight: 0, minWidth: 0, margin: 0, borderRadius: 5,
                                    color: "#fff", fontWeight: isActive ? 700 : 400,
                                    background: isActive ? color : "rgba(255,255,255,0.08)",
                                    // Halo blanc + lueur + léger zoom = curseur manette (kit partagé).
                                    ...focusHalo(color, isFocused, 1.06),
                                  }}>
                                  {v.label}
                                </Btn>
                              );
                            })}
                          </Focusable>
                        )}
                        <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.45 }}>
                          <div><span style={{ color: "#67a3ff" }}>{t("label_proton")}:</span> {dispProton}{selected?.game.proton_branch ? ` — ${selected.game.proton_branch}` : ""}</div>
                          {selected?.game.proton_note && <div style={{ color: "#ff9800" }}>{selected.game.proton_note}</div>}
                          {dispLaunch && <div style={{ wordBreak: "break-all" }}><span style={{ color: "#67a3ff" }}>{t("label_launch")}:</span> {dispLaunch}</div>}
                          {dispRadv && <div><span style={{ color: "#67a3ff" }}>{t("label_radv")}:</span> {Object.entries(dispRadv.options).map(([k, v]) => `${k}=${v}`).join(", ")}</div>}
                          {dispRequires?.uma_min_mb && (
                            <div style={{ color: "#ff9800", borderLeft: "3px solid #ff9800", paddingLeft: 6, marginTop: 2 }}>
                              {t("req_uma", { mb: dispRequires.uma_min_mb })}{dispRequires.note ? ` — ${dispRequires.note}` : ""}
                            </div>
                          )}
                          {selected?.game.notes && <div style={{ color: "#ccc", marginTop: 2 }}>{selected.game.notes}</div>}
                        </div>
                        <ActionCard color="#4caf50" active={applied} disabled={applying || applied} onClick={handleApply}>
                          {applying ? t("btn_applying") : applied ? t("btn_applied") : t("btn_apply")}
                        </ActionCard>
                      </div>
                    )}
                  </div>
                );
              })}
            </Focusable>
          </PanelSectionRow>
        </PanelSection>
      ) : (
        <PanelSection>
          <PanelSectionRow>
            <Field>
              <div style={{ color: "#888", fontSize: "12px", textAlign: "center", padding: "8px 0" }}>
                {t("no_games")}
              </div>
            </Field>
          </PanelSectionRow>
        </PanelSection>
      )}

      <PanelSection>
        <PanelSectionRow>
          <ActionCard onClick={refresh}><IcRefresh /> {t("btn_refresh")}</ActionCard>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
}

// ── Onglet CU ─────────────────────────────────────────────────────────────────

const CU_PROFILE_LIST = [
  { key: "stock", label: "24 CU (stock)",  color: "#4caf50" },
  { key: "32cu",  label: "32 CU",          color: "#67a3ff" },
  { key: "36cu",  label: "36 CU",          color: "#ff9800" },
  { key: "40cu",  label: "40 CU (full)",   color: "#f44336" },
] as const;

// Tailles UMA proposées (plafonnées à 8G — au-delà il ne reste plus assez de RAM
// système sur les 16 Go partagés). Auto = le firmware décide (≈8 Go, valeur sûre).
const UMA_SIZE_LIST = [
  { key: "Auto", suffix: " (≈8G)", color: "#4caf50" },
  { key: "2G",   suffix: "",       color: "#67a3ff" },
  { key: "4G",   suffix: "",       color: "#ff9800" },
  { key: "8G",   suffix: "",       color: "#f44336" },
] as const;

function CuTab() {
  const [status, setStatus] = useState<CuStatus | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [saveBoot, setSaveBoot] = useState(false);
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const [installingUmr, setInstallingUmr] = useState(false);
  const [profFocus, setProfFocus] = useState<string | null>(null);
  const [uma, setUma] = useState<UmaStatus | null>(null);
  const [umaWriting, setUmaWriting] = useState<string | null>(null);
  const [umaMsg, setUmaMsg] = useState<string | null>(null);
  const [umaFocus, setUmaFocus] = useState<string | null>(null);

  const refresh = useCallback(() => {
    call<[], CuStatus>("get_cu_status").then(setStatus);
    call<[], UmaStatus>("get_uma_status").then(setUma).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [refresh]);

  const handleInstallUmr = async () => {
    setInstallingUmr(true);
    setLastMsg(null);
    notify({ title: "BC250 Toolkit", body: t("toast_umr_start"), duration: 5000 });
    try {
      const r = await call<[], { ok: boolean; already?: boolean; error?: string }>("install_umr");
      if (r.ok) {
        const msg = r.already ? t("toast_umr_already") : t("toast_umr_ok");
        setLastMsg(msg);
        notify({ title: "BC250 Toolkit", body: msg, duration: 4000 });
        refresh();
      } else {
        const msg = t("toast_umr_fail", { error: r.error ?? "" });
        setLastMsg(msg);
        notify({ title: "BC250 Toolkit", body: msg, duration: 6000 });
      }
    } finally {
      setInstallingUmr(false);
    }
  };

  const applyProfile = async (profileKey: string) => {
    setApplying(profileKey);
    setLastMsg(null);
    try {
      const r = await call<[string, boolean], { ok: boolean; error?: string; cu_count?: number; boot_saved?: boolean; boot_error?: string }>(
        "apply_cu_profile", profileKey, saveBoot
      );
      if (r.ok) {
        let msg = saveBoot
          ? t("cu_done_boot", { count: r.cu_count ?? 0 })
          : t("cu_done_live", { count: r.cu_count ?? 0 });
        if (saveBoot && r.boot_saved === false) {
          msg = `${t("cu_done_live", { count: r.cu_count ?? 0 })} — boot: ✗ ${r.boot_error ?? "sudoers?"}`;
        }
        setLastMsg(msg);
        notify({ title: "BC250 Toolkit", body: msg, duration: saveBoot && r.boot_saved === false ? 6000 : 3000 });
        refresh();
      } else {
        const msg = `✗ ${r.error}`;
        setLastMsg(msg);
        notify({ title: "BC250 Toolkit", body: msg, duration: 4000 });
      }
    } finally {
      setApplying(null);
    }
  };

  const applyUma = async (label: string) => {
    setUmaWriting(label);
    setUmaMsg(null);
    try {
      const r = await call<[string], { ok: boolean; error?: string }>("set_uma_frame_buffer", label);
      if (r.ok) {
        const msg = t("uma_done", { label });
        setUmaMsg(msg);
        notify({ title: "BC250 Toolkit", body: msg, duration: 6000 });
        call<[], UmaStatus>("get_uma_status").then(setUma).catch(() => {});
      } else {
        const msg = `✗ ${r.error}`;
        setUmaMsg(msg);
        notify({ title: "BC250 Toolkit", body: msg, duration: 6000 });
      }
    } finally {
      setUmaWriting(null);
    }
  };

  if (!status) return <SteamSpinner />;

  // Réglage UMA effectif côté BIOS : mode Auto OU taille Auto = le firmware décide.
  const umaFb = uma?.current?.uma_frame_buffer?.label ?? null;
  const umaTarget = uma?.current?.uma_mode?.label === "Auto" || umaFb === "Auto" ? "Auto" : umaFb;
  const umaSupported = !!uma && uma.profile_ready && uma.layout_ok;

  return (
    <>
      {/* Statut CU */}
      <PanelSection title={t("cu_title")}>
        <PanelSectionRow>
          <Field label={t("cu_live")}>
            <span style={{ fontWeight: "bold", color: "#67a3ff", fontSize: "14px" }}>
              {status.cu_count != null && status.cu_count > 0
                ? `${status.cu_count} / 40 CU`
                : status.umr_available
                  ? t("cu_reading")
                  : t("cu_na")}
            </span>
          </Field>
        </PanelSectionRow>
        {status.boot_cu != null && (
          <PanelSectionRow>
            <Field label={t("cu_boot")}>
              <span style={{ fontSize: "12px", color: "#aaa" }}>
                {status.boot_cu} CU{status.boot_profile ? ` (${status.boot_profile})` : ""}
              </span>
            </Field>
          </PanelSectionRow>
        )}
        {!status.umr_available && (
          <>
            <PanelSectionRow>
              <Field>
                <div style={{
                  fontSize: "12px", color: "#ff9800", lineHeight: "1.4",
                  borderLeft: "3px solid #ff9800", paddingLeft: "8px",
                }}>
                  {t("cu_no_umr")}
                </div>
              </Field>
            </PanelSectionRow>
            <PanelSectionRow>
              <ActionCard disabled={installingUmr} onClick={handleInstallUmr}>
                <IcDownload /> {installingUmr ? t("cu_installing_umr") : t("cu_install_umr")}
              </ActionCard>
            </PanelSectionRow>
          </>
        )}
      </PanelSection>

      {/* Avertissement + conseils fusionnés */}
      <PanelSection title={t("cu_warn_title")}>
        <PanelSectionRow>
          <div style={{
            fontSize: "13px", color: "#ff9800", lineHeight: "1.5",
            borderLeft: "3px solid #ff9800", paddingLeft: "10px",
            paddingTop: "6px", paddingBottom: "6px",
            background: "rgba(255,152,0,0.08)", borderRadius: "0 4px 4px 0",
          }}>
            {t("cu_disclaimer")}
          </div>
        </PanelSectionRow>
      </PanelSection>

      {/* Profils */}
      <PanelSection title={t("cu_profiles")}>
        <PanelSectionRow>
          <Focusable style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CU_PROFILE_LIST.map(({ key, label, color }) => {
              const isActive   = status.current_profile === key;
              const isBoot     = status.boot_profile === key;
              const isApplying = applying === key;
              const suffix     = isBoot && !isActive ? " [boot]" : isActive && isBoot ? " [live+boot]" : "";
              return (
                <CardBtn
                  key={key}
                  active={isActive}
                  focused={profFocus === key}
                  color={color}
                  disabled={!!applying || !status.umr_available}
                  onClick={() => applyProfile(key)}
                  onFocus={() => setProfFocus(key)}
                  onBlur={() => setProfFocus((f) => (f === key ? null : f))}
                >
                  <span style={{ flex: 1, textAlign: "left" }}>
                    {isApplying ? t("cu_applying") : `${label}${suffix}`}
                  </span>
                  {isActive && <span style={{ fontSize: 10 }}>●</span>}
                </CardBtn>
              );
            })}
          </Focusable>
        </PanelSectionRow>
      </PanelSection>

      {/* Options */}
      <PanelSection title={t("cu_options")}>
        <PanelSectionRow>
          <ToggleField
            label={t("cu_save_boot")}
            description={t("cu_save_boot_desc")}
            checked={saveBoot}
            onChange={setSaveBoot}
          />
        </PanelSectionRow>
        {lastMsg && (
          <PanelSectionRow>
            <Field>
              <div style={{
                fontSize: "11px",
                color: lastMsg.startsWith("✓") ? "#4caf50" : "#f44336",
                lineHeight: "1.4",
              }}>
                {lastMsg}
              </div>
            </Field>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* VRAM (UMA Frame Buffer) — patch NVRAM BIOS, effectif au prochain reboot */}
      {uma && (
        <PanelSection title={t("uma_title")}>
          <PanelSectionRow>
            <Field label={t("uma_live")}>
              <span style={{ fontWeight: "bold", color: "#67a3ff", fontSize: "14px" }}>
                {uma.vram_total_mb != null ? `${uma.vram_total_mb} MB` : t("cu_na")}
              </span>
            </Field>
          </PanelSectionRow>
          {umaTarget && (
            <PanelSectionRow>
              <Field label={t("uma_bios")}>
                <span style={{ fontSize: "12px", color: "#aaa" }}>{umaTarget}</span>
              </Field>
            </PanelSectionRow>
          )}
          {!umaSupported && (
            <PanelSectionRow>
              <Field>
                <div style={{
                  fontSize: "12px", color: "#ff9800", lineHeight: "1.4",
                  borderLeft: "3px solid #ff9800", paddingLeft: "8px",
                }}>
                  {t("uma_not_supported", { detail: uma.layout_detail || uma.bios_version || "?" })}
                </div>
              </Field>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}

      {uma && umaSupported && (
        <PanelSection title={t("uma_sizes")}>
          <PanelSectionRow>
            <div style={{
              fontSize: "13px", color: "#ff9800", lineHeight: "1.5",
              borderLeft: "3px solid #ff9800", paddingLeft: "10px",
              paddingTop: "6px", paddingBottom: "6px",
              background: "rgba(255,152,0,0.08)", borderRadius: "0 4px 4px 0",
            }}>
              {t("uma_disclaimer")}
            </div>
          </PanelSectionRow>
          <PanelSectionRow>
            <Focusable style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {UMA_SIZE_LIST.map(({ key, suffix, color }) => {
                const isActive  = umaTarget === key;
                const isWriting = umaWriting === key;
                return (
                  <CardBtn
                    key={key}
                    active={isActive}
                    focused={umaFocus === key}
                    color={color}
                    disabled={!!umaWriting}
                    onClick={() => applyUma(key)}
                    onFocus={() => setUmaFocus(key)}
                    onBlur={() => setUmaFocus((f) => (f === key ? null : f))}
                  >
                    <span style={{ flex: 1, textAlign: "left" }}>
                      {isWriting ? t("uma_writing") : `${key}${suffix}`}
                    </span>
                    {isActive && <span style={{ fontSize: 10 }}>●</span>}
                  </CardBtn>
                );
              })}
            </Focusable>
          </PanelSectionRow>
          {umaMsg && (
            <PanelSectionRow>
              <Field>
                <div style={{
                  fontSize: "11px",
                  color: umaMsg.startsWith("✓") ? "#4caf50" : "#f44336",
                  lineHeight: "1.4",
                }}>
                  {umaMsg}
                </div>
              </Field>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}

      <PanelSection>
        <PanelSectionRow>
          <Field>
            <div style={{
              fontSize: "10px", color: "#888", lineHeight: "1.5",
              whiteSpace: "pre-line", textAlign: "center",
            }}>
              {t("cu_legend")}
            </div>
          </Field>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
}

// ── Onglet Système ────────────────────────────────────────────────────────────

function SystemTab() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [cu, setCu] = useState<CuStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string | null>(null);

  useEffect(() => {
    // get_cu_status déclenche la lecture umr en fond si le cache est vide →
    // le compte CU s'affiche ici même si l'onglet CU/UMA n'a jamais été ouvert.
    const poll = () => {
      call<[], SystemStatus>("get_system_status").then(setStatus);
      call<[], CuStatus>("get_cu_status").then(setCu).catch(() => {});
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateLog(null);
    try {
      const r = await call<[], { success: boolean; stdout?: string; error?: string }>("run_tweaks_update");
      setUpdateLog(r.success ? (r.stdout ?? "OK") : (r.error ?? "Erreur inconnue"));
      notify({
        title: "BC250 Toolkit",
        body: r.success ? t("sys_toast_ok") : t("sys_toast_fail"),
        duration: 4000,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!status) return <SteamSpinner />;

  const tempColor = (v?: number) =>
    !v ? "#888" : v > 85 ? "#f44336" : v > 70 ? "#ff9800" : "#4caf50";

  const gb = (mb: number) => `${(mb / 1024).toFixed(1)} GB`;
  const ramPct = status.mem_total_mb && status.mem_used_mb != null
    ? Math.round((status.mem_used_mb / status.mem_total_mb) * 100)
    : null;
  const ramColor = ramPct == null ? "#888" : ramPct > 85 ? "#f44336" : ramPct > 70 ? "#ff9800" : "#4caf50";

  // Chaque ligne d'info est enveloppée dans un Focusable → devient un arrêt de
  // navigation manette : le D-pad descend de ligne en ligne et le QAM défile
  // pour suivre le focus (sinon, avec des champs d'affichage non focusables, la
  // manette reste bloquée en haut et on ne voit pas le bas de l'onglet).
  const InfoRow = ({ label, children }: any) => (
    <PanelSectionRow>
      <Focusable style={{ borderRadius: 4 }}>
        <Field label={label} bottomSeparator="none">{children}</Field>
      </Focusable>
    </PanelSectionRow>
  );
  return (
    <>
      <PanelSection title={t("sys_temps")}>
        <InfoRow label="CPU">
          <span style={{ fontWeight: "bold" }}>
            <span style={{ color: tempColor(status.cpu_temp) }}>
              {status.cpu_temp != null ? `${status.cpu_temp}°C` : t("cu_na")}
            </span>
            {status.cpu_clock_mhz != null &&
              <span style={{ color: "#a24bfa" }}>{`  ·  ${status.cpu_clock_mhz} MHz`}</span>}
          </span>
        </InfoRow>
        <InfoRow label="GPU">
          <span style={{ fontWeight: "bold" }}>
            <span style={{ color: tempColor(status.gpu_temp) }}>
              {status.gpu_temp != null ? `${status.gpu_temp}°C` : t("cu_na")}
            </span>
            {status.gpu_clock_mhz != null &&
              <span style={{ color: "#a24bfa" }}>{`  ·  ${status.gpu_clock_mhz} MHz`}</span>}
          </span>
        </InfoRow>
        <InfoRow label={t("sys_fan")}>
          <span style={{ color: status.fan_rpm ? "#67a3ff" : "#888", fontWeight: "bold" }}>
            {status.fan_rpm != null ? `${status.fan_rpm} RPM` : t("cu_na")}
          </span>
        </InfoRow>
      </PanelSection>

      <PanelSection title={t("sys_res")}>
        <InfoRow label={t("sys_ram")}>
          <span style={{ color: "#67a3ff", fontWeight: "bold" }}>
            {status.mem_total_mb != null ? gb(status.mem_total_mb) : t("cu_na")}
          </span>
        </InfoRow>
        <InfoRow label={t("sys_ram_used")}>
          <span style={{ color: ramColor, fontWeight: "bold" }}>
            {status.mem_used_mb != null
              ? `${gb(status.mem_used_mb)}${ramPct != null ? ` (${ramPct}%)` : ""}`
              : t("cu_na")}
          </span>
        </InfoRow>
        <InfoRow label={t("sys_cu")}>
          <span style={{ color: "#67a3ff", fontWeight: "bold" }}>
            {cu?.cu_count != null && cu.cu_count > 0 ? `${cu.cu_count} / 40` : t("cu_na")}
          </span>
        </InfoRow>
      </PanelSection>

      <PanelSection title={t("sys_status")}>
        <InfoRow label={t("sys_scheduler")}>
          <span style={{ color: status.scx_state === "enabled" ? "#4caf50" : "#f44336", fontSize: "12px" }}>
            {status.scx_state === "enabled"
              ? `✓ ${status.scx_sched ?? "scx"}`
              : `✗ ${status.scx_state ?? t("sys_unknown")}`}
          </span>
        </InfoRow>
        <InfoRow label={t("sys_tuned")}>
          <span style={{ fontSize: "11px", color: "#ccc" }}>{status.tuned_profile ?? t("sys_unknown")}</span>
        </InfoRow>
        <InfoRow label={t("sys_gamemode")}>
          <span style={{ color: status.gamemode_active ? "#4caf50" : "#f44336" }}>
            {status.gamemode_active ? t("sys_active") : t("sys_inactive")}
          </span>
        </InfoRow>
      </PanelSection>

      {status.tweaks_installed && (
        <PanelSection title="bc250-tweaks">
          {status.tweaks_last_update && (
            <InfoRow label={t("sys_last_update")}>
              <span style={{ fontSize: "10px", color: "#aaa" }}>{status.tweaks_last_update}</span>
            </InfoRow>
          )}
          <PanelSectionRow>
            <ActionCard disabled={updating} onClick={handleUpdate}>
              <IcRefresh /> {updating ? t("sys_btn_updating") : t("sys_btn_update")}
            </ActionCard>
          </PanelSectionRow>
          {updateLog && (
            <PanelSectionRow>
              <Field label={t("sys_log")}>
                <div style={{
                  fontSize: "10px", fontFamily: "monospace", color: "#aaa",
                  maxHeight: "100px", overflow: "auto", whiteSpace: "pre-wrap",
                }}>
                  {updateLog.slice(-1500)}
                </div>
              </Field>
            </PanelSectionRow>
          )}
        </PanelSection>
      )}
    </>
  );
}

// ── Onglet Réglages ───────────────────────────────────────────────────────────

function SettingsTab({
  autoApply,
  setAutoApply,
  gamesDb,
  onRefreshDb,
}: {
  autoApply: boolean;
  setAutoApply: (v: boolean) => void;
  gamesDb: GamesDB;
  onRefreshDb: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [version, setVersion] = useState<string>("");
  const meta = gamesDb["_meta"] as Record<string, string> | undefined;

  useEffect(() => {
    call<[], string>("get_version").then((v) => setVersion(v || "")).catch(() => {});
  }, []);

  const doRefresh = async () => {
    setRefreshing(true);
    try { await onRefreshDb(); } finally { setRefreshing(false); }
  };

  // ── Mises à jour (release-based) ──
  const [autoUpd, setAutoUpd] = useState(true);
  const [updStatus, setUpdStatus] = useState<
    "idle" | "checking" | "available" | "uptodate" | "installing" | "failed"
  >("idle");
  const [updErr, setUpdErr] = useState("");
  const [updLatest, setUpdLatest] = useState("");
  const [updCurrent, setUpdCurrent] = useState("");
  const [updUrl, setUpdUrl] = useState("");

  useEffect(() => {
    call<[], boolean>("get_autoupdate").then((v) => setAutoUpd(!!v)).catch(() => {});
  }, []);

  const onToggleAutoUpd = (v: boolean) => {
    setAutoUpd(v);
    call<[boolean], boolean>("set_autoupdate", v).catch(() => {});
  };

  const checkUpd = async () => {
    setUpdStatus("checking");
    try {
      const info: any = await call<[], any>("check_update");
      setUpdCurrent(info?.current || "");
      if (info?.update_available) {
        setUpdLatest(info.latest); setUpdUrl(info.url); setUpdStatus("available");
      } else {
        setUpdStatus("uptodate");
      }
    } catch { setUpdStatus("idle"); }
  };

  const installUpd = async () => {
    setUpdStatus("installing");
    // Backend unpacks the release and restarts plugin_loader on success. On
    // failure it returns {ok:false, error} — show it instead of hanging on
    // "installing…" forever.
    try {
      const r: any = await call<[string], any>("apply_update", updUrl);
      if (!(r === true || r?.ok)) { setUpdErr(r?.error || ""); setUpdStatus("failed"); }
    } catch { setUpdStatus("failed"); }
  };

  const updLabel =
    updStatus === "checking" ? t("update_checking")
    : updStatus === "installing" ? t("update_installing")
    : updStatus === "available" ? t("update_install", { v: updLatest })
    : updStatus === "uptodate" ? t("update_up_to_date", { v: updCurrent })
    : updStatus === "failed" ? t("update_failed")
    : t("update_check");

  return (
    <>
    <PanelSection>
      <PanelSectionRow>
        <ToggleField
          label={t("set_auto")}
          description={t("set_auto_desc")}
          checked={autoApply}
          onChange={setAutoApply}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ActionCard disabled={refreshing} onClick={doRefresh}>
          <IcRefresh /> {refreshing ? t("set_refreshing") : t("set_refresh_db")}
        </ActionCard>
      </PanelSectionRow>
      {meta?.updated && (
        <PanelSectionRow>
          <Field label={t("set_db_date")}>
            <span style={{ fontSize: "11px", color: "#888" }}>{meta.updated}</span>
          </Field>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <Field label={t("set_contribute")}>
          <div style={{ fontSize: "11px", color: "#67a3ff" }}>
            github.com/Necrosiak/bc250-toolkit-decky
          </div>
        </Field>
      </PanelSectionRow>
    </PanelSection>
    <PanelSection title={t("update_section")}>
      <PanelSectionRow>
        <ToggleField
          label={t("update_auto")}
          checked={autoUpd}
          onChange={onToggleAutoUpd}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ActionCard
          color={updStatus === "available" ? "#23a55a" : undefined}
          active={updStatus === "available"}
          disabled={updStatus === "checking" || updStatus === "installing"}
          onClick={updStatus === "available" ? installUpd : checkUpd}
        >
          {updStatus === "available" ? <IcDownload /> : updStatus === "failed" ? <IcWarn /> : <IcRefresh />} {updLabel}
        </ActionCard>
      </PanelSectionRow>
      {updStatus === "failed" && updErr ? (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.8, wordBreak: "break-word" }}>{updErr}</div>
        </PanelSectionRow>
      ) : null}
    </PanelSection>

    {/* À propos rapide */}
    <PanelSection title={t("about")}>
      <PanelSectionRow>
        <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>
          <div><b style={{ color: "#fff" }}>BC250 Toolkit</b>{version ? ` v${version}` : ""}</div>
          <div>{t("about_by")} <span style={{ color: "#67a3ff" }}>Necrosiak</span></div>
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ActionCard onClick={() => openUrl("https://github.com/Necrosiak/bc250-toolkit-decky")}>
<IcGithub /> GitHub
        </ActionCard>
      </PanelSectionRow>
    </PanelSection>
    </>
  );
}

// ── Barre d'onglets ───────────────────────────────────────────────────────────

type TabDef = { id: TabId; tKey: string; icon: ReactNode };

const TAB_DEFS: TabDef[] = [
  { id: "games",    tKey: "tab_games",    icon: <IcController /> },
  { id: "cu",       tKey: "tab_cu",       icon: <IcLightning /> },
  { id: "system",   tKey: "tab_system",   icon: <IcThermometer /> },
  { id: "settings", tKey: "tab_settings", icon: <IcGear /> },
];

const BtnTab = DialogButton as any;
const Btn = DialogButton as any;

// Accent Discord blurple — accent principal, comme SkullKey/Steamcord.
const ACCENT = "#5865f2";

// Halo de focus partagé : anneau blanc + lueur couleur + léger zoom (signature
// visuelle SkullKey). Unique source de vérité, injectée dans le style de chaque
// contrôle → tous les plugins Necrosiak se ressemblent.
function focusHalo(color: string, focused: boolean, scale = 1.02) {
  const c = color || ACCENT;
  return {
    boxShadow: focused ? `0 0 0 2px #fff, 0 0 8px 1px ${c}` : "none",
    transform: focused ? `scale(${scale})` : "scale(1)",
    transition: "box-shadow .08s ease, transform .08s ease",
    zIndex: focused ? 1 : 0,
  };
}

// Carte cliquable réutilisable façon Steamcord (liste de profils/actions) : fond
// couleur si actif, halo blanc + lueur au focus manette. Hoistée (function).
function CardBtn({ active, focused, color, disabled, center, onClick, onFocus, onBlur, children }: any) {
  const c = color || ACCENT;
  return (
    <Btn
      disabled={disabled}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start",
        gap: 8, width: "100%",
        padding: "7px 10px", margin: 0, minHeight: 0, boxSizing: "border-box",
        borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: active ? 700 : 400,
        background: active ? c : "rgba(255,255,255,0.05)",
        border: active ? "1px solid " + c : "1px solid transparent",
        opacity: disabled ? 0.5 : 1,
        ...focusHalo(c, focused),
      }}
    >
      {children}
    </Btn>
  );
}

// CardBtn d'action isolé (Système / Réglages) : gère son propre focus, centré.
// Pas besoin de remonter l'état au parent comme pour les listes Jeux/CU.
function ActionCard({ color, active, disabled, onClick, children }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <CardBtn
      color={color}
      active={active}
      disabled={disabled}
      focused={focused}
      center
      onClick={onClick}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </CardBtn>
  );
}

// Ligne de jeu façon « serveur Steamcord » : icône Steam du jeu (sinon pastille
// colorée + initiale), nom, surbrillance bleue si sélectionné.
function GameRow({ name, appid, selected, focused, onClick, onFocus, onBlur }: any) {
  const ov = (window as any).appStore?.GetAppOverviewByAppID?.(Number(appid));
  const iconHash = ov?.icon_hash || ov?.icon_data;
  const iconUrl = iconHash
    ? `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`
    : null;
  return (
    <Btn
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "6px 8px", margin: 0, minHeight: 0, boxSizing: "border-box", borderRadius: 6,
        background: focused ? "rgba(88,101,242,0.55)" : selected ? "rgba(88,101,242,0.25)" : "rgba(255,255,255,0.04)",
        border: selected ? "1px solid rgba(88,101,242,0.6)" : "1px solid transparent",
        ...focusHalo(ACCENT, focused),
      }}
    >
      {iconUrl ? (
        <img src={iconUrl} width={24} height={24} style={{ borderRadius: 6, flexShrink: 0, display: "block" }} />
      ) : (
        <div style={{ width: 24, height: 24, borderRadius: 6, background: "#5865f2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>
          {(name || "?")[0].toUpperCase()}
        </div>
      )}
      <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: selected ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
      {selected && <span style={{ fontSize: 10, color: "#67a3ff", flexShrink: 0 }}>▶</span>}
    </Btn>
  );
}

// Onglet façon Steamcord : fond bleu plein au focus manette, bleu estompé si
// actif, anneau blanc au focus. Rangée Focusable horizontale = nav D-pad correcte.
function TabBtn({ active, focused, onClick, onFocus, onBlur, children }: any) {
  return (
    <BtnTab
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        flex: "1 1 0", minWidth: 0, margin: 0, padding: "5px 2px",
        fontSize: 11, minHeight: 0, boxSizing: "border-box", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        background: focused
          ? "rgba(88,101,242,0.85)"
          : active ? "rgba(88,101,242,0.35)" : "rgba(255,255,255,0.06)",
        fontWeight: active ? 700 : 400,
        ...focusHalo(ACCENT, focused),
        transition: "background .08s ease, box-shadow .08s ease, transform .08s ease",
      }}
    >
      {children}
    </BtnTab>
  );
}

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <PanelSection>
      <PanelSectionRow>
        <Focusable
          flow-children="horizontal"
          style={{ display: "flex", gap: 4, width: "100%", boxSizing: "border-box" }}
        >
          {TAB_DEFS.map(({ id, tKey, icon }) => (
            <TabBtn
              key={id}
              active={tab === id}
              focused={focused === id}
              onClick={() => setTab(id)}
              onFocus={() => setFocused(id)}
              onBlur={() => setFocused((f) => (f === id ? null : f))}
            >
              <span>{icon}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t(tKey)}</span>
            </TabBtn>
          ))}
        </Focusable>
      </PanelSectionRow>
    </PanelSection>
  );
}

// ── Plugin principal ──────────────────────────────────────────────────────────

function Content() {
  const [tab, setTab] = useState<TabId>("games");
  const [autoApply, setAutoApplyState] = useState(false);
  const [savedVariants, setSavedVariants] = useState<Record<string, number>>({});
  const [gamesDb, setGamesDb] = useState<GamesDB>({});
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    call<[], GamesDB>("get_games_db").then((db) => {
      setGamesDb(db);
      setDbLoaded(true);
    });
    call<[], boolean>("get_auto_apply").then((v) => setAutoApplyState(!!v)).catch(() => {});
    call<[], Record<string, number>>("get_game_variants").then((v) => setSavedVariants(v ?? {})).catch(() => {});
  }, []);

  // Toggle persistant + (dés)activation immédiate du pré-câblage des jeux installés.
  const setAutoApply = (v: boolean) => {
    setAutoApplyState(v);
    call<[boolean], boolean>("set_auto_apply", v).catch(() => {});
    if (v) {
      const games = getInstalledDbGames(gamesDb);
      Promise.all(
        games.map((g) => {
          const cfgs = g.game.configs;
          const idx = cfgs && cfgs.length > 0
            ? (savedVariants[String(g.appid)] ?? 0)
            : null;
          return applyGameConfig(g.appid, idx);
        })
      ).then((rs) => {
        const n = rs.filter((r) => r.ok).length;
        notify({ title: "BC250 Toolkit", body: t("toast_autoapply_on", { count: n }), duration: 4000 });
      }).catch(() => {});
    }
  };

  const refreshDb = async () => {
    const db = await call<[], GamesDB>("refresh_games_db");
    setGamesDb(db);
    notify({ title: "BC250 Toolkit", body: t("toast_db_ok"), duration: 2000 });
  };

  if (!dbLoaded) return <SteamSpinner />;

  return (
    <>
      <TabBar tab={tab} setTab={setTab} />
      {tab === "games"    && <GamesTab gamesDb={gamesDb} savedVariants={savedVariants} />}
      {tab === "cu"       && <CuTab />}
      {tab === "system"   && <SystemTab />}
      {tab === "settings" && (
        <SettingsTab
          autoApply={autoApply}
          setAutoApply={setAutoApply}
          gamesDb={gamesDb}
          onRefreshDb={refreshDb}
        />
      )}
    </>
  );
}

export default definePlugin(() => {
  // Auto-apply persistant : enregistré au chargement du plugin (= démarrage Steam),
  // actif toute la session même panneau fermé. À chaque jeu lancé connu de la DB,
  // si l'auto-apply est activé, on (ré)applique sa config (variante sauvegardée).
  // Les fichiers étant persistants (config.vdf / ~/.drirc / launch options), l'effet
  // est garanti au lancement suivant.
  let unreg: (() => void) | undefined;
  try {
    const reg = (window as any).SteamClient?.GameSessions?.RegisterForAppLifetimeNotifications;
    if (typeof reg === "function") {
      unreg = reg(async (e: any) => {
        if (!e?.bRunning) return;
        try {
          const enabled = await call<[], boolean>("get_auto_apply");
          if (!enabled) return;
          const db = await call<[], GamesDB>("get_games_db");
          const entry = db[String(e.unAppID)];
          if (!entry || !("proton" in entry)) return;
          const g = entry as GameEntry;
          const variants = await call<[], Record<string, number>>("get_game_variants").catch(() => ({}));
          const hasConfigs = Array.isArray(g.configs) && g.configs.length > 0;
          const idx = hasConfigs ? (variants[String(e.unAppID)] ?? 0) : null;
          const r = await applyGameConfig(e.unAppID, idx);
          notify({
            title: "BC250 Toolkit",
            body: r.ok ? t("toast_applied", { name: g.name }) : t("toast_error", { detail: r.error ?? "?" }),
            duration: 3000,
          });
        } catch (_) {}
      });
    }
  } catch (_) {}

  return {
    name: "BC250 Toolkit",
    title: <div className={staticClasses.Title}>BC250 Toolkit</div>,
    icon: <FaMicrochip />,
    content: <Content />,
    onDismount() { try { unreg?.(); } catch (_) {} },
  };
});
