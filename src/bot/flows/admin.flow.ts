import type { Context } from "telegraf";
import { Markup } from "telegraf";
import { env } from "../../config/env.js";
import { approveJob, closeJob, deleteJob, rejectJob, readDb, saveJobChannelMessage } from "../../database/jsonDb.js";
import { formatJob, formatUserProfile } from "../formatters.js";
import { adminMenu } from "../keyboards.js";
import { getUserId } from "../context.js";
import { publishJobToChannel, updateChannelJobPost } from "../../services/notification.service.js";

export function isAdmin(ctx: Context): boolean {
  return env.adminIds.includes(getUserId(ctx));
}

export async function sendAdminPanel(ctx: Context): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply("Siz admin emassiz.");
    return;
  }

  await ctx.reply("Admin panel", adminMenu);
}

export async function sendStats(ctx: Context): Promise<void> {
  if (!isAdmin(ctx)) return;

  const db = await readDb();
  const pendingJobs = db.jobs.filter((job) => (job.status || "open") === "pending").length;
  const openJobs = db.jobs.filter((job) => (job.status || "open") === "open").length;
  const closedJobs = db.jobs.filter((job) => (job.status || "open") === "closed").length;
  const rejectedJobs = db.jobs.filter((job) => (job.status || "open") === "rejected").length;

  await ctx.reply([
    "Statistika",
    "",
    `Foydalanuvchilar: ${db.users.length}`,
    `E'lonlar: ${db.jobs.length}`,
    `Ko'rib chiqilmoqda: ${pendingJobs}`,
    `Ochiq e'lonlar: ${openJobs}`,
    `Yopilgan e'lonlar: ${closedJobs}`,
    `Rad etilganlar: ${rejectedJobs}`,
    `Arizalar: ${db.applications.length}`
  ].join("\n"), adminMenu);
}

export async function sendAllJobsForAdmin(ctx: Context): Promise<void> {
  if (!isAdmin(ctx)) return;

  const db = await readDb();

  if (!db.jobs.length) {
    await ctx.reply("E'lonlar yo'q.", adminMenu);
    return;
  }

  for (const job of db.jobs) {
    await ctx.reply(
      formatJob(job),
      Markup.inlineKeyboard([
        [Markup.button.callback("Kanalga chiqarish", `admin_approve_job:${job.id}`)],
        [
          Markup.button.callback("Band/yopish", `admin_close_job:${job.id}`),
          Markup.button.callback("Rad etish", `admin_reject_job:${job.id}`)
        ],
        [Markup.button.callback("O'chirish", `admin_delete_job:${job.id}`)]
      ])
    );
  }
}

export async function sendAllUsersForAdmin(ctx: Context): Promise<void> {
  if (!isAdmin(ctx)) return;

  const db = await readDb();

  if (!db.users.length) {
    await ctx.reply("Userlar yo'q.", adminMenu);
    return;
  }

  await ctx.reply(`Jami user profillari: ${db.users.length}`, adminMenu);

  for (const user of db.users) {
    const text = [
      formatUserProfile(user),
      "",
      `Telegram ID: ${user.telegramId}`,
      user.username ? `Username: @${user.username}` : null,
      `User ID: ${user.id}`,
      `Ro'yxatdan o'tgan: ${user.createdAt}`,
      `Oxirgi yangilanish: ${user.updatedAt}`
    ].filter(Boolean).join("\n");

    if (user.photoFileId) {
      await ctx.replyWithPhoto(user.photoFileId, { caption: text });
      continue;
    }

    await ctx.reply(text);
  }
}

export async function deleteJobAsAdmin(ctx: Context, jobId: string): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.answerCbQuery();
    return;
  }

  const deleted = await deleteJob(jobId);
  await ctx.answerCbQuery(deleted ? "E'lon o'chirildi" : "E'lon topilmadi");
}

export async function approveJobAsAdmin(ctx: Context, jobId: string): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.answerCbQuery();
    return;
  }

  const job = await approveJob(jobId);
  if (!job) {
    await ctx.answerCbQuery("E'lon topilmadi");
    return;
  }

  if (job.channelMessageId) {
    await updateChannelJobPost(ctx.telegram, job);
  } else {
    const messageId = await publishJobToChannel(ctx.telegram, job);
    if (messageId) {
      await saveJobChannelMessage(job.id, env.channelId || "", messageId);
    }
  }

  await ctx.answerCbQuery("E'lon kanalga chiqarildi");
}

export async function closeJobAsAdmin(ctx: Context, jobId: string): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.answerCbQuery();
    return;
  }

  const job = await closeJob(jobId);
  if (job) {
    await updateChannelJobPost(ctx.telegram, job);
  }
  await ctx.answerCbQuery(job ? "E'lon band/yopilgan deb belgilandi" : "E'lon topilmadi");
}

export async function rejectJobAsAdmin(ctx: Context, jobId: string): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.answerCbQuery();
    return;
  }

  const job = await rejectJob(jobId);
  await ctx.answerCbQuery(job ? "E'lon rad etildi" : "E'lon topilmadi");
}
