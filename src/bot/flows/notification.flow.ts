import type { Context } from "telegraf";
import { createNotification, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../database/jsonDb.js";
import { findUserByTelegramId } from "../../database/jsonDb.js";
import { formatNotification } from "../formatters.js";
import { getUserId } from "../context.js";
import { backMenu } from "../keyboards.js";
import { Markup } from "telegraf";

export async function sendNotifications(ctx: Context): Promise<void> {
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) {
    await ctx.reply("Avval ro'yxatdan o'ting.");
    return;
  }

  const notifications = await getNotifications(user.id);

  if (!notifications.length) {
    await ctx.reply("Hozircha bildirishnomalar yo'q.");
    return;
  }

  await ctx.reply(`Bildirishnomalar (${notifications.length} ta):`);

  for (const notification of notifications.slice(0, 10)) {
    const keyboard = notification.read 
      ? undefined 
      : Markup.inlineKeyboard([
          [Markup.button.callback("✅ O'qildi", `mark_notif_read:${notification.id}`)]
        ]);

    await ctx.reply(formatNotification(notification), keyboard);
  }

  await ctx.reply("Barchasini o'qilgan deb belgilash uchun:", 
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Barchasini o'qildi", "mark_all_notif_read")]
    ])
  );
}

export async function markNotificationRead(ctx: Context, notificationId: string): Promise<void> {
  await markNotificationAsRead(notificationId);
  await ctx.reply("Bildirishnoma o'qilgan deb belgilandi.");
}

export async function markAllNotificationsRead(ctx: Context): Promise<void> {
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) return;

  await markAllNotificationsAsRead(user.id);
  await ctx.reply("Barcha bildirishnomalar o'qilgan deb belgilandi.");
}

export async function notifyUser(userId: string, type: string, title: string, body: string, data: Record<string, unknown> | null = null): Promise<void> {
  await createNotification({
    userId,
    type: type as any,
    title,
    body,
    data
  });
}
