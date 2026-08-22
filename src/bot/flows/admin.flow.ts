import type { Context } from "telegraf";
import { Markup } from "telegraf";
import { env } from "../../config/env.js";
import {
  approveJob,
  approvePayment,
  banUser,
  closeJob,
  deleteJob,
  findJob,
  findPayment,
  findUserById,
  listPendingPayments,
  readDb,
  rejectJob,
  rejectPayment,
  saveJobChannelMessage
} from "../../database/jsonDb.js";
import { formatJob, formatPayment, formatUserProfile } from "../formatters.js";
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
    `Arizalar: ${db.applications.length}`,
    `To'lovlar: ${db.payments.length}`,
    `Tekshiruvdagi cheklar: ${db.payments.filter((payment) => payment.status === "pending_review").length}`
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

export async function sendPendingPayments(ctx: Context): Promise<void> {
  if (!isAdmin(ctx)) return;

  const payments = await listPendingPayments();

  if (!payments.length) {
    await ctx.reply("Tekshiruvdagi to'lov cheklari yo'q.", adminMenu);
    return;
  }

  for (const payment of payments) {
    const job = await findJob(payment.jobId);
    const worker = await findUserById(payment.workerId);
    const caption = formatPayment(payment, job?.title || "Noma'lum ish", worker?.name || "Noma'lum ishchi");

    if (payment.receiptFileId) {
      await ctx.replyWithPhoto(payment.receiptFileId, {
        caption,
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("Chek to'g'ri", `payment_approve:${payment.id}`),
            Markup.button.callback("Soxta chek - ban", `payment_reject:${payment.id}`)
          ]
        ])
      });
      continue;
    }

    await ctx.reply(caption, Markup.inlineKeyboard([
      [
        Markup.button.callback("Chek to'g'ri", `payment_approve:${payment.id}`),
        Markup.button.callback("Soxta chek - ban", `payment_reject:${payment.id}`)
      ]
    ]));
  }
}

export async function approvePaymentAsAdmin(ctx: Context, paymentId: string): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.answerCbQuery();
    return;
  }

  const payment = await approvePayment(paymentId, getUserId(ctx));

  if (!payment) {
    await ctx.answerCbQuery("To'lov topilmadi");
    return;
  }

  const job = await findJob(payment.jobId);
  const worker = await findUserById(payment.workerId);

  await ctx.telegram.sendMessage(
    payment.employerTelegramId,
    `To'lov chekingiz tasdiqlandi.\n\n${formatPayment(payment, job?.title || "Ish", worker?.name || "Ishchi")}`
  ).catch(() => undefined);

  if (worker) {
    await ctx.telegram.sendMessage(
      worker.telegramId,
      `Sizga to'lov tasdiqlandi.\n\nIsh: ${job?.title || "Ish"}\nSumma: ${payment.payoutAmount.toLocaleString("uz-UZ")} so'm`
    ).catch(() => undefined);
  }

  await ctx.answerCbQuery("To'lov tasdiqlandi");
}

export async function rejectPaymentAsAdmin(ctx: Context, paymentId: string): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.answerCbQuery();
    return;
  }

  const payment = await findPayment(paymentId);

  if (!payment || payment.status !== "pending_review") {
    await ctx.answerCbQuery("To'lov topilmadi");
    return;
  }

  const rejected = await rejectPayment(paymentId, getUserId(ctx));

  if (!rejected) {
    await ctx.answerCbQuery("To'lov topilmadi");
    return;
  }

  const banReason = "Soxta to'lov cheki yuborgan";
  await banUser(payment.employerTelegramId, banReason);

  await ctx.telegram.sendMessage(
    payment.employerTelegramId,
    [
      "Siz yuborgan to'lov cheki soxta deb topildi.",
      "Hisobingiz botdan ban qilindi.",
      `Sabab: ${banReason}`
    ].join("\n")
  ).catch(() => undefined);

  await ctx.answerCbQuery("Soxta chek - foydalanuvchi ban qilindi");
}
