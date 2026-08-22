import type { Context } from "telegraf";
import { getUserId } from "./context.js";
import type { Session } from "../types.js";

interface SessionEntry {
  session: Session;
  createdAt: number;
}

const sessions = new Map<string, SessionEntry>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function getSession(ctx: Context): Session | undefined {
  const entry = sessions.get(getUserId(ctx));
  if (!entry) return undefined;

  // Check if session has expired
  if (Date.now() - entry.createdAt > SESSION_TIMEOUT) {
    sessions.delete(getUserId(ctx));
    return undefined;
  }

  return entry.session;
}

export function setSession(ctx: Context, session: Session): void {
  sessions.set(getUserId(ctx), {
    session,
    createdAt: Date.now()
  });
}

export function clearSession(ctx: Context): void {
  sessions.delete(getUserId(ctx));
}

export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [key, entry] of sessions.entries()) {
    if (now - entry.createdAt > SESSION_TIMEOUT) {
      sessions.delete(key);
    }
  }
}

// Cleanup expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
