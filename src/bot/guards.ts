import type { Context } from "telegraf";
import { findUserByTelegramId, isUserBanned } from "../database/jsonDb.js";
import type { User, UserRole } from "../types.js";
import { getUserId } from "./context.js";
import { menuFor, startMenu } from "./keyboards.js";
import { env } from "../config/env.js";

export async function ensureNotBanned(ctx: Context): Promise<boolean> {
  if (await isUserBanned(getUserId(ctx))) {
    await ctx.reply("Siz botdan ban qilingansiz. Admin bilan bog'laning.");
    return false;
  }

  return true;
}

export async function requireRegisteredUser(ctx: Context, role?: UserRole): Promise<User | null> {
  if (!(await ensureNotBanned(ctx))) {
    return null;
  }

  const user = await findUserByTelegramId(getUserId(ctx), role);

  if (!user) {
    await ctx.reply("Avval /start bosib ro'yxatdan o'ting.", startMenu);
    return null;
  }

  if (role && user.role !== role) {
    await ctx.reply(
      role === "worker" ? "Bu amal faqat ishchilar uchun." : "Bu amal faqat ish beruvchilar uchun.",
      menuFor(user.role)
    );
    return null;
  }

  return user;
}

export function isAdmin(ctx: Context): boolean {
  return env.adminIds.includes(getUserId(ctx));
}
