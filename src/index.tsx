import { useEffect, useState, useCallback } from "react";
import { FaMicrochip } from "react-icons/fa";
import {
  staticClasses,
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Field,
  ToggleField,
  SteamSpinner,
} from "@decky/ui";
import { definePlugin, call, toaster } from "@decky/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameEntry {
  name: string;
  proton: string;
  proton_branch?: string;
  proton_note?: string;
  launch_options: string;
  notes?: string;
  tested_on?: string;
}

interface GamesDB {
  [key: string]: GameEntry | Record<string, string>;
}

interface SystemStatus {
  cpu_temp?: number;
  gpu_temp?: number;
  scx_state?: string;
  scx_sched?: string;
  tuned_profile?: string;
  gamemode_active?: boolean;
  tweaks_installed?: boolean;
  tweaks_last_update?: string;
}

type Tab = "games" | "system" | "settings";

// ── Steam helpers ─────────────────────────────────────────────────────────────

function getCurrentAppId(): number | null {
  try {
    const hash = window.location.hash;
    const m = hash.match(/\/app\/(\d+)/);
    if (m) return parseInt(m[1], 10);
  } catch (_) {}
  return null;
}

async function setLaunchOptions(appId: number, opts: string): Promise<boolean> {
  try {
    await (window as any).SteamClient.Apps.SetLaunchOptions(appId, opts);
    return true;
  } catch (_) {
    return false;
  }
}

async function setCompatTool(appId: number, protonName: string): Promise<boolean> {
  try {
    const tools: any[] = await (window as any).SteamClient.Apps.GetAvailableCompatTools(appId);
    const tool = tools.find(
      (t: any) => (t.strDisplayName ?? "").includes(protonName) || (t.strToolName ?? "").includes(protonName)
    );
    if (!tool) return false;
    await (window as any).SteamClient.Apps.SpecifyCompatTool(appId, tool.strToolName);
    return true;
  } catch (_) {
    return false;
  }
}

// ── Tab styles ────────────────────────────────────────────────────────────────

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "6px 4px",
  fontSize: "12px",
  fontWeight: active ? "bold" : "normal",
  color: active ? "#fff" : "#aaa",
  background: active ? "rgba(255,255,255,0.12)" : "transparent",
  border: "none",
  borderBottom: active ? "2px solid #67a3ff" : "2px solid transparent",
  cursor: "pointer",
  textAlign: "center",
});

// ── Onglet Jeux ───────────────────────────────────────────────────────────────

