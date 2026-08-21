import { Markup } from "telegraf";
import type { Context } from "telegraf";
import { env } from "../config/env.js";
import { getUserId } from "./context.js";

const allowedStatuses = new Set(["creator", "administrator", "member"]);

export async function ensureChannelMember(ctx: Context): Promise<boolean> {
  if (!env.channelId || env.adminIds.includes(getUserId(ctx))) {
    return true;
  }

  try {
    const member = await ctx.telegram.getChatMember(env.channelId, Number(getUserId(ctx)));

    if (allowedStatuses.has(member.status)) {
      return true;
    }
  } catch (error) {
    console.error("Kanal a'zoligi tekshirilmadi", error);
  }

  await ctx.reply(
    "Botdan foydalanish uchun avval kanalga a'zo bo'ling. A'zo bo'lgach /start ni qayta bosing.",
    Markup.inlineKeyboard([Markup.button.url("Kanalga a'zo bo'lish", buildChannelLink())])
  );
  return false;
}

function buildChannelLink(): string {
  if (!env.channelId) {
    return "https://t.me";
  }

  if (env.channelId.startsWith("@")) {
    return `https://t.me/${env.channelId.slice(1)}`;
  }

  return "https://t.me";
}
