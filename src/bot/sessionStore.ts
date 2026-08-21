import type { Context } from "telegraf";
import { getUserId } from "./context.js";
import type { Session } from "../types.js";

const sessions = new Map<string, Session>();

export function getSession(ctx: Context): Session | undefined {
  return sessions.get(getUserId(ctx));
}

export function setSession(ctx: Context, session: Session): void {
  sessions.set(getUserId(ctx), session);
}

export function clearSession(ctx: Context): void {
  sessions.delete(getUserId(ctx));
}