function GamesTab({ gamesDb, autoApply }: { gamesDb: GamesDB; autoApply: boolean }) {
  const [appId, setAppId] = useState<number | null>(null);
  const [game, setGame] = useState<GameEntry | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const gameCount = Object.keys(gamesDb).filter((k) => !k.startsWith("_")).length;

  const refresh = useCallback(() => {
    const id = getCurrentAppId();
    setAppId(id);
    if (id) {
      const entry = gamesDb[String(id)];
      setGame(entry && "proton" in entry ? (entry as GameEntry) : null);
    } else {
      setGame(null);
    }
    setApplied(false);
  }, [gamesDb]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  // Auto-apply au lancement d'un jeu
  useEffect(() => {
    if (!autoApply) return;
    let unreg: (() => void) | undefined;
    try {
      const reg = (window as any).SteamClient?.GameSessions?.RegisterForAppLifetimeNotifications;
      if (typeof reg !== "function") return;
      unreg = reg(async (e: any) => {
        if (!e?.bRunning) return;
        const entry = gamesDb[String(e.unAppID)];
        if (!entry || !("proton" in entry)) return;
        const g = entry as GameEntry;
        await setLaunchOptions(e.unAppID, g.launch_options);
        await setCompatTool(e.unAppID, g.proton);
        toaster.toast({ title: "BC250 Toolkit", body: `✓ Settings appliqués : ${g.name}`, duration: 3000 });
      });
    } catch (_) {}
    return () => { try { unreg?.(); } catch (_) {} };
  }, [autoApply, gamesDb]);

  const handleApply = async () => {
    if (!appId || !game) return;
    setApplying(true);
    try {
      const okL = await setLaunchOptions(appId, game.launch_options);
      const okP = await setCompatTool(appId, game.proton);
      setApplied(okL);
      toaster.toast({
        title: "BC250 Toolkit",
        body: okL
          ? `✓ Settings BC-250 appliqués${!okP ? " (Proton non trouvé)" : ""}`
          : "✗ Erreur — launch options non appliquées",
        duration: 4000,
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <PanelSection>
        <PanelSectionRow>
          <Field label="Jeux dans la DB" description="Jeux optimisés pour BC-250">
            <span style={{ color: "#67a3ff", fontWeight: "bold" }}>{gameCount}</span>
          </Field>
        </PanelSectionRow>
      </PanelSection>

      {game ? (
        <PanelSection title={game.name}>
          <PanelSectionRow>
            <Field label="Proton recommandé">
              <span style={{ fontSize: "12px" }}>
                {game.proton}{game.proton_branch ? ` — ${game.proton_branch}` : ""}
              </span>
            </Field>
          </PanelSectionRow>
          {game.proton_note && (
            <PanelSectionRow>
              <Field>
                <div style={{ fontSize: "11px", color: "#ff9800", lineHeight: "1.4" }}>{game.proton_note}</div>
              </Field>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <Field label="Launch options">
              <div style={{ fontSize: "10px", wordBreak: "break-all", color: "#aaa", lineHeight: "1.4" }}>
                {game.launch_options}
              </div>
            </Field>
          </PanelSectionRow>
          {game.notes && (
            <PanelSectionRow>
              <Field label="Notes">
                <div style={{ fontSize: "11px", color: "#ccc" }}>{game.notes}</div>
              </Field>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem layout="below" disabled={applying || applied} onClick={handleApply}>
              {applying ? "Application..." : applied ? "✓ Appliqué" : "Appliquer les settings BC-250"}
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      ) : (
        <PanelSection>
          <PanelSectionRow>
            <Field>
              <div style={{ color: "#888", fontSize: "12px", textAlign: "center", padding: "8px 0" }}>
                {appId ? "Jeu non référencé dans la DB BC-250" : "Sélectionne un jeu dans la bibliothèque"}
              </div>
            </Field>
          </PanelSectionRow>
        </PanelSection>
      )}

      <PanelSection>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={refresh}>Rafraîchir</ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
}

// ── Onglet Système ────────────────────────────────────────────────────────────

function SystemTab() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string | null>(null);

  useEffect(() => {
    call<[], SystemStatus>("get_system_status").then(setStatus);
    const t = setInterval(() => {
      call<[], SystemStatus>("get_system_status").then(setStatus);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateLog(null);
    try {
      const r = await call<[], { success: boolean; stdout?: string; error?: string }>("run_tweaks_update");
      setUpdateLog(r.success ? (r.stdout ?? "OK") : (r.error ?? "Erreur inconnue"));
      toaster.toast({
        title: "BC250 Toolkit",
        body: r.success ? "✓ Tweaks mis à jour" : "✗ Erreur mise à jour",
        duration: 4000,
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!status) return <SteamSpinner />;

  const tempColor = (v?: number) => !v ? "#888" : v > 85 ? "#f44336" : v > 70 ? "#ff9800" : "#4caf50";

  return (
    <>
      <PanelSection title="Températures">
        <PanelSectionRow>
          <Field label="CPU">
            <span style={{ color: tempColor(status.cpu_temp), fontWeight: "bold" }}>
              {status.cpu_temp != null ? `${status.cpu_temp}°C` : "N/A"}
            </span>
          </Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field label="GPU">
            <span style={{ color: tempColor(status.gpu_temp), fontWeight: "bold" }}>
              {status.gpu_temp != null ? `${status.gpu_temp}°C` : "N/A"}
            </span>
          </Field>
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Statut">
        <PanelSectionRow>
          <Field label="Scheduler">
            <span style={{ color: status.scx_state === "enabled" ? "#4caf50" : "#f44336", fontSize: "12px" }}>
              {status.scx_state === "enabled" ? `✓ ${status.scx_sched ?? "scx actif"}` : `✗ ${status.scx_state ?? "inconnu"}`}
            </span>
          </Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field label="Tuned">
            <span style={{ fontSize: "11px", color: "#ccc" }}>{status.tuned_profile ?? "inconnu"}</span>
          </Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field label="Gamemode">
            <span style={{ color: status.gamemode_active ? "#4caf50" : "#f44336" }}>
              {status.gamemode_active ? "✓ actif" : "✗ inactif"}
            </span>
          </Field>
        </PanelSectionRow>
      </PanelSection>

      {status.tweaks_installed && (
        <PanelSection title="bc250-tweaks">
          {status.tweaks_last_update && (
            <PanelSectionRow>
              <Field label="Dernier update">
                <span style={{ fontSize: "10px", color: "#aaa" }}>{status.tweaks_last_update}</span>
              </Field>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem layout="below" disabled={updating} onClick={handleUpdate}>
              {updating ? "Mise à jour..." : "Mettre à jour les tweaks"}
            </ButtonItem>
          </PanelSectionRow>
          {updateLog && (
            <PanelSectionRow>
              <Field label="Log">
                <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#aaa", maxHeight: "100px", overflow: "auto", whiteSpace: "pre-wrap" }}>
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
  const meta = gamesDb["_meta"] as Record<string, string> | undefined;

  const doRefresh = async () => {
    setRefreshing(true);
    try { await onRefreshDb(); } finally { setRefreshing(false); }
  };

  return (
    <PanelSection>
      <PanelSectionRow>
        <ToggleField
          label="Auto-apply au lancement"
          description="Applique automatiquement les settings quand un jeu connu est lancé"
          checked={autoApply}
          onChange={setAutoApply}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={refreshing} onClick={doRefresh}>
          {refreshing ? "Rafraîchissement..." : "Rafraîchir DB depuis GitHub"}
        </ButtonItem>
      </PanelSectionRow>
      {meta?.updated && (
        <PanelSectionRow>
          <Field label="DB mise à jour le">
            <span style={{ fontSize: "11px", color: "#888" }}>{meta.updated}</span>
          </Field>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <Field label="Contribuer">
          <div style={{ fontSize: "11px", color: "#67a3ff" }}>
            github.com/necrocyberangel/bc250-toolkit-decky
          </div>
        </Field>
      </PanelSectionRow>
    </PanelSection>
  );
}

// ── Plugin principal ──────────────────────────────────────────────────────────

function Content() {
  const [tab, setTab] = useState<Tab>("games");
  const [autoApply, setAutoApply] = useState(false);
  const [gamesDb, setGamesDb] = useState<GamesDB>({});
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    call<[], GamesDB>("get_games_db").then((db) => {
      setGamesDb(db);
      setDbLoaded(true);
    });
  }, []);

  const refreshDb = async () => {
    const db = await call<[], GamesDB>("refresh_games_db");
    setGamesDb(db);
    toaster.toast({ title: "BC250 Toolkit", body: "DB mise à jour", duration: 2000 });
  };

  if (!dbLoaded) return <SteamSpinner />;

  return (
    <div>
      {/* Barre d'onglets manuelle */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "4px" }}>
        <button style={tabBtnStyle(tab === "games")}   onClick={() => setTab("games")}>Jeux</button>
        <button style={tabBtnStyle(tab === "system")}  onClick={() => setTab("system")}>Système</button>
        <button style={tabBtnStyle(tab === "settings")} onClick={() => setTab("settings")}>Réglages</button>
      </div>

      {tab === "games" && <GamesTab gamesDb={gamesDb} autoApply={autoApply} />}
      {tab === "system" && <SystemTab />}
      {tab === "settings" && (
        <SettingsTab
          autoApply={autoApply}
          setAutoApply={setAutoApply}
          gamesDb={gamesDb}
          onRefreshDb={refreshDb}
        />
      )}
    </div>
  );
}

export default definePlugin(() => ({
  name: "BC250 Toolkit",
  title: <div className={staticClasses.Title}>BC250 Toolkit</div>,
  icon: <FaMicrochip />,
  content: <Content />,
  onDismount() {},
}));
