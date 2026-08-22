import type { Context } from "telegraf";
import { updateUserLanguage } from "../../database/jsonDb.js";
import { findUserByTelegramId } from "../../database/jsonDb.js";
import { clearSession, getSession, setSession } from "../sessionStore.js";
import { getUserId, getText } from "../context.js";
import { backMenu, languageKeyboard } from "../keyboards.js";

export async function startLanguageFlow(ctx: Context): Promise<void> {
  const session = { flow: "language" as const };
  setSession(ctx, session);
  await ctx.reply("Tilni tanlang:", languageKeyboard);
}

export async function handleLanguageFlow(ctx: Context): Promise<void> {
  const session = getSession(ctx);
  if (session?.flow !== "language") return;

  const text = getText(ctx);
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) {
    await ctx.reply("Xatolik yuz berdi.", backMenu);
    clearSession(ctx);
    return;
  }

  let language: "uz" | "ru" | "en";
  if (text === "O'zbek") {
    language = "uz";
  } else if (text === "Rus") {
    language = "ru";
  } else if (text === "Ingliz") {
    language = "en";
  } else if (text === "Qaytish") {
    clearSession(ctx);
    return;
  } else {
    await ctx.reply("Iltimos, tilni tanlang:", languageKeyboard);
    return;
  }

  await updateUserLanguage(user.id, language);
  await ctx.reply(`Til o'zgartirildi: ${text}`, backMenu);
  clearSession(ctx);
}
