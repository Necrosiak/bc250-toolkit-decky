var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaMicrochip (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M416 48v416c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V48c0-26.51 21.49-48 48-48h224c26.51 0 48 21.49 48 48zm96 58v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42V88h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zM30 376h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6z"},"child":[]}]})(props);
}

const manifest = {"name":"BC250 Toolkit"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const call = api.call;
const toaster = api.toaster;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

// ── Steam helpers (via backend Python — SteamClient.Apps.Set* cassé dans QAM) ─
async function applyGameSettings(appId, toolName, launchOpts) {
    const [compatResult, launchResult] = await Promise.all([
        call("apply_compat_tool", appId, toolName),
        call("apply_launch_options", appId, launchOpts),
    ]);
    return {
        compatOk: compatResult.ok,
        compatDetail: compatResult.error ?? toolName,
        launchOk: launchResult.ok,
        launchDetail: launchResult.error ?? "OK",
    };
}
function getInstalledDbGames(gamesDb) {
    try {
        const allApps = window.appStore?.allApps ?? [];
        return allApps
            .filter((app) => {
            if (!app?.installed)
                return false;
            const entry = gamesDb[String(app.appid)];
            return entry && "proton" in entry;
        })
            .map((app) => ({
            appid: app.appid,
            name: (app.display_name ?? app.strDisplayName ?? `App ${app.appid}`),
            game: gamesDb[String(app.appid)],
        }));
    }
    catch (_) {
        return [];
    }
}
function GamesTab({ gamesDb, autoApply }) {
    const [installed, setInstalled] = SP_REACT.useState([]);
    const [selected, setSelected] = SP_REACT.useState(null);
    const [applying, setApplying] = SP_REACT.useState(false);
    const [applied, setApplied] = SP_REACT.useState(false);
    const gameCount = Object.keys(gamesDb).filter((k) => !k.startsWith("_")).length;
    const refresh = SP_REACT.useCallback(() => {
        const list = getInstalledDbGames(gamesDb);
        setInstalled(list);
        setSelected((prev) => (prev && list.find((e) => e.appid === prev.appid) ? prev : null));
        setApplied(false);
    }, [gamesDb]);
    SP_REACT.useEffect(() => {
        refresh();
        const t = setInterval(refresh, 5000);
        return () => clearInterval(t);
    }, [refresh]);
    // Auto-apply au lancement d'un jeu de la DB
    SP_REACT.useEffect(() => {
        if (!autoApply)
            return;
        let unreg;
        try {
            const reg = window.SteamClient?.GameSessions?.RegisterForAppLifetimeNotifications;
            if (typeof reg !== "function")
                return;
            unreg = reg(async (e) => {
                if (!e?.bRunning)
                    return;
                const entry = gamesDb[String(e.unAppID)];
                if (!entry || !("proton" in entry))
                    return;
                const g = entry;
                const r = await applyGameSettings(e.unAppID, g.compat_tool ?? g.proton, g.launch_options);
                const ok = r.compatOk || r.launchOk;
                toaster.toast({
                    title: "BC250 Toolkit",
                    body: ok ? `✓ Settings appliqués : ${g.name}` : `✗ Erreur : ${r.compatDetail}`,
                    duration: 3000,
                });
            });
        }
        catch (_) { }
        return () => { try {
            unreg?.();
        }
        catch (_) { } };
    }, [autoApply, gamesDb]);
    const handleApply = async () => {
        if (!selected)
            return;
        setApplying(true);
        try {
            const r = await applyGameSettings(selected.appid, selected.game.compat_tool ?? selected.game.proton, selected.game.launch_options);
            const allOk = r.compatOk && r.launchOk;
            const partialOk = r.compatOk || r.launchOk;
            setApplied(allOk || partialOk);
            if (allOk) {
                toaster.toast({ title: "BC250 Toolkit", body: "✓ Persistant — redémarre Steam une fois", duration: 4000 });
            }
            else if (partialOk) {
                const msg = r.compatOk ? "Proton OK — Launch options KO" : "Launch options OK — Proton KO";
                toaster.toast({ title: "BC250 Toolkit", body: `⚠ Partiel : ${msg}`, duration: 5000 });
            }
            else {
                toaster.toast({ title: "BC250 Toolkit", body: `✗ ${r.compatDetail}`, duration: 5000 });
                setApplied(false);
            }
        }
        finally {
            setApplying(false);
        }
    };
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "DB", description: "Jeux optimis\u00E9s pour BC-250", children: SP_JSX.jsxs("span", { style: { color: "#67a3ff", fontWeight: "bold" }, children: [gameCount, " jeux"] }) }) }) }), installed.length > 0 ? (SP_JSX.jsx(DFL.PanelSection, { title: "Install\u00E9s et compatibles", children: installed.map((entry) => {
                    const isSelected = selected?.appid === entry.appid;
                    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => { setSelected(isSelected ? null : entry); setApplied(false); }, style: isSelected ? { color: "#67a3ff", fontWeight: "bold" } : { opacity: 0.8 }, children: isSelected ? `▶ ${entry.name}` : entry.name }) }, entry.appid));
                }) })) : (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: { color: "#888", fontSize: "12px", textAlign: "center", padding: "8px 0" }, children: "Aucun jeu de la DB install\u00E9" }) }) }) })), selected && (SP_JSX.jsxs(DFL.PanelSection, { title: "Settings \u00E0 appliquer", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Proton", children: SP_JSX.jsxs("span", { style: { fontSize: "12px" }, children: [selected.game.proton, selected.game.proton_branch ? ` — ${selected.game.proton_branch}` : ""] }) }) }), selected.game.proton_note && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#ff9800", lineHeight: "1.4" }, children: selected.game.proton_note }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Launch options", children: SP_JSX.jsx("div", { style: { fontSize: "10px", wordBreak: "break-all", color: "#aaa", lineHeight: "1.4" }, children: selected.game.launch_options }) }) }), selected.game.notes && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Notes", children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#ccc" }, children: selected.game.notes }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: applying || applied, onClick: handleApply, children: applying ? "Application..." : applied ? "✓ Appliqué (persistant)" : "Appliquer les settings BC-250" }) })] })), SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: refresh, children: "Rafra\u00EEchir" }) }) })] }));
}
// ── Onglet CU ─────────────────────────────────────────────────────────────────
const CU_PROFILE_LIST = [
    { key: "stock", label: "24 CU (stock)", color: "#4caf50" },
    { key: "32cu", label: "32 CU", color: "#67a3ff" },
    { key: "36cu", label: "36 CU", color: "#ff9800" },
    { key: "40cu", label: "40 CU (full)", color: "#f44336" },
];
function CuTab() {
    const [status, setStatus] = SP_REACT.useState(null);
    const [applying, setApplying] = SP_REACT.useState(null);
    const [saveBoot, setSaveBoot] = SP_REACT.useState(false);
    const [lastMsg, setLastMsg] = SP_REACT.useState(null);
    const [installingUmr, setInstallingUmr] = SP_REACT.useState(false);
    const refresh = SP_REACT.useCallback(() => {
        call("get_cu_status").then(setStatus);
    }, []);
    SP_REACT.useEffect(() => {
        refresh();
        const t = setInterval(refresh, 10000);
        return () => clearInterval(t);
    }, [refresh]);
    const handleInstallUmr = async () => {
        setInstallingUmr(true);
        setLastMsg(null);
        toaster.toast({ title: "BC250 Toolkit", body: "Installation de umr en cours (~30s)...", duration: 5000 });
        try {
            const r = await call("install_umr");
            if (r.ok) {
                const msg = r.already ? "✓ umr déjà disponible" : "✓ umr installé — CU disponible";
                setLastMsg(msg);
                toaster.toast({ title: "BC250 Toolkit", body: msg, duration: 4000 });
                refresh();
            }
            else {
                const msg = `✗ Échec install umr: ${r.error}`;
                setLastMsg(msg);
                toaster.toast({ title: "BC250 Toolkit", body: msg, duration: 6000 });
            }
        }
        finally {
            setInstallingUmr(false);
        }
    };
    const applyProfile = async (profileKey) => {
        setApplying(profileKey);
        setLastMsg(null);
        try {
            const r = await call("apply_cu_profile", profileKey, saveBoot);
            if (r.ok) {
                const msg = saveBoot
                    ? `✓ ${r.cu_count} CU appliqués et sauvegardés au boot`
                    : `✓ ${r.cu_count} CU appliqués (live — non persistant)`;
                setLastMsg(msg);
                toaster.toast({ title: "BC250 Toolkit", body: msg, duration: 3000 });
                refresh();
            }
            else {
                const msg = `✗ ${r.error}`;
                setLastMsg(msg);
                toaster.toast({ title: "BC250 Toolkit", body: msg, duration: 4000 });
            }
        }
        finally {
            setApplying(null);
        }
    };
    if (!status)
        return SP_JSX.jsx(DFL.SteamSpinner, {});
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Statut CU", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "CU actifs (live)", children: SP_JSX.jsx("span", { style: { fontWeight: "bold", color: "#67a3ff", fontSize: "14px" }, children: status.cu_count != null
                                    ? `${status.cu_count} / 40 CU`
                                    : status.umr_available
                                        ? "lecture..."
                                        : "N/A" }) }) }), status.boot_cu != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Boot", children: SP_JSX.jsxs("span", { style: { fontSize: "12px", color: "#aaa" }, children: [status.boot_cu, " CU", status.boot_profile ? ` (${status.boot_profile})` : ""] }) }) })), !status.umr_available && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#ff9800", lineHeight: "1.4" }, children: "\u26A0 umr non disponible \u2014 requis pour la gestion CU" }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: installingUmr, onClick: handleInstallUmr, children: installingUmr ? "Installation en cours..." : "Installer umr automatiquement" }) })] }))] }), SP_JSX.jsx(DFL.PanelSection, { title: "Profils", children: CU_PROFILE_LIST.map(({ key, label, color }) => {
                    const isActive = status.current_profile === key;
                    const isBoot = status.boot_profile === key;
                    const isApplying = applying === key;
                    const suffix = isBoot && !isActive ? " [boot]" : isActive && isBoot ? " [live+boot]" : "";
                    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => applyProfile(key), disabled: !!applying || !status.umr_available, style: isActive ? { color, fontWeight: "bold" } : { opacity: 0.75 }, children: isApplying
                                ? "Application..."
                                : `${isActive ? "▶ " : ""}${label}${suffix}` }) }, key));
                }) }), SP_JSX.jsxs(DFL.PanelSection, { title: "Options", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Sauvegarder au boot", description: "Le profil CU est restaur\u00E9 automatiquement \u00E0 chaque d\u00E9marrage", checked: saveBoot, onChange: setSaveBoot }) }), lastMsg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                    fontSize: "11px",
                                    color: lastMsg.startsWith("✓") ? "#4caf50" : "#f44336",
                                    lineHeight: "1.4",
                                }, children: lastMsg }) }) }))] }), SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsxs("div", { style: { fontSize: "10px", color: "#555", lineHeight: "1.4" }, children: ["1 WGP = 2 CU \u2022 5 WGP/rang\u00E9e \u00D7 4 rang\u00E9es = 40 CU max", "\n", "36 CU = SE0 full (10+10) + SE1 partial (8+8)"] }) }) }) })] }));
}
// ── Onglet Système ────────────────────────────────────────────────────────────
function SystemTab() {
    const [status, setStatus] = SP_REACT.useState(null);
    const [updating, setUpdating] = SP_REACT.useState(false);
    const [updateLog, setUpdateLog] = SP_REACT.useState(null);
    SP_REACT.useEffect(() => {
        call("get_system_status").then(setStatus);
        const t = setInterval(() => call("get_system_status").then(setStatus), 5000);
        return () => clearInterval(t);
    }, []);
    const handleUpdate = async () => {
        setUpdating(true);
        setUpdateLog(null);
        try {
            const r = await call("run_tweaks_update");
            setUpdateLog(r.success ? (r.stdout ?? "OK") : (r.error ?? "Erreur inconnue"));
            toaster.toast({
                title: "BC250 Toolkit",
                body: r.success ? "✓ Tweaks mis à jour" : "✗ Erreur mise à jour",
                duration: 4000,
            });
        }
        finally {
            setUpdating(false);
        }
    };
    if (!status)
        return SP_JSX.jsx(DFL.SteamSpinner, {});
    const tempColor = (v) => !v ? "#888" : v > 85 ? "#f44336" : v > 70 ? "#ff9800" : "#4caf50";
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Temp\u00E9ratures", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "CPU", children: SP_JSX.jsx("span", { style: { color: tempColor(status.cpu_temp), fontWeight: "bold" }, children: status.cpu_temp != null ? `${status.cpu_temp}°C` : "N/A" }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "GPU", children: SP_JSX.jsx("span", { style: { color: tempColor(status.gpu_temp), fontWeight: "bold" }, children: status.gpu_temp != null ? `${status.gpu_temp}°C` : "N/A" }) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Statut", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Scheduler", children: SP_JSX.jsx("span", { style: { color: status.scx_state === "enabled" ? "#4caf50" : "#f44336", fontSize: "12px" }, children: status.scx_state === "enabled"
                                    ? `✓ ${status.scx_sched ?? "scx actif"}`
                                    : `✗ ${status.scx_state ?? "inconnu"}` }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Tuned", children: SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#ccc" }, children: status.tuned_profile ?? "inconnu" }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Gamemode", children: SP_JSX.jsx("span", { style: { color: status.gamemode_active ? "#4caf50" : "#f44336" }, children: status.gamemode_active ? "✓ actif" : "✗ inactif" }) }) })] }), status.tweaks_installed && (SP_JSX.jsxs(DFL.PanelSection, { title: "bc250-tweaks", children: [status.tweaks_last_update && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Dernier update", children: SP_JSX.jsx("span", { style: { fontSize: "10px", color: "#aaa" }, children: status.tweaks_last_update }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: updating, onClick: handleUpdate, children: updating ? "Mise à jour..." : "Mettre à jour les tweaks" }) }), updateLog && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Log", children: SP_JSX.jsx("div", { style: {
                                    fontSize: "10px", fontFamily: "monospace", color: "#aaa",
                                    maxHeight: "100px", overflow: "auto", whiteSpace: "pre-wrap",
                                }, children: updateLog.slice(-1500) }) }) }))] }))] }));
}
// ── Onglet Réglages ───────────────────────────────────────────────────────────
function SettingsTab({ autoApply, setAutoApply, gamesDb, onRefreshDb, }) {
    const [refreshing, setRefreshing] = SP_REACT.useState(false);
    const meta = gamesDb["_meta"];
    const doRefresh = async () => {
        setRefreshing(true);
        try {
            await onRefreshDb();
        }
        finally {
            setRefreshing(false);
        }
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Auto-apply au lancement", description: "Applique automatiquement les settings quand un jeu connu est lanc\u00E9", checked: autoApply, onChange: setAutoApply }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: refreshing, onClick: doRefresh, children: refreshing ? "Rafraîchissement..." : "Rafraîchir DB depuis GitHub" }) }), meta?.updated && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "DB mise \u00E0 jour le", children: SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#888" }, children: meta.updated }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "Contribuer", children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#67a3ff" }, children: "github.com/Necrosiak/bc250-toolkit-decky" }) }) })] }));
}
// ── Barre d'onglets ───────────────────────────────────────────────────────────
const TAB_DEFS = [
    { id: "games", label: "Jeux" },
    { id: "cu", label: "CU" },
    { id: "system", label: "Système" },
    { id: "settings", label: "Réglages" },
];
function TabBar({ tab, setTab }) {
    return (SP_JSX.jsx(DFL.PanelSection, { children: TAB_DEFS.map(({ id, label }) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setTab(id), style: tab === id ? { color: "#67a3ff", fontWeight: "bold" } : { opacity: 0.6 }, children: tab === id ? `▶ ${label}` : label }) }, id))) }));
}
// ── Plugin principal ──────────────────────────────────────────────────────────
function Content() {
    const [tab, setTab] = SP_REACT.useState("games");
    const [autoApply, setAutoApply] = SP_REACT.useState(false);
    const [gamesDb, setGamesDb] = SP_REACT.useState({});
    const [dbLoaded, setDbLoaded] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        call("get_games_db").then((db) => {
            setGamesDb(db);
            setDbLoaded(true);
        });
    }, []);
    const refreshDb = async () => {
        const db = await call("refresh_games_db");
        setGamesDb(db);
        toaster.toast({ title: "BC250 Toolkit", body: "DB mise à jour", duration: 2000 });
    };
    if (!dbLoaded)
        return SP_JSX.jsx(DFL.SteamSpinner, {});
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(TabBar, { tab: tab, setTab: setTab }), tab === "games" && SP_JSX.jsx(GamesTab, { gamesDb: gamesDb, autoApply: autoApply }), tab === "cu" && SP_JSX.jsx(CuTab, {}), tab === "system" && SP_JSX.jsx(SystemTab, {}), tab === "settings" && (SP_JSX.jsx(SettingsTab, { autoApply: autoApply, setAutoApply: setAutoApply, gamesDb: gamesDb, onRefreshDb: refreshDb }))] }));
}
var index = definePlugin(() => ({
    name: "BC250 Toolkit",
    title: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "BC250 Toolkit" }),
    icon: SP_JSX.jsx(FaMicrochip, {}),
    content: SP_JSX.jsx(Content, {}),
    onDismount() { },
}));

export { index as default };
//# sourceMappingURL=index.js.map
