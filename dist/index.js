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

// i18n — BC250 Toolkit
// Languages: en, fr, de, es, it, pt, nl, pl, ru
// Auto-detected from Steam LocalizationManager, fallback to navigator.language
const STEAM_MAP = {
    english: "en", french: "fr", german: "de",
    spanish: "es", portuguese: "pt", italian: "it",
    dutch: "nl", polish: "pl", russian: "ru",
};
const NAV_MAP = {
    en: "en", fr: "fr", de: "de", es: "es",
    it: "it", pt: "pt", nl: "nl", pl: "pl", ru: "ru",
};
function detectLocale() {
    try {
        const lm = window.LocalizationManager;
        for (const k of ["m_strLanguage", "strLanguage", "language"]) {
            const v = lm?.[k];
            if (typeof v === "string" && STEAM_MAP[v.toLowerCase()])
                return STEAM_MAP[v.toLowerCase()];
        }
    }
    catch { }
    try {
        const nav = navigator.language?.split("-")[0].toLowerCase();
        if (nav && NAV_MAP[nav])
            return NAV_MAP[nav];
    }
    catch { }
    return "en";
}
let _locale = null;
const T = {
    en: {
        // Tabs
        tab_games: "Games",
        tab_cu: "CU",
        tab_system: "System",
        tab_settings: "Settings",
        // Games
        db_optimized: "Optimized games for BC-250",
        db_count: "{count} games",
        installed_compat: "Installed & Compatible",
        no_games: "No games from the DB are installed",
        settings_title: "Settings to Apply",
        label_proton: "Proton",
        label_launch: "Launch options",
        label_notes: "Notes",
        btn_apply: "Apply BC-250 settings",
        btn_applying: "Applying...",
        btn_applied: "✓ Applied (restart Steam once)",
        btn_refresh: "Refresh",
        toast_applied: "✓ Settings applied: {name}",
        toast_error: "✗ Error: {detail}",
        toast_persistent: "✓ Persistent — restart Steam once",
        toast_partial_compat: "⚠ Partial: Proton OK — Launch options failed",
        toast_partial_launch: "⚠ Partial: Launch options OK — Proton failed",
        // CU
        cu_title: "CU Status",
        cu_live: "Active CU (live)",
        cu_reading: "reading...",
        cu_na: "N/A",
        cu_boot: "Boot",
        cu_no_umr: "⚠ umr not available — required for CU management",
        cu_install_umr: "Install umr automatically",
        cu_installing_umr: "Installing...",
        cu_profiles: "Profiles",
        cu_options: "Options",
        cu_save_boot: "Save to boot",
        cu_save_boot_desc: "CU profile is automatically restored at each boot",
        cu_legend: "1 WGP = 2 CU • 5 WGP/row × 4 rows = 40 CU max\n36 CU = SE0 full (10+10) + SE1 partial (8+8)",
        cu_applying: "Applying...",
        cu_done_live: "✓ {count} CU applied (live — not persistent)",
        cu_done_boot: "✓ {count} CU applied and saved to boot",
        toast_umr_start: "Installing umr (~30s)...",
        toast_umr_ok: "✓ umr installed — CU available",
        toast_umr_already: "✓ umr already available",
        toast_umr_fail: "✗ umr install failed: {error}",
        // CU disclaimer
        cu_warn_title: "⚠ Experimental",
        cu_disclaimer: "Unlocking CUs beyond 24 may cause GPU instability or overheating. Start at 32 CU · Monitor temps · Revert to 24 CU if unstable.",
        // System
        sys_temps: "Temperatures",
        sys_status: "Status",
        sys_scheduler: "Scheduler",
        sys_tuned: "Tuned",
        sys_gamemode: "Gamemode",
        sys_active: "✓ active",
        sys_inactive: "✗ inactive",
        sys_unknown: "unknown",
        sys_last_update: "Last update",
        sys_btn_update: "Update tweaks",
        sys_btn_updating: "Updating...",
        sys_toast_ok: "✓ Tweaks updated",
        sys_toast_fail: "✗ Update error",
        sys_log: "Log",
        // Settings
        set_auto: "Auto-apply on launch",
        set_auto_desc: "Automatically applies settings when a known game is launched",
        set_refresh_db: "Refresh DB from GitHub",
        set_refreshing: "Refreshing...",
        set_db_date: "DB updated on",
        set_contribute: "Contribute",
        toast_db_ok: "DB updated",
    },
    fr: {
        tab_games: "Jeux", tab_cu: "CU", tab_system: "Système", tab_settings: "Réglages",
        db_optimized: "Jeux optimisés pour BC-250",
        db_count: "{count} jeux",
        installed_compat: "Installés et compatibles",
        no_games: "Aucun jeu de la DB n'est installé",
        settings_title: "Settings à appliquer",
        label_proton: "Proton", label_launch: "Options de lancement", label_notes: "Notes",
        btn_apply: "Appliquer les settings BC-250",
        btn_applying: "Application...",
        btn_applied: "✓ Appliqué (redémarre Steam une fois)",
        btn_refresh: "Rafraîchir",
        toast_applied: "✓ Settings appliqués : {name}",
        toast_error: "✗ Erreur : {detail}",
        toast_persistent: "✓ Persistant — redémarre Steam une fois",
        toast_partial_compat: "⚠ Partiel : Proton OK — Launch options KO",
        toast_partial_launch: "⚠ Partiel : Launch options OK — Proton KO",
        cu_title: "Statut CU", cu_live: "CU actifs (live)",
        cu_reading: "lecture...", cu_na: "N/A", cu_boot: "Boot",
        cu_no_umr: "⚠ umr non disponible — requis pour la gestion CU",
        cu_install_umr: "Installer umr automatiquement",
        cu_installing_umr: "Installation en cours...",
        cu_profiles: "Profils", cu_options: "Options",
        cu_save_boot: "Sauvegarder au boot",
        cu_save_boot_desc: "Le profil CU est restauré automatiquement à chaque démarrage",
        cu_legend: "1 WGP = 2 CU • 5 WGP/rangée × 4 rangées = 40 CU max\n36 CU = SE0 full (10+10) + SE1 partial (8+8)",
        cu_applying: "Application...",
        cu_done_live: "✓ {count} CU appliqués (live — non persistant)",
        cu_done_boot: "✓ {count} CU appliqués et sauvegardés au boot",
        toast_umr_start: "Installation de umr (~30s)...",
        toast_umr_ok: "✓ umr installé — CU disponible",
        toast_umr_already: "✓ umr déjà disponible",
        toast_umr_fail: "✗ Échec install umr : {error}",
        cu_warn_title: "⚠ Expérimental",
        cu_disclaimer: "Dépasser 24 CU peut causer instabilité GPU ou surchauffe. Commencer par 32 CU · Surveiller les temps · Revenir à 24 CU si instable.",
        sys_temps: "Températures", sys_status: "Statut", sys_scheduler: "Scheduler",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ actif", sys_inactive: "✗ inactif", sys_unknown: "inconnu",
        sys_last_update: "Dernier update",
        sys_btn_update: "Mettre à jour les tweaks", sys_btn_updating: "Mise à jour...",
        sys_toast_ok: "✓ Tweaks mis à jour", sys_toast_fail: "✗ Erreur mise à jour", sys_log: "Log",
        set_auto: "Auto-apply au lancement",
        set_auto_desc: "Applique automatiquement les settings quand un jeu connu est lancé",
        set_refresh_db: "Rafraîchir DB depuis GitHub", set_refreshing: "Rafraîchissement...",
        set_db_date: "DB mise à jour le", set_contribute: "Contribuer", toast_db_ok: "DB mise à jour",
    },
    de: {
        tab_games: "Spiele", tab_cu: "CU", tab_system: "System", tab_settings: "Einstellungen",
        db_optimized: "Optimierte Spiele für BC-250",
        db_count: "{count} Spiele",
        installed_compat: "Installiert & kompatibel",
        no_games: "Keine Spiele aus der DB installiert",
        settings_title: "Anzuwendende Einstellungen",
        label_proton: "Proton", label_launch: "Startoptionen", label_notes: "Notizen",
        btn_apply: "BC-250 Einstellungen anwenden",
        btn_applying: "Wird angewendet...",
        btn_applied: "✓ Angewendet (Steam einmal neu starten)",
        btn_refresh: "Aktualisieren",
        toast_applied: "✓ Einstellungen angewendet: {name}",
        toast_error: "✗ Fehler: {detail}",
        toast_persistent: "✓ Dauerhaft — Steam einmal neu starten",
        toast_partial_compat: "⚠ Teilweise: Proton OK — Startoptionen fehlgeschlagen",
        toast_partial_launch: "⚠ Teilweise: Startoptionen OK — Proton fehlgeschlagen",
        cu_title: "CU-Status", cu_live: "Aktive CU (live)",
        cu_reading: "Lesen...", cu_na: "N/A", cu_boot: "Boot",
        cu_no_umr: "⚠ umr nicht verfügbar — für CU-Verwaltung erforderlich",
        cu_install_umr: "umr automatisch installieren",
        cu_installing_umr: "Installation läuft...",
        cu_profiles: "Profile", cu_options: "Optionen",
        cu_save_boot: "Beim Booten speichern",
        cu_save_boot_desc: "CU-Profil wird bei jedem Start automatisch wiederhergestellt",
        cu_legend: "1 WGP = 2 CU • 5 WGP/Reihe × 4 Reihen = 40 CU max\n36 CU = SE0 voll (10+10) + SE1 teilw. (8+8)",
        cu_applying: "Wird angewendet...",
        cu_done_live: "✓ {count} CU angewendet (live — nicht dauerhaft)",
        cu_done_boot: "✓ {count} CU angewendet und beim Boot gespeichert",
        toast_umr_start: "umr wird installiert (~30s)...",
        toast_umr_ok: "✓ umr installiert — CU verfügbar",
        toast_umr_already: "✓ umr bereits verfügbar",
        toast_umr_fail: "✗ umr-Installation fehlgeschlagen: {error}",
        cu_warn_title: "⚠ Experimentell",
        cu_disclaimer: "Über 24 CU kann GPU-Instabilität oder Überhitzung verursachen. Mit 32 CU beginnen · Temps überwachen · Bei Problemen auf 24 CU zurück.",
        sys_temps: "Temperaturen", sys_status: "Status", sys_scheduler: "Scheduler",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ aktiv", sys_inactive: "✗ inaktiv", sys_unknown: "unbekannt",
        sys_last_update: "Letztes Update",
        sys_btn_update: "Tweaks aktualisieren", sys_btn_updating: "Aktualisiere...",
        sys_toast_ok: "✓ Tweaks aktualisiert", sys_toast_fail: "✗ Update-Fehler", sys_log: "Log",
        set_auto: "Automatisch beim Start anwenden",
        set_auto_desc: "Wendet Einstellungen automatisch an, wenn ein bekanntes Spiel gestartet wird",
        set_refresh_db: "DB von GitHub aktualisieren", set_refreshing: "Wird aktualisiert...",
        set_db_date: "DB aktualisiert am", set_contribute: "Beitragen", toast_db_ok: "DB aktualisiert",
    },
    es: {
        tab_games: "Juegos", tab_cu: "CU", tab_system: "Sistema", tab_settings: "Ajustes",
        db_optimized: "Juegos optimizados para BC-250",
        db_count: "{count} juegos",
        installed_compat: "Instalados y compatibles",
        no_games: "No hay juegos de la BD instalados",
        settings_title: "Configuración a aplicar",
        label_proton: "Proton", label_launch: "Opciones de inicio", label_notes: "Notas",
        btn_apply: "Aplicar configuración BC-250",
        btn_applying: "Aplicando...",
        btn_applied: "✓ Aplicado (reinicia Steam una vez)",
        btn_refresh: "Actualizar",
        toast_applied: "✓ Configuración aplicada: {name}",
        toast_error: "✗ Error: {detail}",
        toast_persistent: "✓ Persistente — reinicia Steam una vez",
        toast_partial_compat: "⚠ Parcial: Proton OK — Opciones de inicio fallaron",
        toast_partial_launch: "⚠ Parcial: Opciones OK — Proton falló",
        cu_title: "Estado CU", cu_live: "CU activos (en vivo)",
        cu_reading: "leyendo...", cu_na: "N/D", cu_boot: "Arranque",
        cu_no_umr: "⚠ umr no disponible — necesario para gestión CU",
        cu_install_umr: "Instalar umr automáticamente",
        cu_installing_umr: "Instalando...",
        cu_profiles: "Perfiles", cu_options: "Opciones",
        cu_save_boot: "Guardar al arranque",
        cu_save_boot_desc: "El perfil CU se restaura automáticamente en cada inicio",
        cu_legend: "1 WGP = 2 CU • 5 WGP/fila × 4 filas = 40 CU máx\n36 CU = SE0 completo (10+10) + SE1 parcial (8+8)",
        cu_applying: "Aplicando...",
        cu_done_live: "✓ {count} CU aplicados (en vivo — no persistente)",
        cu_done_boot: "✓ {count} CU aplicados y guardados al arranque",
        toast_umr_start: "Instalando umr (~30s)...",
        toast_umr_ok: "✓ umr instalado — CU disponible",
        toast_umr_already: "✓ umr ya disponible",
        toast_umr_fail: "✗ Instalación de umr fallida: {error}",
        cu_warn_title: "⚠ Experimental",
        cu_disclaimer: "Más de 24 CU puede causar inestabilidad GPU o sobrecalentamiento. Empezar con 32 CU · Vigilar temps · Volver a 24 CU si inestable.",
        sys_temps: "Temperaturas", sys_status: "Estado", sys_scheduler: "Planificador",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ activo", sys_inactive: "✗ inactivo", sys_unknown: "desconocido",
        sys_last_update: "Última actualización",
        sys_btn_update: "Actualizar tweaks", sys_btn_updating: "Actualizando...",
        sys_toast_ok: "✓ Tweaks actualizados", sys_toast_fail: "✗ Error de actualización", sys_log: "Log",
        set_auto: "Auto-aplicar al iniciar",
        set_auto_desc: "Aplica ajustes automáticamente cuando se lanza un juego conocido",
        set_refresh_db: "Actualizar BD desde GitHub", set_refreshing: "Actualizando...",
        set_db_date: "BD actualizada el", set_contribute: "Contribuir", toast_db_ok: "BD actualizada",
    },
    it: {
        tab_games: "Giochi", tab_cu: "CU", tab_system: "Sistema", tab_settings: "Impostazioni",
        db_optimized: "Giochi ottimizzati per BC-250",
        db_count: "{count} giochi",
        installed_compat: "Installati e compatibili",
        no_games: "Nessun gioco del DB installato",
        settings_title: "Impostazioni da applicare",
        label_proton: "Proton", label_launch: "Opzioni di lancio", label_notes: "Note",
        btn_apply: "Applica impostazioni BC-250",
        btn_applying: "Applicazione...",
        btn_applied: "✓ Applicato (riavvia Steam una volta)",
        btn_refresh: "Aggiorna",
        toast_applied: "✓ Impostazioni applicate: {name}",
        toast_error: "✗ Errore: {detail}",
        toast_persistent: "✓ Persistente — riavvia Steam una volta",
        toast_partial_compat: "⚠ Parziale: Proton OK — Opzioni lancio fallite",
        toast_partial_launch: "⚠ Parziale: Opzioni OK — Proton fallito",
        cu_title: "Stato CU", cu_live: "CU attivi (live)",
        cu_reading: "lettura...", cu_na: "N/D", cu_boot: "Avvio",
        cu_no_umr: "⚠ umr non disponibile — richiesto per gestione CU",
        cu_install_umr: "Installa umr automaticamente",
        cu_installing_umr: "Installazione...",
        cu_profiles: "Profili", cu_options: "Opzioni",
        cu_save_boot: "Salva all'avvio",
        cu_save_boot_desc: "Il profilo CU viene ripristinato automaticamente ad ogni avvio",
        cu_legend: "1 WGP = 2 CU • 5 WGP/fila × 4 file = 40 CU max\n36 CU = SE0 completo (10+10) + SE1 parziale (8+8)",
        cu_applying: "Applicazione...",
        cu_done_live: "✓ {count} CU applicati (live — non persistente)",
        cu_done_boot: "✓ {count} CU applicati e salvati all'avvio",
        toast_umr_start: "Installazione umr (~30s)...",
        toast_umr_ok: "✓ umr installato — CU disponibile",
        toast_umr_already: "✓ umr già disponibile",
        toast_umr_fail: "✗ Installazione umr fallita: {error}",
        cu_warn_title: "⚠ Sperimentale",
        cu_disclaimer: "Oltre 24 CU può causare instabilità GPU o surriscaldamento. Iniziare con 32 CU · Monitorare temp · Tornare a 24 CU se instabile.",
        sys_temps: "Temperature", sys_status: "Stato", sys_scheduler: "Scheduler",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ attivo", sys_inactive: "✗ inattivo", sys_unknown: "sconosciuto",
        sys_last_update: "Ultimo aggiornamento",
        sys_btn_update: "Aggiorna tweaks", sys_btn_updating: "Aggiornamento...",
        sys_toast_ok: "✓ Tweaks aggiornati", sys_toast_fail: "✗ Errore aggiornamento", sys_log: "Log",
        set_auto: "Auto-applica all'avvio",
        set_auto_desc: "Applica automaticamente le impostazioni quando viene avviato un gioco noto",
        set_refresh_db: "Aggiorna DB da GitHub", set_refreshing: "Aggiornamento...",
        set_db_date: "DB aggiornato il", set_contribute: "Contribuisci", toast_db_ok: "DB aggiornato",
    },
    pt: {
        tab_games: "Jogos", tab_cu: "CU", tab_system: "Sistema", tab_settings: "Configurações",
        db_optimized: "Jogos otimizados para BC-250",
        db_count: "{count} jogos",
        installed_compat: "Instalados e compatíveis",
        no_games: "Nenhum jogo do BD instalado",
        settings_title: "Configurações a aplicar",
        label_proton: "Proton", label_launch: "Opções de lançamento", label_notes: "Notas",
        btn_apply: "Aplicar configurações BC-250",
        btn_applying: "Aplicando...",
        btn_applied: "✓ Aplicado (reinicia Steam uma vez)",
        btn_refresh: "Atualizar",
        toast_applied: "✓ Configurações aplicadas: {name}",
        toast_error: "✗ Erro: {detail}",
        toast_persistent: "✓ Persistente — reinicia Steam uma vez",
        toast_partial_compat: "⚠ Parcial: Proton OK — Opções de lançamento falharam",
        toast_partial_launch: "⚠ Parcial: Opções OK — Proton falhou",
        cu_title: "Estado CU", cu_live: "CU ativos (ao vivo)",
        cu_reading: "lendo...", cu_na: "N/D", cu_boot: "Arranque",
        cu_no_umr: "⚠ umr não disponível — necessário para gestão CU",
        cu_install_umr: "Instalar umr automaticamente",
        cu_installing_umr: "Instalando...",
        cu_profiles: "Perfis", cu_options: "Opções",
        cu_save_boot: "Guardar no arranque",
        cu_save_boot_desc: "O perfil CU é restaurado automaticamente a cada arranque",
        cu_legend: "1 WGP = 2 CU • 5 WGP/linha × 4 linhas = 40 CU máx\n36 CU = SE0 completo (10+10) + SE1 parcial (8+8)",
        cu_applying: "Aplicando...",
        cu_done_live: "✓ {count} CU aplicados (ao vivo — não persistente)",
        cu_done_boot: "✓ {count} CU aplicados e guardados no arranque",
        toast_umr_start: "Instalando umr (~30s)...",
        toast_umr_ok: "✓ umr instalado — CU disponível",
        toast_umr_already: "✓ umr já disponível",
        toast_umr_fail: "✗ Instalação de umr falhou: {error}",
        cu_warn_title: "⚠ Experimental",
        cu_disclaimer: "Além de 24 CU pode causar instabilidade GPU ou sobreaquecimento. Começar com 32 CU · Monitorizar temps · Voltar a 24 CU se instável.",
        sys_temps: "Temperaturas", sys_status: "Estado", sys_scheduler: "Scheduler",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ ativo", sys_inactive: "✗ inativo", sys_unknown: "desconhecido",
        sys_last_update: "Última atualização",
        sys_btn_update: "Atualizar tweaks", sys_btn_updating: "Atualizando...",
        sys_toast_ok: "✓ Tweaks atualizados", sys_toast_fail: "✗ Erro de atualização", sys_log: "Log",
        set_auto: "Auto-aplicar ao iniciar",
        set_auto_desc: "Aplica configurações automaticamente quando um jogo conhecido é lançado",
        set_refresh_db: "Atualizar BD do GitHub", set_refreshing: "Atualizando...",
        set_db_date: "BD atualizado em", set_contribute: "Contribuir", toast_db_ok: "BD atualizado",
    },
    nl: {
        tab_games: "Spellen", tab_cu: "CU", tab_system: "Systeem", tab_settings: "Instellingen",
        db_optimized: "Geoptimaliseerde spellen voor BC-250",
        db_count: "{count} spellen",
        installed_compat: "Geïnstalleerd & compatibel",
        no_games: "Geen spellen uit de DB geïnstalleerd",
        settings_title: "Toe te passen instellingen",
        label_proton: "Proton", label_launch: "Startopties", label_notes: "Notities",
        btn_apply: "BC-250 instellingen toepassen",
        btn_applying: "Toepassen...",
        btn_applied: "✓ Toegepast (herstart Steam eenmaal)",
        btn_refresh: "Vernieuwen",
        toast_applied: "✓ Instellingen toegepast: {name}",
        toast_error: "✗ Fout: {detail}",
        toast_persistent: "✓ Blijvend — herstart Steam eenmaal",
        toast_partial_compat: "⚠ Gedeeltelijk: Proton OK — Startopties mislukt",
        toast_partial_launch: "⚠ Gedeeltelijk: Startopties OK — Proton mislukt",
        cu_title: "CU-status", cu_live: "Actieve CU (live)",
        cu_reading: "lezen...", cu_na: "N.v.t.", cu_boot: "Opstarten",
        cu_no_umr: "⚠ umr niet beschikbaar — vereist voor CU-beheer",
        cu_install_umr: "umr automatisch installeren",
        cu_installing_umr: "Installeren...",
        cu_profiles: "Profielen", cu_options: "Opties",
        cu_save_boot: "Opslaan bij opstarten",
        cu_save_boot_desc: "CU-profiel wordt automatisch hersteld bij elke start",
        cu_legend: "1 WGP = 2 CU • 5 WGP/rij × 4 rijen = 40 CU max\n36 CU = SE0 volledig (10+10) + SE1 gedeeltelijk (8+8)",
        cu_applying: "Toepassen...",
        cu_done_live: "✓ {count} CU toegepast (live — niet blijvend)",
        cu_done_boot: "✓ {count} CU toegepast en opgeslagen bij opstarten",
        toast_umr_start: "umr installeren (~30s)...",
        toast_umr_ok: "✓ umr geïnstalleerd — CU beschikbaar",
        toast_umr_already: "✓ umr al beschikbaar",
        toast_umr_fail: "✗ umr installatie mislukt: {error}",
        cu_warn_title: "⚠ Experimenteel",
        cu_disclaimer: "Boven 24 CU kan GPU-instabiliteit of oververhitting veroorzaken. Start met 32 CU · Monitor temps · Terug naar 24 CU indien instabiel.",
        sys_temps: "Temperaturen", sys_status: "Status", sys_scheduler: "Planner",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ actief", sys_inactive: "✗ inactief", sys_unknown: "onbekend",
        sys_last_update: "Laatste update",
        sys_btn_update: "Tweaks bijwerken", sys_btn_updating: "Bijwerken...",
        sys_toast_ok: "✓ Tweaks bijgewerkt", sys_toast_fail: "✗ Update fout", sys_log: "Log",
        set_auto: "Automatisch toepassen bij start",
        set_auto_desc: "Past instellingen automatisch toe wanneer een bekend spel wordt gestart",
        set_refresh_db: "DB bijwerken van GitHub", set_refreshing: "Bijwerken...",
        set_db_date: "DB bijgewerkt op", set_contribute: "Bijdragen", toast_db_ok: "DB bijgewerkt",
    },
    pl: {
        tab_games: "Gry", tab_cu: "CU", tab_system: "System", tab_settings: "Ustawienia",
        db_optimized: "Zoptymalizowane gry dla BC-250",
        db_count: "{count} gier",
        installed_compat: "Zainstalowane i kompatybilne",
        no_games: "Brak zainstalowanych gier z bazy",
        settings_title: "Ustawienia do zastosowania",
        label_proton: "Proton", label_launch: "Opcje uruchomienia", label_notes: "Notatki",
        btn_apply: "Zastosuj ustawienia BC-250",
        btn_applying: "Stosowanie...",
        btn_applied: "✓ Zastosowano (uruchom Steam ponownie)",
        btn_refresh: "Odśwież",
        toast_applied: "✓ Ustawienia zastosowane: {name}",
        toast_error: "✗ Błąd: {detail}",
        toast_persistent: "✓ Trwałe — uruchom Steam ponownie",
        toast_partial_compat: "⚠ Częściowe: Proton OK — Opcje uruch. nie powiodły się",
        toast_partial_launch: "⚠ Częściowe: Opcje OK — Proton nie powiódł się",
        cu_title: "Status CU", cu_live: "Aktywne CU (live)",
        cu_reading: "odczyt...", cu_na: "N/D", cu_boot: "Rozruch",
        cu_no_umr: "⚠ umr niedostępny — wymagany do zarządzania CU",
        cu_install_umr: "Zainstaluj umr automatycznie",
        cu_installing_umr: "Instalowanie...",
        cu_profiles: "Profile", cu_options: "Opcje",
        cu_save_boot: "Zapisz przy rozruchu",
        cu_save_boot_desc: "Profil CU jest automatycznie przywracany przy każdym uruchomieniu",
        cu_legend: "1 WGP = 2 CU • 5 WGP/wiersz × 4 wiersze = 40 CU maks\n36 CU = SE0 pełny (10+10) + SE1 częściowy (8+8)",
        cu_applying: "Stosowanie...",
        cu_done_live: "✓ {count} CU zastosowane (live — nietrwałe)",
        cu_done_boot: "✓ {count} CU zastosowane i zapisane przy rozruchu",
        toast_umr_start: "Instalowanie umr (~30s)...",
        toast_umr_ok: "✓ umr zainstalowany — CU dostępne",
        toast_umr_already: "✓ umr już dostępny",
        toast_umr_fail: "✗ Instalacja umr nie powiodła się: {error}",
        cu_warn_title: "⚠ Eksperymentalne",
        cu_disclaimer: "Powyżej 24 CU może powodować niestabilność GPU lub przegrzanie. Zacznij od 32 CU · Monitoruj temps · Wróć do 24 CU jeśli niestabilne.",
        sys_temps: "Temperatury", sys_status: "Status", sys_scheduler: "Harmonogram",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ aktywny", sys_inactive: "✗ nieaktywny", sys_unknown: "nieznany",
        sys_last_update: "Ostatnia aktualizacja",
        sys_btn_update: "Aktualizuj tweaki", sys_btn_updating: "Aktualizowanie...",
        sys_toast_ok: "✓ Tweaki zaktualizowane", sys_toast_fail: "✗ Błąd aktualizacji", sys_log: "Log",
        set_auto: "Automatyczne stosowanie przy uruchomieniu",
        set_auto_desc: "Automatycznie stosuje ustawienia gdy uruchamiana jest znana gra",
        set_refresh_db: "Odśwież bazę z GitHub", set_refreshing: "Odświeżanie...",
        set_db_date: "Baza zaktualizowana", set_contribute: "Współtwórz", toast_db_ok: "Baza zaktualizowana",
    },
    ru: {
        tab_games: "Игры", tab_cu: "CU", tab_system: "Система", tab_settings: "Настройки",
        db_optimized: "Оптимизированные игры для BC-250",
        db_count: "{count} игр",
        installed_compat: "Установленные и совместимые",
        no_games: "Нет установленных игр из базы",
        settings_title: "Настройки для применения",
        label_proton: "Proton", label_launch: "Параметры запуска", label_notes: "Заметки",
        btn_apply: "Применить настройки BC-250",
        btn_applying: "Применение...",
        btn_applied: "✓ Применено (перезапустите Steam)",
        btn_refresh: "Обновить",
        toast_applied: "✓ Настройки применены: {name}",
        toast_error: "✗ Ошибка: {detail}",
        toast_persistent: "✓ Постоянно — перезапустите Steam",
        toast_partial_compat: "⚠ Частично: Proton OK — Параметры запуска не удались",
        toast_partial_launch: "⚠ Частично: Параметры OK — Proton не удался",
        cu_title: "Состояние CU", cu_live: "Активных CU (live)",
        cu_reading: "чтение...", cu_na: "Н/Д", cu_boot: "Загрузка",
        cu_no_umr: "⚠ umr недоступен — требуется для управления CU",
        cu_install_umr: "Установить umr автоматически",
        cu_installing_umr: "Установка...",
        cu_profiles: "Профили", cu_options: "Опции",
        cu_save_boot: "Сохранить при загрузке",
        cu_save_boot_desc: "Профиль CU автоматически восстанавливается при каждом запуске",
        cu_legend: "1 WGP = 2 CU • 5 WGP/ряд × 4 ряда = 40 CU макс\n36 CU = SE0 полный (10+10) + SE1 частичный (8+8)",
        cu_applying: "Применение...",
        cu_done_live: "✓ {count} CU применено (live — не постоянно)",
        cu_done_boot: "✓ {count} CU применено и сохранено при загрузке",
        toast_umr_start: "Установка umr (~30s)...",
        toast_umr_ok: "✓ umr установлен — CU доступно",
        toast_umr_already: "✓ umr уже доступен",
        toast_umr_fail: "✗ Установка umr не удалась: {error}",
        cu_warn_title: "⚠ Экспериментально",
        cu_disclaimer: "Выше 24 CU может вызвать нестабильность GPU или перегрев. Начать с 32 CU · Следить за temp · Вернуться к 24 CU при проблемах.",
        sys_temps: "Температуры", sys_status: "Состояние", sys_scheduler: "Планировщик",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ активен", sys_inactive: "✗ неактивен", sys_unknown: "неизвестно",
        sys_last_update: "Последнее обновление",
        sys_btn_update: "Обновить твики", sys_btn_updating: "Обновление...",
        sys_toast_ok: "✓ Твики обновлены", sys_toast_fail: "✗ Ошибка обновления", sys_log: "Log",
        set_auto: "Авто-применение при запуске",
        set_auto_desc: "Автоматически применяет настройки при запуске известной игры",
        set_refresh_db: "Обновить базу с GitHub", set_refreshing: "Обновление...",
        set_db_date: "База обновлена", set_contribute: "Внести вклад", toast_db_ok: "База обновлена",
    },
};
function t(key, vars) {
    if (!_locale)
        _locale = detectLocale();
    const dict = T[_locale] ?? T.en;
    let s = dict[key] ?? T.en[key] ?? key;
    if (vars)
        for (const [k, v] of Object.entries(vars))
            s = s.replace(`{${k}}`, String(v));
    return s;
}

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
        const timer = setInterval(refresh, 5000);
        return () => clearInterval(timer);
    }, [refresh]);
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
                    body: ok ? t("toast_applied", { name: g.name }) : t("toast_error", { detail: r.compatDetail }),
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
                toaster.toast({ title: "BC250 Toolkit", body: t("toast_persistent"), duration: 4000 });
            }
            else if (partialOk) {
                toaster.toast({ title: "BC250 Toolkit", body: r.compatOk ? t("toast_partial_compat") : t("toast_partial_launch"), duration: 5000 });
            }
            else {
                toaster.toast({ title: "BC250 Toolkit", body: t("toast_error", { detail: r.compatDetail }), duration: 5000 });
                setApplied(false);
            }
        }
        finally {
            setApplying(false);
        }
    };
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "DB", description: t("db_optimized"), children: SP_JSX.jsx("span", { style: { color: "#67a3ff", fontWeight: "bold" }, children: t("db_count", { count: gameCount }) }) }) }) }), installed.length > 0 ? (SP_JSX.jsx(DFL.PanelSection, { title: t("installed_compat"), children: installed.map((entry) => {
                    const isSelected = selected?.appid === entry.appid;
                    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => { setSelected(isSelected ? null : entry); setApplied(false); }, style: isSelected ? { color: "#67a3ff", fontWeight: "bold" } : { opacity: 0.8 }, children: isSelected ? `▶ ${entry.name}` : entry.name }) }, entry.appid));
                }) })) : (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: { color: "#888", fontSize: "12px", textAlign: "center", padding: "8px 0" }, children: t("no_games") }) }) }) })), selected && (SP_JSX.jsxs(DFL.PanelSection, { title: t("settings_title"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("label_proton"), children: SP_JSX.jsxs("span", { style: { fontSize: "12px" }, children: [selected.game.proton, selected.game.proton_branch ? ` — ${selected.game.proton_branch}` : ""] }) }) }), selected.game.proton_note && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#ff9800", lineHeight: "1.4" }, children: selected.game.proton_note }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("label_launch"), children: SP_JSX.jsx("div", { style: { fontSize: "10px", wordBreak: "break-all", color: "#aaa", lineHeight: "1.4" }, children: selected.game.launch_options }) }) }), selected.game.notes && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("label_notes"), children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#ccc" }, children: selected.game.notes }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: applying || applied, onClick: handleApply, children: applying ? t("btn_applying") : applied ? t("btn_applied") : t("btn_apply") }) })] })), SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: refresh, children: t("btn_refresh") }) }) })] }));
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
        const timer = setInterval(refresh, 10000);
        return () => clearInterval(timer);
    }, [refresh]);
    const handleInstallUmr = async () => {
        setInstallingUmr(true);
        setLastMsg(null);
        toaster.toast({ title: "BC250 Toolkit", body: t("toast_umr_start"), duration: 5000 });
        try {
            const r = await call("install_umr");
            if (r.ok) {
                const msg = r.already ? t("toast_umr_already") : t("toast_umr_ok");
                setLastMsg(msg);
                toaster.toast({ title: "BC250 Toolkit", body: msg, duration: 4000 });
                refresh();
            }
            else {
                const msg = t("toast_umr_fail", { error: r.error ?? "" });
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
                let msg = saveBoot
                    ? t("cu_done_boot", { count: r.cu_count ?? 0 })
                    : t("cu_done_live", { count: r.cu_count ?? 0 });
                if (saveBoot && r.boot_saved === false) {
                    msg = `${t("cu_done_live", { count: r.cu_count ?? 0 })} — boot: ✗ ${r.boot_error ?? "sudoers?"}`;
                }
                setLastMsg(msg);
                toaster.toast({ title: "BC250 Toolkit", body: msg, duration: saveBoot && r.boot_saved === false ? 6000 : 3000 });
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
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: t("cu_title"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("cu_live"), children: SP_JSX.jsx("span", { style: { fontWeight: "bold", color: "#67a3ff", fontSize: "14px" }, children: status.cu_count != null && status.cu_count > 0
                                    ? `${status.cu_count} / 40 CU`
                                    : status.umr_available
                                        ? t("cu_reading")
                                        : t("cu_na") }) }) }), status.boot_cu != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("cu_boot"), children: SP_JSX.jsxs("span", { style: { fontSize: "12px", color: "#aaa" }, children: [status.boot_cu, " CU", status.boot_profile ? ` (${status.boot_profile})` : ""] }) }) })), !status.umr_available && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                            fontSize: "12px", color: "#ff9800", lineHeight: "1.4",
                                            borderLeft: "3px solid #ff9800", paddingLeft: "8px",
                                        }, children: t("cu_no_umr") }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: installingUmr, onClick: handleInstallUmr, children: installingUmr ? t("cu_installing_umr") : t("cu_install_umr") }) })] }))] }), SP_JSX.jsx(DFL.PanelSection, { title: t("cu_warn_title"), children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                            fontSize: "13px", color: "#ff9800", lineHeight: "1.5",
                            borderLeft: "3px solid #ff9800", paddingLeft: "10px",
                            paddingTop: "6px", paddingBottom: "6px",
                            background: "rgba(255,152,0,0.08)", borderRadius: "0 4px 4px 0",
                        }, children: t("cu_disclaimer") }) }) }), SP_JSX.jsx(DFL.PanelSection, { title: t("cu_profiles"), children: CU_PROFILE_LIST.map(({ key, label, color }) => {
                    const isActive = status.current_profile === key;
                    const isBoot = status.boot_profile === key;
                    const isApplying = applying === key;
                    const suffix = isBoot && !isActive ? " [boot]" : isActive && isBoot ? " [live+boot]" : "";
                    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => applyProfile(key), disabled: !!applying || !status.umr_available, style: isActive ? { color, fontWeight: "bold" } : { opacity: 0.75 }, children: isApplying ? t("cu_applying") : `${isActive ? "▶ " : ""}${label}${suffix}` }) }, key));
                }) }), SP_JSX.jsxs(DFL.PanelSection, { title: t("cu_options"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: t("cu_save_boot"), description: t("cu_save_boot_desc"), checked: saveBoot, onChange: setSaveBoot }) }), lastMsg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                    fontSize: "11px",
                                    color: lastMsg.startsWith("✓") ? "#4caf50" : "#f44336",
                                    lineHeight: "1.4",
                                }, children: lastMsg }) }) }))] }), SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                fontSize: "10px", color: "#888", lineHeight: "1.5",
                                whiteSpace: "pre-line", textAlign: "center",
                            }, children: t("cu_legend") }) }) }) })] }));
}
// ── Onglet Système ────────────────────────────────────────────────────────────
function SystemTab() {
    const [status, setStatus] = SP_REACT.useState(null);
    const [updating, setUpdating] = SP_REACT.useState(false);
    const [updateLog, setUpdateLog] = SP_REACT.useState(null);
    SP_REACT.useEffect(() => {
        call("get_system_status").then(setStatus);
        const timer = setInterval(() => call("get_system_status").then(setStatus), 5000);
        return () => clearInterval(timer);
    }, []);
    const handleUpdate = async () => {
        setUpdating(true);
        setUpdateLog(null);
        try {
            const r = await call("run_tweaks_update");
            setUpdateLog(r.success ? (r.stdout ?? "OK") : (r.error ?? "Erreur inconnue"));
            toaster.toast({
                title: "BC250 Toolkit",
                body: r.success ? t("sys_toast_ok") : t("sys_toast_fail"),
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
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: t("sys_temps"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "CPU", children: SP_JSX.jsx("span", { style: { color: tempColor(status.cpu_temp), fontWeight: "bold" }, children: status.cpu_temp != null ? `${status.cpu_temp}°C` : t("cu_na") }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "GPU", children: SP_JSX.jsx("span", { style: { color: tempColor(status.gpu_temp), fontWeight: "bold" }, children: status.gpu_temp != null ? `${status.gpu_temp}°C` : t("cu_na") }) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: t("sys_status"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_scheduler"), children: SP_JSX.jsx("span", { style: { color: status.scx_state === "enabled" ? "#4caf50" : "#f44336", fontSize: "12px" }, children: status.scx_state === "enabled"
                                    ? `✓ ${status.scx_sched ?? "scx"}`
                                    : `✗ ${status.scx_state ?? t("sys_unknown")}` }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_tuned"), children: SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#ccc" }, children: status.tuned_profile ?? t("sys_unknown") }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_gamemode"), children: SP_JSX.jsx("span", { style: { color: status.gamemode_active ? "#4caf50" : "#f44336" }, children: status.gamemode_active ? t("sys_active") : t("sys_inactive") }) }) })] }), status.tweaks_installed && (SP_JSX.jsxs(DFL.PanelSection, { title: "bc250-tweaks", children: [status.tweaks_last_update && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_last_update"), children: SP_JSX.jsx("span", { style: { fontSize: "10px", color: "#aaa" }, children: status.tweaks_last_update }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: updating, onClick: handleUpdate, children: updating ? t("sys_btn_updating") : t("sys_btn_update") }) }), updateLog && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_log"), children: SP_JSX.jsx("div", { style: {
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
    return (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: t("set_auto"), description: t("set_auto_desc"), checked: autoApply, onChange: setAutoApply }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: refreshing, onClick: doRefresh, children: refreshing ? t("set_refreshing") : t("set_refresh_db") }) }), meta?.updated && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("set_db_date"), children: SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#888" }, children: meta.updated }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("set_contribute"), children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#67a3ff" }, children: "github.com/Necrosiak/bc250-toolkit-decky" }) }) })] }));
}
const TAB_DEFS = [
    { id: "games", tKey: "tab_games" },
    { id: "cu", tKey: "tab_cu" },
    { id: "system", tKey: "tab_system" },
    { id: "settings", tKey: "tab_settings" },
];
function TabBar({ tab, setTab }) {
    return (SP_JSX.jsx(DFL.PanelSection, { children: TAB_DEFS.map(({ id, tKey }) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setTab(id), style: tab === id ? { color: "#67a3ff", fontWeight: "bold" } : { opacity: 0.6 }, children: tab === id ? `▶ ${t(tKey)}` : t(tKey) }) }, id))) }));
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
        toaster.toast({ title: "BC250 Toolkit", body: t("toast_db_ok"), duration: 2000 });
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
