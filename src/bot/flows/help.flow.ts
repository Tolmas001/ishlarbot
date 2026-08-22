import type { Context } from "telegraf";
import { createHelpRequest, getPendingHelpRequests, resolveHelpRequest } from "../../database/jsonDb.js";
import { findUserByTelegramId } from "../../database/jsonDb.js";
import { formatHelpRequest } from "../formatters.js";
import { clearSession, getSession, setSession } from "../sessionStore.js";
import { getUserId, getText } from "../context.js";
import { backMenu } from "../keyboards.js";
import { isAdmin } from "../guards.js";

export async function startHelpFlow(ctx: Context): Promise<void> {
  const session = { flow: "help" as const };
  setSession(ctx, session);
  await ctx.reply("Savolingizni yozing:", backMenu);
}

export async function handleHelpFlow(ctx: Context): Promise<void> {
  const session = getSession(ctx);
  if (session?.flow !== "help") return;

  const text = getText(ctx);
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) {
    await ctx.reply("Xatolik yuz berdi.", backMenu);
    clearSession(ctx);
    return;
  }

  await createHelpRequest({
    userId: user.id,
    message: text
  });

  await ctx.reply("Savolingiz yuborildi. Admin tez orada javob beradi.", backMenu);
  clearSession(ctx);
}

export async function sendPendingHelpRequests(ctx: Context): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply("Faqat adminlar uchun.");
    return;
  }

  const requests = await getPendingHelpRequests();

  if (!requests.length) {
    await ctx.reply("Hozircha yordam so'rovlari yo'q.");
    return;
  }

  await ctx.reply(`Yordam so'rovlari (${requests.length} ta):`);

  for (const request of requests) {
    const user = await findUserByTelegramId(request.userId);
    if (user) {
      await ctx.reply(formatHelpRequest(request, user));
    }
  }
}

export async function resolveHelpRequestFlow(ctx: Context, helpRequestId: string): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply("Faqat adminlar uchun.");
    return;
  }

  const session = { flow: "help_response" as const, helpRequestId };
  setSession(ctx, session);
  await ctx.reply("Javobingizni yozing:", backMenu);
}

export async function handleHelpResponseFlow(ctx: Context): Promise<void> {
  const session = getSession(ctx);
  if (!session || session.flow !== "help_response") return;

  const text = getText(ctx);
  await resolveHelpRequest(session.helpRequestId, text);

  await ctx.reply("Javob yuborildi.", backMenu);
  clearSession(ctx);
}
