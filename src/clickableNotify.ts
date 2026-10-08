// Shared Steam notification click router for the Necrosiak Decky plugins.
// Steam ignores DisplayClientNotification's callback: type 2 opens a Steam
// friend chat instead. We intercept only our reserved fake account IDs and
// leave real Steam chats (and Steamcord's separate 0xde range) untouched.
import { findModuleExport } from "@decky/ui";

type Action = { source: string; run: () => void };
type Router = {
  show: (source: string, key: string, title: string, body: string, run: () => void) => boolean;
  clear: (source: string) => void;
};

const GLOBAL_KEY = "__necroClickableNotificationsV1";
const ACCOUNT_BASE = 0xdf000000;
const ACCOUNT_MASK = 0x00ffffff;
const STEAMID_BASE = BigInt("76561197960265728");
const DEFAULT_AVATAR = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";

function makeRouter(): Router {
  const actions = new Map<number, Action>();
  const ids = new Map<string, number>();
  const owners = new Map<number, string>();
  const quiet = new Map<string, { count: number; expires: number }>();
  let store: any;
  let wrapper: any;
  let soundWrapper: any;

  const ensureQuietSound = () => {
    try {
      const notifications = (window as any).NotificationStore;
      const current = notifications?.PlayNotificationSound;
      if (typeof current !== "function" || current === soundWrapper) return;
      soundWrapper = function (this: any, notification: any) {
        let sid = "";
        try {
          const raw = notification?.data?.steamid;
          sid = String(typeof raw === "function" ? raw() : raw ?? "");
        } catch {}
        const pending = quiet.get(sid);
        if (pending) {
          if (pending.expires > Date.now()) {
            if (--pending.count <= 0) quiet.delete(sid);
            return; // These are plugin status notices, not incoming messages.
          }
          quiet.delete(sid);
        }
        return current.call(this, notification);
      };
      notifications.PlayNotificationSound = soundWrapper;
    } catch {}
  };

  const ensureHook = (): boolean => {
    try {
      store ||= findModuleExport((e: any) => e && typeof e.ShowFriendChatDialog === "function"
        && typeof e.ShowChatRoomGroupDialog === "function");
      if (!store || typeof store.ShowFriendChatDialog !== "function") return false;
      if (store.ShowFriendChatDialog === wrapper) return true;
      // Another plugin may wrap or restore this method after us. Chain its
      // current implementation, and reattach if it changes during a reload.
      const previous = store.ShowFriendChatDialog;
      wrapper = function (this: any, ctx: any, steamID: any, ...rest: any[]) {
        let accountId = NaN;
        try { accountId = Number(steamID?.GetAccountID?.()); } catch {}
        if (accountId >= ACCOUNT_BASE && accountId <= ACCOUNT_BASE + ACCOUNT_MASK) {
          const action = actions.get(accountId);
          if (action) {
            try { action.run(); } catch (e) { console.error("[Decky] notification action failed", e); }
          }
          return; // Never open a fake Steam chat, including stale tray entries.
        }
        return previous.call(this, ctx, steamID, ...rest);
      };
      store.ShowFriendChatDialog = wrapper;
      return true;
    } catch (e) {
      console.error("[Decky] notification click hook unavailable", e);
      return false;
    }
  };

  // Steamcord can restore a previous method when it reloads. Reattach without
  // clobbering whichever wrapper is currently installed.
  setInterval(() => {
    if (actions.size) { ensureHook(); ensureQuietSound(); }
    for (const [sid, entry] of quiet) if (entry.expires <= Date.now()) quiet.delete(sid);
  }, 2000);

  const accountFor = (key: string): number => {
    const existing = ids.get(key);
    if (existing !== undefined) return existing;
    let hash = 5381;
    for (let i = 0; i < key.length; i++) hash = (Math.imul(hash, 33) ^ key.charCodeAt(i)) >>> 0;
    let id = ACCOUNT_BASE + (hash & ACCOUNT_MASK);
    while (owners.has(id) && owners.get(id) !== key)
      id = ACCOUNT_BASE + ((id - ACCOUNT_BASE + 1) & ACCOUNT_MASK);
    ids.set(key, id);
    owners.set(id, key);
    return id;
  };

  const primePersona = (id: number, sid: string, name: string) => {
    try {
      const p = (window as any).friendStore?.GetFriendState?.({
        GetAccountID: () => id, ConvertTo64BitString: () => sid, BIsValid: () => true,
      })?.m_persona;
      if (!p) return;
      p.m_strPlayerName = name;
      for (const k of ["avatar_url_small", "avatar_url_medium", "avatar_url_full"]) {
        try { Object.defineProperty(p, k, { get: () => DEFAULT_AVATAR, configurable: true }); } catch {}
      }
      for (const ms of [300, 800, 1500]) setTimeout(() => {
        try { if (p.m_strPlayerName !== name) p.m_strPlayerName = name; } catch {}
      }, ms);
    } catch {}
  };

  return {
    show(source, key, title, body, run) {
      if (!ensureHook()) return false;
      const id = accountFor(`${source}:${key}`);
      const sid = (STEAMID_BASE + BigInt(id)).toString();
      actions.set(id, { source, run });
      primePersona(id, sid, title);
      ensureQuietSound();
      const pending = quiet.get(sid);
      quiet.set(sid, { count: (pending && pending.expires > Date.now() ? pending.count : 0) + 1,
        expires: Date.now() + 8000 });
      try {
        const display = (window as any).SteamClient?.ClientNotifications?.DisplayClientNotification;
        if (typeof display !== "function") throw new Error("Steam notifications unavailable");
        display(2, JSON.stringify({ title, body, steamid: sid }), () => {});
        return true;
      } catch (e) {
        actions.delete(id);
        quiet.delete(sid);
        console.error("[Decky] clickable notification failed", e);
        return false;
      }
    },
    clear(source) {
      for (const [id, action] of actions) if (action.source === source) actions.delete(id);
    },
  };
}

function router(): Router {
  const w = window as any;
  return (w[GLOBAL_KEY] ||= makeRouter());
}

export function notifyClickable(source: string, key: string, title: string, body: string, run: () => void): boolean {
  return router().show(source, key, title, body, run);
}

export function clearClickableNotifications(source: string): void {
  (window as any)[GLOBAL_KEY]?.clear(source);
}
