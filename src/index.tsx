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

type TabId = "games" | "system" | "settings";

// ── Steam helpers (via Python backend — SteamClient API cassée dans QAM) ───────

async function applyGameSettings(
  appId: number,
  toolName: string,
  launchOpts: string
): Promise<{ compatOk: boolean; compatDetail: string; launchOk: boolean; launchDetail: string }> {
  const [compatResult, launchResult] = await Promise.all([
    call<[number, string], { ok: boolean; error?: string }>("apply_compat_tool", appId, toolName),
    call<[number, string], { ok: boolean; error?: string }>("apply_launch_options", appId, launchOpts),
  ]);
  return {
    compatOk: compatResult.ok,
    compatDetail: compatResult.error ?? toolName,
    launchOk: launchResult.ok,
    launchDetail: launchResult.error ?? "OK",
  };
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

function GamesTab({ gamesDb, autoApply }: { gamesDb: GamesDB; autoApply: boolean }) {
  const [installed, setInstalled] = useState<InstalledEntry[]>([]);
  const [selected, setSelected] = useState<InstalledEntry | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const gameCount = Object.keys(gamesDb).filter((k) => !k.startsWith("_")).length;

  const refresh = useCallback(() => {
    const list = getInstalledDbGames(gamesDb);
    setInstalled(list);
    // Si le jeu sélectionné n'est plus dans la liste, désélectionner
    setSelected((prev) => prev && list.find((e) => e.appid === prev.appid) ? prev : null);
    setApplied(false);
  }, [gamesDb]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
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
        const r = await applyGameSettings(e.unAppID, g.proton, g.launch_options);
        const ok = r.compatOk || r.launchOk;
        toaster.toast({
          title: "BC250 Toolkit",
          body: ok ? `✓ Settings appliqués : ${g.name}` : `✗ Erreur : ${r.compatDetail}`,
          duration: 3000,
        });
      });
    } catch (_) {}
    return () => { try { unreg?.(); } catch (_) {} };
  }, [autoApply, gamesDb]);

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      const r = await applyGameSettings(selected.appid, selected.game.proton, selected.game.launch_options);
      const allOk = r.compatOk && r.launchOk;
      const partialOk = r.compatOk || r.launchOk;
      setApplied(allOk);
      if (allOk) {
        toaster.toast({ title: "BC250 Toolkit", body: "✓ Settings BC-250 appliqués (redémarre Steam)", duration: 4000 });
      } else if (partialOk) {
        const msg = r.compatOk ? "Proton OK — Launch options KO" : "Launch options OK — Proton KO";
        toaster.toast({ title: "BC250 Toolkit", body: `⚠ Partiel : ${msg}`, duration: 5000 });
        setApplied(true);
      } else {
        toaster.toast({
          title: "BC250 Toolkit",
          body: `✗ Erreur — ${r.compatDetail}`,
          duration: 5000,
        });
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <PanelSection>
        <PanelSectionRow>
          <Field label="DB" description="Jeux optimisés pour BC-250">
            <span style={{ color: "#67a3ff", fontWeight: "bold" }}>{gameCount} jeux</span>
          </Field>
        </PanelSectionRow>
      </PanelSection>

      {installed.length > 0 ? (
        <PanelSection title="Installés et compatibles">
          {installed.map((entry) => {
            const isSelected = selected?.appid === entry.appid;
            return (
              <PanelSectionRow key={entry.appid}>
                <ButtonItem
                  layout="below"
                  onClick={() => { setSelected(isSelected ? null : entry); setApplied(false); }}
                  style={isSelected ? { color: "#67a3ff", fontWeight: "bold" } : { opacity: 0.8 }}
                >
                  {isSelected ? `▶ ${entry.name}` : entry.name}
                </ButtonItem>
              </PanelSectionRow>
            );
          })}
        </PanelSection>
      ) : (
        <PanelSection>
          <PanelSectionRow>
            <Field>
              <div style={{ color: "#888", fontSize: "12px", textAlign: "center", padding: "8px 0" }}>
                Aucun jeu de la DB installé
              </div>
            </Field>
          </PanelSectionRow>
        </PanelSection>
      )}

      {selected && (
        <PanelSection title="Settings à appliquer">
          <PanelSectionRow>
            <Field label="Proton">
              <span style={{ fontSize: "12px" }}>
                {selected.game.proton}{selected.game.proton_branch ? ` — ${selected.game.proton_branch}` : ""}
              </span>
            </Field>
          </PanelSectionRow>
          {selected.game.proton_note && (
            <PanelSectionRow>
              <Field>
                <div style={{ fontSize: "11px", color: "#ff9800", lineHeight: "1.4" }}>{selected.game.proton_note}</div>
              </Field>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <Field label="Launch options">
              <div style={{ fontSize: "10px", wordBreak: "break-all", color: "#aaa", lineHeight: "1.4" }}>
                {selected.game.launch_options}
              </div>
            </Field>
          </PanelSectionRow>
          {selected.game.notes && (
            <PanelSectionRow>
              <Field label="Notes">
                <div style={{ fontSize: "11px", color: "#ccc" }}>{selected.game.notes}</div>
              </Field>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem layout="below" disabled={applying || applied} onClick={handleApply}>
              {applying ? "Application..." : applied ? "✓ Appliqué" : "Appliquer les settings BC-250"}
            </ButtonItem>
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
            github.com/Necrosiak/bc250-toolkit-decky
          </div>
        </Field>
      </PanelSectionRow>
    </PanelSection>
  );
}

// ── Barre d'onglets (ButtonItem = navigation manette garantie) ────────────────

const TAB_DEFS: Array<{ id: TabId; label: string }> = [
  { id: "games", label: "Jeux" },
  { id: "system", label: "Système" },
  { id: "settings", label: "Réglages" },
];

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <PanelSection>
      {TAB_DEFS.map(({ id, label }) => (
        <PanelSectionRow key={id}>
          <ButtonItem
            layout="below"
            onClick={() => setTab(id)}
            style={tab === id ? { color: "#67a3ff", fontWeight: "bold" } : { opacity: 0.6 }}
          >
            {tab === id ? `▶ ${label}` : label}
          </ButtonItem>
        </PanelSectionRow>
      ))}
    </PanelSection>
  );
}

// ── Plugin principal ──────────────────────────────────────────────────────────

function Content() {
  const [tab, setTab] = useState<TabId>("games");
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
    <>
      <TabBar tab={tab} setTab={setTab} />
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
    </>
  );
}

export default definePlugin(() => ({
  name: "BC250 Toolkit",
  title: <div className={staticClasses.Title}>BC250 Toolkit</div>,
  icon: <FaMicrochip />,
  content: <Content />,
  onDismount() {},
}));
