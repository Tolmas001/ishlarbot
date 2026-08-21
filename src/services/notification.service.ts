import type { Telegram } from "telegraf";
import { Markup } from "telegraf";
import { env } from "../config/env.js";
import { formatChannelPost, formatEmployerApplication } from "../bot/formatters.js";
import type { Job, User } from "../types.js";

export async function publishJobToChannel(telegram: Telegram, job: Job): Promise<number | null> {
  if (!env.channelId) {
    return null;
  }

  const keyboard = Markup.inlineKeyboard([
    Markup.button.url("Ishni topshirish", buildJobLink(job.id))
  ]);

  if (job.photoFileId) {
    const message = await telegram.sendPhoto(env.channelId, job.photoFileId, {
      caption: formatChannelPost(job),
      ...keyboard
    });
    return message.message_id;
  }

  const message = await telegram.sendMessage(env.channelId, formatChannelPost(job), keyboard);
  return message.message_id;
}

export async function updateChannelJobPost(telegram: Telegram, job: Job): Promise<void> {
  if (!env.channelId) {
    return;
  }

  const keyboard = Markup.inlineKeyboard([
    Markup.button.url("Ishni topshirish", buildJobLink(job.id))
  ]);
  const chatId = job.channelChatId || env.channelId;

  if (!job.channelMessageId) {
    await telegram.sendMessage(env.channelId, [
      "Ish holati yangilandi",
      "",
      formatChannelPost(job)
    ].join("\n"), keyboard);
    return;
  }

  try {
    if (job.photoFileId) {
      await telegram.editMessageCaption(chatId, job.channelMessageId, undefined, formatChannelPost(job), keyboard);
      return;
    }

    await telegram.editMessageText(chatId, job.channelMessageId, undefined, formatChannelPost(job), keyboard);
  } catch (error) {
    console.error(`Kanal posti yangilanmadi: ${job.id}`, error);
    await telegram.sendMessage(env.channelId, [
      "Ish holati yangilandi",
      "",
      formatChannelPost(job)
    ].join("\n"), keyboard);
  }
}

export async function notifyEmployer(telegram: Telegram, job: Job, worker: User, message: string | null): Promise<void> {
  await telegram.sendMessage(job.employerTelegramId, formatEmployerApplication(job, worker, message));
}

export async function notifyAdminsAboutJob(telegram: Telegram, job: Job): Promise<void> {
  await sendJobReviewToAdmins(telegram, job, [
    "Admin xabari: yangi ish e'loni",
    "",
    formatChannelPost(job),
    "",
    `Holat: ko'rib chiqilmoqda`,
    `E'lon ID: ${job.id}`,
    `Ish beruvchi Telegram ID: ${job.employerTelegramId}`
  ].join("\n"));
}

export async function notifyAdminsAboutApplication(
  telegram: Telegram,
  job: Job,
  worker: User,
  message: string | null
): Promise<void> {
  await sendToAdmins(telegram, [
    "Admin xabari: yangi ariza",
    "",
    formatEmployerApplication(job, worker, message),
    "",
    `E'lon ID: ${job.id}`,
    `Ishchi ID: ${worker.id}`
  ].join("\n"));
}

export async function notifyAdminsAboutRegistration(telegram: Telegram, user: User): Promise<void> {
  await sendUserToAdmins(telegram, user, [
    "Admin xabari: yangi ro'yxatdan o'tish",
    "",
    `Rol: ${user.role === "worker" ? "Ishchi" : "Ish beruvchi"}`,
    `Ism: ${user.name}`,
    `Yosh: ${user.age}`,
    user.profession ? `Kasb/faoliyat: ${user.profession}` : null,
    `Telefon: ${user.phone}`,
    `Rozilik: ${user.consentAccepted ? "olingan" : "olinmagan"}`,
    user.consentAcceptedAt ? `Rozilik vaqti: ${user.consentAcceptedAt}` : null,
    `Telegram ID: ${user.telegramId}`,
    user.username ? `Username: @${user.username}` : null
  ].filter(Boolean).join("\n"));
}

export async function notifyAdminsAboutProfileUpdate(telegram: Telegram, user: User): Promise<void> {
  await sendUserToAdmins(telegram, user, [
    "Admin xabari: profil yangilandi",
    "",
    `Rol: ${user.role === "worker" ? "Ishchi" : "Ish beruvchi"}`,
    `Ism: ${user.name}`,
    `Yosh: ${user.age}`,
    user.profession ? `Kasb/faoliyat: ${user.profession}` : null,
    `Telefon: ${user.phone}`,
    `Rozilik: ${user.consentAccepted ? "olingan" : "olinmagan"}`,
    user.consentAcceptedAt ? `Rozilik vaqti: ${user.consentAcceptedAt}` : null,
    `Telegram ID: ${user.telegramId}`,
    user.username ? `Username: @${user.username}` : null
  ].filter(Boolean).join("\n"));
}

async function sendToAdmins(telegram: Telegram, text: string): Promise<void> {
  for (const adminId of env.adminIds) {
    try {
      await telegram.sendMessage(adminId, text);
    } catch (error) {
      console.error(`Adminga xabar yuborilmadi: ${adminId}`, error);
    }
  }
}

async function sendJobReviewToAdmins(telegram: Telegram, job: Job, text: string): Promise<void> {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("Kanalga chiqarish", `admin_approve_job:${job.id}`)],
    [
      Markup.button.callback("Band/yopish", `admin_close_job:${job.id}`),
      Markup.button.callback("Rad etish", `admin_reject_job:${job.id}`)
    ],
    [Markup.button.callback("O'chirish", `admin_delete_job:${job.id}`)]
  ]);

  for (const adminId of env.adminIds) {
    try {
      if (job.photoFileId) {
        await telegram.sendPhoto(adminId, job.photoFileId, { caption: text, ...keyboard });
      } else {
        await telegram.sendMessage(adminId, text, keyboard);
      }
    } catch (error) {
      console.error(`Adminga xabar yuborilmadi: ${adminId}`, error);
    }
  }
}

async function sendUserToAdmins(telegram: Telegram, user: User, text: string): Promise<void> {
  for (const adminId of env.adminIds) {
    try {
      if (user.photoFileId) {
        await telegram.sendPhoto(adminId, user.photoFileId, { caption: text });
      } else {
        await telegram.sendMessage(adminId, text);
      }
    } catch (error) {
      console.error(`Adminga xabar yuborilmadi: ${adminId}`, error);
    }
  }
}

function buildJobLink(jobId: string): string {
  const username = env.botUsername.replace(/^@/, "");
  return `https://t.me/${username}?start=${encodeURIComponent(jobId)}`;
}
