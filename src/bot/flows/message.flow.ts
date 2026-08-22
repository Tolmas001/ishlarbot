import type { Context, Telegram } from "telegraf";
import { createMessage, getMessages, markMessagesAsRead, getUnreadMessageCount } from "../../database/jsonDb.js";
import { findUserByTelegramId, findUserById } from "../../database/jsonDb.js";
import { clearSession, getSession, setSession } from "../sessionStore.js";
import { getUserId, getText } from "../context.js";
import { backMenu } from "../keyboards.js";

export async function startMessageFlow(ctx: Context, toUserId: string, applicationId: string | null): Promise<void> {
  const session = { flow: "message" as const, toUserId, applicationId };
  setSession(ctx, session);
  await ctx.reply("Xabaringizni yozing:", backMenu);
}

export async function handleMessageFlow(ctx: Context, telegram: Telegram): Promise<void> {
  const session = getSession(ctx);
  if (session?.flow !== "message") return;

  const text = getText(ctx);
  const fromUser = await findUserByTelegramId(getUserId(ctx));
  if (!fromUser) {
    await ctx.reply("Xatolik yuz berdi.", backMenu);
    clearSession(ctx);
    return;
  }

  const toUser = await findUserById(session.toUserId);
  if (!toUser) {
    await ctx.reply("Foydalanuvchi topilmadi.", backMenu);
    clearSession(ctx);
    return;
  }

  await createMessage({
    fromUserId: fromUser.id,
    toUserId: session.toUserId,
    applicationId: session.applicationId,
    text
  });

  await ctx.reply("Xabar yuborildi!", backMenu);
  clearSession(ctx);
}

export async function sendConversation(ctx: Context, otherUserId: string): Promise<void> {
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) {
    await ctx.reply("Avval ro'yxatdan o'ting.");
    return;
  }

  const messages = await getMessages(user.id, otherUserId);
  await markMessagesAsRead(user.id);

  if (!messages.length) {
    await ctx.reply("Hozircha xabarlar yo'q.");
    return;
  }

  await ctx.reply(`Suhbat (${messages.length} ta xabar):`);

  for (const message of messages) {
    const sender = await findUserById(message.fromUserId);
    const isFromMe = message.fromUserId === user.id;
    const prefix = isFromMe ? "Siz:" : `${sender?.name || "Noma'lum"}:`;
    await ctx.reply(`${prefix} ${message.text}`);
  }
}

export async function sendUnreadCount(ctx: Context): Promise<void> {
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) return;

  const count = await getUnreadMessageCount(user.id);
  if (count > 0) {
    await ctx.reply(`📬 ${count} ta o'qilmagan xabar bor.`);
  }
}
