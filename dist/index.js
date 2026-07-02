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
        about: "About",
        about_by: "by",
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
        // Variants / requirements
        variant_title: "Configuration",
        label_radv: "radv (drirc)",
        req_uma: "⚠ Requires UMA Frame Buffer ≥ {mb} MB (BIOS / AMD CBS)",
        toast_autoapply_on: "Auto-apply ON — {count} installed game(s) pre-configured",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "Current VRAM",
        uma_bios: "BIOS (next boot)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Takes effect at the NEXT reboot. Auto (≈8 GB) is the safe recommended value. If you see graphical artifacts (e.g. green glitches) after a change, switch back to Auto.",
        uma_done: "✓ UMA {label} written to BIOS — reboot to apply",
        uma_writing: "Writing...",
        uma_not_supported: "⚠ Unsupported BIOS ({detail}) — UMA control disabled",
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
        update_section: "Updates",
        update_auto: "Automatic updates",
        update_check: "Check for updates",
        update_checking: "Checking…",
        update_install: "Install {v}",
        update_installing: "Installing…",
        update_up_to_date: "Up to date ({v})",
        set_refresh_db: "Refresh DB from GitHub",
        set_refreshing: "Refreshing...",
        set_db_date: "DB updated on",
        set_contribute: "Contribute",
        toast_db_ok: "DB updated",
    },
    fr: {
        tab_games: "Jeux", tab_cu: "CU", tab_system: "Système", tab_settings: "Réglages",
        about: "À propos", about_by: "par",
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
        variant_title: "Configuration",
        label_radv: "radv (drirc)",
        req_uma: "⚠ Nécessite UMA Frame Buffer ≥ {mb} Mo (BIOS / AMD CBS)",
        toast_autoapply_on: "Auto-apply ON — {count} jeu(x) installé(s) pré-configuré(s)",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "VRAM actuelle",
        uma_bios: "BIOS (prochain boot)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Prend effet au PROCHAIN redémarrage. Auto (≈8 Go) est la valeur sûre recommandée. Si des artefacts graphiques (ex. verts) apparaissent après un changement, repasse en Auto.",
        uma_done: "✓ UMA {label} écrit dans le BIOS — redémarre pour appliquer",
        uma_writing: "Écriture...",
        uma_not_supported: "⚠ BIOS non supporté ({detail}) — contrôle UMA désactivé",
        sys_temps: "Températures", sys_status: "Statut", sys_scheduler: "Scheduler",
        sys_tuned: "Tuned", sys_gamemode: "Gamemode",
        sys_active: "✓ actif", sys_inactive: "✗ inactif", sys_unknown: "inconnu",
        sys_last_update: "Dernier update",
        sys_btn_update: "Mettre à jour les tweaks", sys_btn_updating: "Mise à jour...",
        sys_toast_ok: "✓ Tweaks mis à jour", sys_toast_fail: "✗ Erreur mise à jour", sys_log: "Log",
        set_auto: "Auto-apply au lancement",
        set_auto_desc: "Applique automatiquement les settings quand un jeu connu est lancé",
        update_section: "Mises à jour",
        update_auto: "Mises à jour automatiques",
        update_check: "Vérifier les mises à jour",
        update_checking: "Vérification…",
        update_install: "Installer {v}",
        update_installing: "Installation…",
        update_up_to_date: "À jour ({v})",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "Aktuelle VRAM",
        uma_bios: "BIOS (nächster Boot)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Wirkt erst beim NÄCHSTEN Neustart. Auto (≈8 GB) ist der sichere empfohlene Wert. Bei Grafikartefakten (z. B. grünen Störungen) nach einer Änderung zurück auf Auto stellen.",
        uma_done: "✓ UMA {label} ins BIOS geschrieben — zum Anwenden neu starten",
        uma_writing: "Schreibe...",
        uma_not_supported: "⚠ Nicht unterstütztes BIOS ({detail}) — UMA-Steuerung deaktiviert",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "VRAM actual",
        uma_bios: "BIOS (próximo arranque)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Surte efecto en el PRÓXIMO reinicio. Auto (≈8 GB) es el valor seguro recomendado. Si aparecen artefactos gráficos (p. ej. verdes) tras un cambio, vuelve a Auto.",
        uma_done: "✓ UMA {label} escrito en el BIOS — reinicia para aplicar",
        uma_writing: "Escribiendo...",
        uma_not_supported: "⚠ BIOS no soportado ({detail}) — control UMA desactivado",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "VRAM attuale",
        uma_bios: "BIOS (prossimo avvio)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Ha effetto al PROSSIMO riavvio. Auto (≈8 GB) è il valore sicuro consigliato. Se compaiono artefatti grafici (es. verdi) dopo una modifica, torna su Auto.",
        uma_done: "✓ UMA {label} scritto nel BIOS — riavvia per applicare",
        uma_writing: "Scrittura...",
        uma_not_supported: "⚠ BIOS non supportato ({detail}) — controllo UMA disattivato",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "VRAM atual",
        uma_bios: "BIOS (próximo arranque)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Tem efeito no PRÓXIMO reinício. Auto (≈8 GB) é o valor seguro recomendado. Se aparecerem artefactos gráficos (p. ex. verdes) após uma alteração, volte para Auto.",
        uma_done: "✓ UMA {label} escrito no BIOS — reinicie para aplicar",
        uma_writing: "A escrever...",
        uma_not_supported: "⚠ BIOS não suportado ({detail}) — controlo UMA desativado",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "Huidige VRAM",
        uma_bios: "BIOS (volgende start)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Wordt pas bij de VOLGENDE herstart actief. Auto (≈8 GB) is de veilige aanbevolen waarde. Zie je grafische artefacten (bv. groene storingen) na een wijziging, zet dan terug op Auto.",
        uma_done: "✓ UMA {label} naar het BIOS geschreven — herstart om toe te passen",
        uma_writing: "Schrijven...",
        uma_not_supported: "⚠ Niet-ondersteund BIOS ({detail}) — UMA-beheer uitgeschakeld",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "Aktualna VRAM",
        uma_bios: "BIOS (następny rozruch)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Zadziała przy NASTĘPNYM restarcie. Auto (≈8 GB) to bezpieczna zalecana wartość. Jeśli po zmianie pojawią się artefakty graficzne (np. zielone), wróć do Auto.",
        uma_done: "✓ UMA {label} zapisane w BIOS-ie — uruchom ponownie, aby zastosować",
        uma_writing: "Zapisywanie...",
        uma_not_supported: "⚠ Nieobsługiwany BIOS ({detail}) — sterowanie UMA wyłączone",
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
        // UMA (VRAM)
        uma_title: "VRAM (UMA)",
        uma_live: "Текущая VRAM",
        uma_bios: "BIOS (следующая загрузка)",
        uma_sizes: "UMA Frame Buffer",
        uma_disclaimer: "Вступает в силу при СЛЕДУЮЩЕЙ перезагрузке. Auto (≈8 ГБ) — безопасное рекомендуемое значение. Если после изменения появились графические артефакты (например, зелёные), вернитесь на Auto.",
        uma_done: "✓ UMA {label} записано в BIOS — перезагрузитесь для применения",
        uma_writing: "Запись...",
        uma_not_supported: "⚠ Неподдерживаемый BIOS ({detail}) — управление UMA отключено",
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

// Notif native Steam (DisplayClientNotification, type 1 = popup + son). Le toaster
// Decky crée des entrées SANS notification_type qui ne s'affichent pas ET font
// PLANTER le panneau de notifs Steam sur ce build. Même forme que toaster.toast
// (title/body) → remplacement transparent partout.
function notify(data) {
    try {
        const App = window.App;
        const steamid = App?.GetCurrentUser?.()?.strSteamID || App?.m_CurrentUser?.strSteamID || "";
        // steamid OBLIGATOIRE : sans lui DisplayClientNotification crée une entrée
        // malformée qui fait planter le panneau de notifs Steam → on s'abstient.
        if (!steamid)
            return;
        window.SteamClient?.ClientNotifications?.DisplayClientNotification?.(1, JSON.stringify({ title: data.title || "BC250 Toolkit", body: data.body, state: "active", steamid }), () => { });
    }
    catch (e) {
        console.error("[BC250] notify failed", e);
    }
}
// Ouvre une URL dans le navigateur intégré du gamemode Steam.
const openUrl = (url) => {
    try {
        window.SteamClient?.URL?.ExecuteSteamURL?.("steam://openurl/" + url);
    }
    catch { }
};
// ── Steam helpers (via backend Python — SteamClient.Apps.Set* cassé dans QAM) ─
// Orchestrateur backend : applique compat_tool + launch_options + radv/drirc
// d'un coup. variantIndex = null → config stable (clés top-level) ; sinon configs[i].
async function applyGameConfig(appId, variantIndex) {
    try {
        return await call("apply_game_config", appId, variantIndex);
    }
    catch (e) {
        return { ok: false, error: String(e) };
    }
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
function GamesTab({ gamesDb, savedVariants }) {
    const [installed, setInstalled] = SP_REACT.useState([]);
    const [selected, setSelected] = SP_REACT.useState(null);
    const [variantIdx, setVariantIdx] = SP_REACT.useState(null);
    const [applying, setApplying] = SP_REACT.useState(false);
    const [applied, setApplied] = SP_REACT.useState(false);
    const [rowFocus, setRowFocus] = SP_REACT.useState(null);
    const [variantFocus, setVariantFocus] = SP_REACT.useState(null);
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
    // Variantes du jeu sélectionné — init depuis le choix sauvegardé, sinon variante 0.
    const variants = selected?.game.configs ?? [];
    const hasConfigs = variants.length > 0;
    SP_REACT.useEffect(() => {
        if (!selected) {
            setVariantIdx(null);
            return;
        }
        if (hasConfigs) {
            const saved = savedVariants[String(selected.appid)];
            setVariantIdx(typeof saved === "number" && saved >= 0 && saved < variants.length ? saved : 0);
        }
        else {
            setVariantIdx(null);
        }
        setApplied(false);
    }, [selected, savedVariants]); // eslint-disable-line react-hooks/exhaustive-deps
    // Config affichée = variante active si présente, sinon clés top-level.
    const activeCfg = hasConfigs && variantIdx != null ? variants[variantIdx] : null;
    const dispProton = activeCfg?.compat_tool ?? selected?.game.compat_tool ?? selected?.game.proton;
    const dispLaunch = activeCfg?.launch_options ?? selected?.game.launch_options;
    const dispRadv = activeCfg?.radv ?? selected?.game.radv;
    const dispRequires = activeCfg?.requires ?? selected?.game.requires;
    const handleApply = async () => {
        if (!selected)
            return;
        setApplying(true);
        try {
            const idx = hasConfigs ? variantIdx : null;
            const r = await applyGameConfig(selected.appid, idx);
            // Mémoriser le choix de variante (réutilisé par l'auto-apply).
            call("set_game_variant", selected.appid, idx).catch(() => { });
            if (r.ok) {
                setApplied(true);
                notify({
                    title: "BC250 Toolkit",
                    body: r.need_steam_restart ? t("toast_persistent") : t("toast_applied", { name: selected.game.name })});
            }
            else {
                const detail = r.error ?? r.compat_error ?? r.launch_error ?? r.radv_error ?? "?";
                notify({ title: "BC250 Toolkit", body: t("toast_error", { detail })});
                setApplied(false);
            }
        }
        finally {
            setApplying(false);
        }
    };
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: "DB", description: t("db_optimized"), children: SP_JSX.jsx("span", { style: { color: "#67a3ff", fontWeight: "bold" }, children: t("db_count", { count: gameCount }) }) }) }) }), installed.length > 0 ? (SP_JSX.jsx(DFL.PanelSection, { title: t("installed_compat"), children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }, children: installed.map((entry) => {
                            const isSelected = selected?.appid === entry.appid;
                            return (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(GameRow, { name: entry.name, appid: entry.appid, selected: isSelected, focused: rowFocus === entry.appid, onClick: () => { setSelected(isSelected ? null : entry); setApplied(false); }, onFocus: () => setRowFocus(entry.appid), onBlur: () => setRowFocus((f) => (f === entry.appid ? null : f)) }), isSelected && (SP_JSX.jsxs("div", { style: {
                                            marginLeft: 10, marginTop: 4, marginBottom: 6, paddingLeft: 8,
                                            borderLeft: "2px solid rgba(88,101,242,0.45)",
                                            display: "flex", flexDirection: "column", gap: 5,
                                        }, children: [hasConfigs && (SP_JSX.jsx(DFL.Focusable, { "flow-children": "horizontal", style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: variants.map((v, i) => {
                                                    const isActive = variantIdx === i;
                                                    const isFocused = variantFocus === i;
                                                    const color = v.stability === "experimental" ? "#ff9800" : "#4caf50";
                                                    return (SP_JSX.jsx(Btn, { onClick: () => { setVariantIdx(i); setApplied(false); }, onFocus: () => setVariantFocus(i), onBlur: () => setVariantFocus((f) => (f === i ? null : f)), style: {
                                                            padding: "3px 8px", fontSize: 10, minHeight: 0, minWidth: 0, margin: 0, borderRadius: 5,
                                                            color: "#fff", fontWeight: isActive ? 700 : 400,
                                                            background: isActive ? color : "rgba(255,255,255,0.08)",
                                                            // Halo blanc + léger zoom = curseur manette (focus).
                                                            boxShadow: isFocused ? "0 0 0 2px #fff, 0 0 8px 1px " + color : "none",
                                                            transform: isFocused ? "scale(1.06)" : "scale(1)",
                                                            transition: "box-shadow .08s ease, transform .08s ease",
                                                            zIndex: isFocused ? 1 : 0,
                                                        }, children: v.label }, i));
                                                }) })), SP_JSX.jsxs("div", { style: { fontSize: 10, color: "#aaa", lineHeight: 1.45 }, children: [SP_JSX.jsxs("div", { children: [SP_JSX.jsxs("span", { style: { color: "#67a3ff" }, children: [t("label_proton"), ":"] }), " ", dispProton, selected?.game.proton_branch ? ` — ${selected.game.proton_branch}` : ""] }), selected?.game.proton_note && SP_JSX.jsx("div", { style: { color: "#ff9800" }, children: selected.game.proton_note }), dispLaunch && SP_JSX.jsxs("div", { style: { wordBreak: "break-all" }, children: [SP_JSX.jsxs("span", { style: { color: "#67a3ff" }, children: [t("label_launch"), ":"] }), " ", dispLaunch] }), dispRadv && SP_JSX.jsxs("div", { children: [SP_JSX.jsxs("span", { style: { color: "#67a3ff" }, children: [t("label_radv"), ":"] }), " ", Object.entries(dispRadv.options).map(([k, v]) => `${k}=${v}`).join(", ")] }), dispRequires?.uma_min_mb && (SP_JSX.jsxs("div", { style: { color: "#ff9800", borderLeft: "3px solid #ff9800", paddingLeft: 6, marginTop: 2 }, children: [t("req_uma", { mb: dispRequires.uma_min_mb }), dispRequires.note ? ` — ${dispRequires.note}` : ""] })), selected?.game.notes && SP_JSX.jsx("div", { style: { color: "#ccc", marginTop: 2 }, children: selected.game.notes })] }), SP_JSX.jsx(Btn, { disabled: applying || applied, onClick: handleApply, style: { width: "100%", padding: "5px 0", fontSize: 11, minHeight: 0, margin: 0 }, children: applying ? t("btn_applying") : applied ? t("btn_applied") : t("btn_apply") })] }))] }, entry.appid));
                        }) }) }) })) : (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: { color: "#888", fontSize: "12px", textAlign: "center", padding: "8px 0" }, children: t("no_games") }) }) }) })), SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(ActionCard, { onClick: refresh, children: ["\uD83D\uDD04 ", t("btn_refresh")] }) }) })] }));
}
// ── Onglet CU ─────────────────────────────────────────────────────────────────
const CU_PROFILE_LIST = [
    { key: "stock", label: "24 CU (stock)", color: "#4caf50" },
    { key: "32cu", label: "32 CU", color: "#67a3ff" },
    { key: "36cu", label: "36 CU", color: "#ff9800" },
    { key: "40cu", label: "40 CU (full)", color: "#f44336" },
];
// Tailles UMA proposées (plafonnées à 8G — au-delà il ne reste plus assez de RAM
// système sur les 16 Go partagés). Auto = le firmware décide (≈8 Go, valeur sûre).
const UMA_SIZE_LIST = [
    { key: "Auto", suffix: " (≈8G)", color: "#4caf50" },
    { key: "2G", suffix: "", color: "#67a3ff" },
    { key: "4G", suffix: "", color: "#ff9800" },
    { key: "8G", suffix: "", color: "#f44336" },
];
function CuTab() {
    const [status, setStatus] = SP_REACT.useState(null);
    const [applying, setApplying] = SP_REACT.useState(null);
    const [saveBoot, setSaveBoot] = SP_REACT.useState(false);
    const [lastMsg, setLastMsg] = SP_REACT.useState(null);
    const [installingUmr, setInstallingUmr] = SP_REACT.useState(false);
    const [profFocus, setProfFocus] = SP_REACT.useState(null);
    const [uma, setUma] = SP_REACT.useState(null);
    const [umaWriting, setUmaWriting] = SP_REACT.useState(null);
    const [umaMsg, setUmaMsg] = SP_REACT.useState(null);
    const [umaFocus, setUmaFocus] = SP_REACT.useState(null);
    const refresh = SP_REACT.useCallback(() => {
        call("get_cu_status").then(setStatus);
        call("get_uma_status").then(setUma).catch(() => { });
    }, []);
    SP_REACT.useEffect(() => {
        refresh();
        const timer = setInterval(refresh, 10000);
        return () => clearInterval(timer);
    }, [refresh]);
    const handleInstallUmr = async () => {
        setInstallingUmr(true);
        setLastMsg(null);
        notify({ title: "BC250 Toolkit", body: t("toast_umr_start")});
        try {
            const r = await call("install_umr");
            if (r.ok) {
                const msg = r.already ? t("toast_umr_already") : t("toast_umr_ok");
                setLastMsg(msg);
                notify({ title: "BC250 Toolkit", body: msg});
                refresh();
            }
            else {
                const msg = t("toast_umr_fail", { error: r.error ?? "" });
                setLastMsg(msg);
                notify({ title: "BC250 Toolkit", body: msg});
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
                notify({ title: "BC250 Toolkit", body: msg});
                refresh();
            }
            else {
                const msg = `✗ ${r.error}`;
                setLastMsg(msg);
                notify({ title: "BC250 Toolkit", body: msg});
            }
        }
        finally {
            setApplying(null);
        }
    };
    const applyUma = async (label) => {
        setUmaWriting(label);
        setUmaMsg(null);
        try {
            const r = await call("set_uma_frame_buffer", label);
            if (r.ok) {
                const msg = t("uma_done", { label });
                setUmaMsg(msg);
                notify({ title: "BC250 Toolkit", body: msg});
                call("get_uma_status").then(setUma).catch(() => { });
            }
            else {
                const msg = `✗ ${r.error}`;
                setUmaMsg(msg);
                notify({ title: "BC250 Toolkit", body: msg});
            }
        }
        finally {
            setUmaWriting(null);
        }
    };
    if (!status)
        return SP_JSX.jsx(DFL.SteamSpinner, {});
    // Réglage UMA effectif côté BIOS : mode Auto OU taille Auto = le firmware décide.
    const umaFb = uma?.current?.uma_frame_buffer?.label ?? null;
    const umaTarget = uma?.current?.uma_mode?.label === "Auto" || umaFb === "Auto" ? "Auto" : umaFb;
    const umaSupported = !!uma && uma.profile_ready && uma.layout_ok;
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: t("cu_title"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("cu_live"), children: SP_JSX.jsx("span", { style: { fontWeight: "bold", color: "#67a3ff", fontSize: "14px" }, children: status.cu_count != null && status.cu_count > 0
                                    ? `${status.cu_count} / 40 CU`
                                    : status.umr_available
                                        ? t("cu_reading")
                                        : t("cu_na") }) }) }), status.boot_cu != null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("cu_boot"), children: SP_JSX.jsxs("span", { style: { fontSize: "12px", color: "#aaa" }, children: [status.boot_cu, " CU", status.boot_profile ? ` (${status.boot_profile})` : ""] }) }) })), !status.umr_available && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                            fontSize: "12px", color: "#ff9800", lineHeight: "1.4",
                                            borderLeft: "3px solid #ff9800", paddingLeft: "8px",
                                        }, children: t("cu_no_umr") }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(ActionCard, { disabled: installingUmr, onClick: handleInstallUmr, children: ["\u2B07\uFE0F ", installingUmr ? t("cu_installing_umr") : t("cu_install_umr")] }) })] }))] }), SP_JSX.jsx(DFL.PanelSection, { title: t("cu_warn_title"), children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                            fontSize: "13px", color: "#ff9800", lineHeight: "1.5",
                            borderLeft: "3px solid #ff9800", paddingLeft: "10px",
                            paddingTop: "6px", paddingBottom: "6px",
                            background: "rgba(255,152,0,0.08)", borderRadius: "0 4px 4px 0",
                        }, children: t("cu_disclaimer") }) }) }), SP_JSX.jsx(DFL.PanelSection, { title: t("cu_profiles"), children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: 4 }, children: CU_PROFILE_LIST.map(({ key, label, color }) => {
                            const isActive = status.current_profile === key;
                            const isBoot = status.boot_profile === key;
                            const isApplying = applying === key;
                            const suffix = isBoot && !isActive ? " [boot]" : isActive && isBoot ? " [live+boot]" : "";
                            return (SP_JSX.jsxs(CardBtn, { active: isActive, focused: profFocus === key, color: color, disabled: !!applying || !status.umr_available, onClick: () => applyProfile(key), onFocus: () => setProfFocus(key), onBlur: () => setProfFocus((f) => (f === key ? null : f)), children: [SP_JSX.jsx("span", { style: { flex: 1, textAlign: "left" }, children: isApplying ? t("cu_applying") : `${label}${suffix}` }), isActive && SP_JSX.jsx("span", { style: { fontSize: 10 }, children: "\u25CF" })] }, key));
                        }) }) }) }), SP_JSX.jsxs(DFL.PanelSection, { title: t("cu_options"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: t("cu_save_boot"), description: t("cu_save_boot_desc"), checked: saveBoot, onChange: setSaveBoot }) }), lastMsg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                    fontSize: "11px",
                                    color: lastMsg.startsWith("✓") ? "#4caf50" : "#f44336",
                                    lineHeight: "1.4",
                                }, children: lastMsg }) }) }))] }), uma && (SP_JSX.jsxs(DFL.PanelSection, { title: t("uma_title"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("uma_live"), children: SP_JSX.jsx("span", { style: { fontWeight: "bold", color: "#67a3ff", fontSize: "14px" }, children: uma.vram_total_mb != null ? `${uma.vram_total_mb} MB` : t("cu_na") }) }) }), umaTarget && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("uma_bios"), children: SP_JSX.jsx("span", { style: { fontSize: "12px", color: "#aaa" }, children: umaTarget }) }) })), !umaSupported && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                    fontSize: "12px", color: "#ff9800", lineHeight: "1.4",
                                    borderLeft: "3px solid #ff9800", paddingLeft: "8px",
                                }, children: t("uma_not_supported", { detail: uma.layout_detail || uma.bios_version || "?" }) }) }) }))] })), uma && umaSupported && (SP_JSX.jsxs(DFL.PanelSection, { title: t("uma_sizes"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                                fontSize: "13px", color: "#ff9800", lineHeight: "1.5",
                                borderLeft: "3px solid #ff9800", paddingLeft: "10px",
                                paddingTop: "6px", paddingBottom: "6px",
                                background: "rgba(255,152,0,0.08)", borderRadius: "0 4px 4px 0",
                            }, children: t("uma_disclaimer") }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: 4 }, children: UMA_SIZE_LIST.map(({ key, suffix, color }) => {
                                const isActive = umaTarget === key;
                                const isWriting = umaWriting === key;
                                return (SP_JSX.jsxs(CardBtn, { active: isActive, focused: umaFocus === key, color: color, disabled: !!umaWriting, onClick: () => applyUma(key), onFocus: () => setUmaFocus(key), onBlur: () => setUmaFocus((f) => (f === key ? null : f)), children: [SP_JSX.jsx("span", { style: { flex: 1, textAlign: "left" }, children: isWriting ? t("uma_writing") : `${key}${suffix}` }), isActive && SP_JSX.jsx("span", { style: { fontSize: 10 }, children: "\u25CF" })] }, key));
                            }) }) }), umaMsg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
                                    fontSize: "11px",
                                    color: umaMsg.startsWith("✓") ? "#4caf50" : "#f44336",
                                    lineHeight: "1.4",
                                }, children: umaMsg }) }) }))] })), SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { children: SP_JSX.jsx("div", { style: {
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
            notify({
                title: "BC250 Toolkit",
                body: r.success ? t("sys_toast_ok") : t("sys_toast_fail")});
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
                                    : `✗ ${status.scx_state ?? t("sys_unknown")}` }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_tuned"), children: SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#ccc" }, children: status.tuned_profile ?? t("sys_unknown") }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_gamemode"), children: SP_JSX.jsx("span", { style: { color: status.gamemode_active ? "#4caf50" : "#f44336" }, children: status.gamemode_active ? t("sys_active") : t("sys_inactive") }) }) })] }), status.tweaks_installed && (SP_JSX.jsxs(DFL.PanelSection, { title: "bc250-tweaks", children: [status.tweaks_last_update && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_last_update"), children: SP_JSX.jsx("span", { style: { fontSize: "10px", color: "#aaa" }, children: status.tweaks_last_update }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(ActionCard, { disabled: updating, onClick: handleUpdate, children: ["\uD83D\uDD04 ", updating ? t("sys_btn_updating") : t("sys_btn_update")] }) }), updateLog && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("sys_log"), children: SP_JSX.jsx("div", { style: {
                                    fontSize: "10px", fontFamily: "monospace", color: "#aaa",
                                    maxHeight: "100px", overflow: "auto", whiteSpace: "pre-wrap",
                                }, children: updateLog.slice(-1500) }) }) }))] }))] }));
}
// ── Onglet Réglages ───────────────────────────────────────────────────────────
function SettingsTab({ autoApply, setAutoApply, gamesDb, onRefreshDb, }) {
    const [refreshing, setRefreshing] = SP_REACT.useState(false);
    const [version, setVersion] = SP_REACT.useState("");
    const meta = gamesDb["_meta"];
    SP_REACT.useEffect(() => {
        call("get_version").then((v) => setVersion(v || "")).catch(() => { });
    }, []);
    const doRefresh = async () => {
        setRefreshing(true);
        try {
            await onRefreshDb();
        }
        finally {
            setRefreshing(false);
        }
    };
    // ── Mises à jour (release-based) ──
    const [autoUpd, setAutoUpd] = SP_REACT.useState(true);
    const [updStatus, setUpdStatus] = SP_REACT.useState("idle");
    const [updLatest, setUpdLatest] = SP_REACT.useState("");
    const [updCurrent, setUpdCurrent] = SP_REACT.useState("");
    const [updUrl, setUpdUrl] = SP_REACT.useState("");
    SP_REACT.useEffect(() => {
        call("get_autoupdate").then((v) => setAutoUpd(!!v)).catch(() => { });
    }, []);
    const onToggleAutoUpd = (v) => {
        setAutoUpd(v);
        call("set_autoupdate", v).catch(() => { });
    };
    const checkUpd = async () => {
        setUpdStatus("checking");
        try {
            const info = await call("check_update");
            setUpdCurrent(info?.current || "");
            if (info?.update_available) {
                setUpdLatest(info.latest);
                setUpdUrl(info.url);
                setUpdStatus("available");
            }
            else {
                setUpdStatus("uptodate");
            }
        }
        catch {
            setUpdStatus("idle");
        }
    };
    const installUpd = async () => {
        setUpdStatus("installing");
        // Backend unpacks the release and restarts plugin_loader on success.
        try {
            await call("apply_update", updUrl);
        }
        catch { }
    };
    const updLabel = updStatus === "checking" ? t("update_checking")
        : updStatus === "installing" ? t("update_installing")
            : updStatus === "available" ? t("update_install", { v: updLatest })
                : updStatus === "uptodate" ? t("update_up_to_date", { v: updCurrent })
                    : t("update_check");
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: t("set_auto"), description: t("set_auto_desc"), checked: autoApply, onChange: setAutoApply }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(ActionCard, { disabled: refreshing, onClick: doRefresh, children: ["\uD83D\uDD04 ", refreshing ? t("set_refreshing") : t("set_refresh_db")] }) }), meta?.updated && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("set_db_date"), children: SP_JSX.jsx("span", { style: { fontSize: "11px", color: "#888" }, children: meta.updated }) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { label: t("set_contribute"), children: SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#67a3ff" }, children: "github.com/Necrosiak/bc250-toolkit-decky" }) }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: t("update_section"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: t("update_auto"), checked: autoUpd, onChange: onToggleAutoUpd }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(ActionCard, { color: updStatus === "available" ? "#23a55a" : undefined, active: updStatus === "available", disabled: updStatus === "checking" || updStatus === "installing", onClick: updStatus === "available" ? installUpd : checkUpd, children: [updStatus === "available" ? "⬇️ " : "🔄 ", updLabel] }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: t("about"), children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: 11, color: "#aaa", lineHeight: 1.6 }, children: [SP_JSX.jsxs("div", { children: [SP_JSX.jsx("b", { style: { color: "#fff" }, children: "BC250 Toolkit" }), version ? ` v${version}` : ""] }), SP_JSX.jsxs("div", { children: [t("about_by"), " ", SP_JSX.jsx("span", { style: { color: "#67a3ff" }, children: "Necrosiak" })] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ActionCard, { onClick: () => openUrl("https://github.com/Necrosiak/bc250-toolkit-decky"), children: "\uD83D\uDD17 GitHub" }) })] })] }));
}
const TAB_DEFS = [
    { id: "games", tKey: "tab_games", icon: "🎮" },
    { id: "cu", tKey: "tab_cu", icon: "⚡" },
    { id: "system", tKey: "tab_system", icon: "🌡️" },
    { id: "settings", tKey: "tab_settings", icon: "⚙️" },
];
const BtnTab = DFL.DialogButton;
const Btn = DFL.DialogButton;
// Carte cliquable réutilisable façon Steamcord (liste de profils/actions) : fond
// couleur si actif, halo blanc + lueur au focus manette. Hoistée (function).
function CardBtn({ active, focused, color, disabled, center, onClick, onFocus, onBlur, children }) {
    const c = color || "#5865f2";
    return (SP_JSX.jsx(Btn, { disabled: disabled, onClick: onClick, onFocus: onFocus, onBlur: onBlur, style: {
            display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start",
            gap: 8, width: "100%",
            padding: "7px 10px", margin: 0, minHeight: 0, boxSizing: "border-box",
            borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: active ? 700 : 400,
            background: active ? c : "rgba(255,255,255,0.05)",
            border: active ? "1px solid " + c : "1px solid transparent",
            boxShadow: focused ? "0 0 0 2px #fff, 0 0 8px 1px " + c : "none",
            transform: focused ? "scale(1.02)" : "scale(1)",
            transition: "box-shadow .08s ease, transform .08s ease",
            opacity: disabled ? 0.5 : 1, zIndex: focused ? 1 : 0,
        }, children: children }));
}
// CardBtn d'action isolé (Système / Réglages) : gère son propre focus, centré.
// Pas besoin de remonter l'état au parent comme pour les listes Jeux/CU.
function ActionCard({ color, active, disabled, onClick, children }) {
    const [focused, setFocused] = SP_REACT.useState(false);
    return (SP_JSX.jsx(CardBtn, { color: color, active: active, disabled: disabled, focused: focused, center: true, onClick: onClick, onFocus: () => setFocused(true), onBlur: () => setFocused(false), children: children }));
}
// Ligne de jeu façon « serveur Steamcord » : icône Steam du jeu (sinon pastille
// colorée + initiale), nom, surbrillance bleue si sélectionné.
function GameRow({ name, appid, selected, focused, onClick, onFocus, onBlur }) {
    const ov = window.appStore?.GetAppOverviewByAppID?.(Number(appid));
    const iconHash = ov?.icon_hash || ov?.icon_data;
    const iconUrl = iconHash
        ? `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`
        : null;
    return (SP_JSX.jsxs(Btn, { onClick: onClick, onFocus: onFocus, onBlur: onBlur, style: {
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "6px 8px", margin: 0, minHeight: 0, boxSizing: "border-box", borderRadius: 6,
            background: focused ? "rgba(88,101,242,0.55)" : selected ? "rgba(88,101,242,0.25)" : "rgba(255,255,255,0.04)",
            border: selected ? "1px solid rgba(88,101,242,0.6)" : "1px solid transparent",
            boxShadow: focused ? "0 0 0 2px #fff" : "none",
        }, children: [iconUrl ? (SP_JSX.jsx("img", { src: iconUrl, width: 24, height: 24, style: { borderRadius: 6, flexShrink: 0, display: "block" } })) : (SP_JSX.jsx("div", { style: { width: 24, height: 24, borderRadius: 6, background: "#5865f2", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }, children: (name || "?")[0].toUpperCase() })), SP_JSX.jsx("span", { style: { flex: 1, textAlign: "left", fontSize: 12, fontWeight: selected ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: name }), selected && SP_JSX.jsx("span", { style: { fontSize: 10, color: "#67a3ff", flexShrink: 0 }, children: "\u25B6" })] }));
}
// Onglet façon Steamcord : fond bleu plein au focus manette, bleu estompé si
// actif, anneau blanc au focus. Rangée Focusable horizontale = nav D-pad correcte.
function TabBtn({ active, focused, onClick, onFocus, onBlur, children }) {
    return (SP_JSX.jsx(BtnTab, { onClick: onClick, onFocus: onFocus, onBlur: onBlur, style: {
            flex: "1 1 0", minWidth: 0, margin: 0, padding: "5px 2px",
            fontSize: 11, minHeight: 0, boxSizing: "border-box", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            background: focused
                ? "rgba(88,101,242,0.85)"
                : active ? "rgba(88,101,242,0.35)" : "rgba(255,255,255,0.06)",
            boxShadow: focused ? "0 0 0 2px #fff" : "none",
            fontWeight: active ? 700 : 400,
            transition: "background .08s ease, box-shadow .08s ease",
        }, children: children }));
}
function TabBar({ tab, setTab }) {
    const [focused, setFocused] = SP_REACT.useState(null);
    return (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Focusable, { "flow-children": "horizontal", style: { display: "flex", gap: 4, width: "100%", boxSizing: "border-box" }, children: TAB_DEFS.map(({ id, tKey, icon }) => (SP_JSX.jsxs(TabBtn, { active: tab === id, focused: focused === id, onClick: () => setTab(id), onFocus: () => setFocused(id), onBlur: () => setFocused((f) => (f === id ? null : f)), children: [SP_JSX.jsx("span", { children: icon }), SP_JSX.jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis" }, children: t(tKey) })] }, id))) }) }) }));
}
// ── Plugin principal ──────────────────────────────────────────────────────────
function Content() {
    const [tab, setTab] = SP_REACT.useState("games");
    const [autoApply, setAutoApplyState] = SP_REACT.useState(false);
    const [savedVariants, setSavedVariants] = SP_REACT.useState({});
    const [gamesDb, setGamesDb] = SP_REACT.useState({});
    const [dbLoaded, setDbLoaded] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        call("get_games_db").then((db) => {
            setGamesDb(db);
            setDbLoaded(true);
        });
        call("get_auto_apply").then((v) => setAutoApplyState(!!v)).catch(() => { });
        call("get_game_variants").then((v) => setSavedVariants(v ?? {})).catch(() => { });
    }, []);
    // Toggle persistant + (dés)activation immédiate du pré-câblage des jeux installés.
    const setAutoApply = (v) => {
        setAutoApplyState(v);
        call("set_auto_apply", v).catch(() => { });
        if (v) {
            const games = getInstalledDbGames(gamesDb);
            Promise.all(games.map((g) => {
                const cfgs = g.game.configs;
                const idx = cfgs && cfgs.length > 0
                    ? (savedVariants[String(g.appid)] ?? 0)
                    : null;
                return applyGameConfig(g.appid, idx);
            })).then((rs) => {
                const n = rs.filter((r) => r.ok).length;
                notify({ title: "BC250 Toolkit", body: t("toast_autoapply_on", { count: n })});
            }).catch(() => { });
        }
    };
    const refreshDb = async () => {
        const db = await call("refresh_games_db");
        setGamesDb(db);
        notify({ title: "BC250 Toolkit", body: t("toast_db_ok")});
    };
    if (!dbLoaded)
        return SP_JSX.jsx(DFL.SteamSpinner, {});
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(TabBar, { tab: tab, setTab: setTab }), tab === "games" && SP_JSX.jsx(GamesTab, { gamesDb: gamesDb, savedVariants: savedVariants }), tab === "cu" && SP_JSX.jsx(CuTab, {}), tab === "system" && SP_JSX.jsx(SystemTab, {}), tab === "settings" && (SP_JSX.jsx(SettingsTab, { autoApply: autoApply, setAutoApply: setAutoApply, gamesDb: gamesDb, onRefreshDb: refreshDb }))] }));
}
var index = definePlugin(() => {
    // Auto-apply persistant : enregistré au chargement du plugin (= démarrage Steam),
    // actif toute la session même panneau fermé. À chaque jeu lancé connu de la DB,
    // si l'auto-apply est activé, on (ré)applique sa config (variante sauvegardée).
    // Les fichiers étant persistants (config.vdf / ~/.drirc / launch options), l'effet
    // est garanti au lancement suivant.
    let unreg;
    try {
        const reg = window.SteamClient?.GameSessions?.RegisterForAppLifetimeNotifications;
        if (typeof reg === "function") {
            unreg = reg(async (e) => {
                if (!e?.bRunning)
                    return;
                try {
                    const enabled = await call("get_auto_apply");
                    if (!enabled)
                        return;
                    const db = await call("get_games_db");
                    const entry = db[String(e.unAppID)];
                    if (!entry || !("proton" in entry))
                        return;
                    const g = entry;
                    const variants = await call("get_game_variants").catch(() => ({}));
                    const hasConfigs = Array.isArray(g.configs) && g.configs.length > 0;
                    const idx = hasConfigs ? (variants[String(e.unAppID)] ?? 0) : null;
                    const r = await applyGameConfig(e.unAppID, idx);
                    notify({
                        title: "BC250 Toolkit",
                        body: r.ok ? t("toast_applied", { name: g.name }) : t("toast_error", { detail: r.error ?? "?" })});
                }
                catch (_) { }
            });
        }
    }
    catch (_) { }
    return {
        name: "BC250 Toolkit",
        title: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "BC250 Toolkit" }),
        icon: SP_JSX.jsx(FaMicrochip, {}),
        content: SP_JSX.jsx(Content, {}),
        onDismount() { try {
            unreg?.();
        }
        catch (_) { } },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
