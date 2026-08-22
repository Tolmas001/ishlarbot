import { Markup } from "telegraf";
import type { Context } from "telegraf";
import { closeJob, deleteJob, findJob, findUserById, listApplicationsByJob, listJobsByEmployer } from "../../database/jsonDb.js";
import { formatApplication, formatJob } from "../formatters.js";
import { employerMenu } from "../keyboards.js";
import { requireRegisteredUser } from "../guards.js";
import { updateChannelJobPost } from "../../services/notification.service.js";
import { startPaymentForApplication } from "../../services/payment.service.js";
import { formatPaymentInstructions, startPaymentReceiptSession } from "./payment.flow.js";
import { backMenu } from "../keyboards.js";

export async function sendEmployerJobs(ctx: Context): Promise<void> {
  const employer = await requireRegisteredUser(ctx, "employer");
  if (!employer) return;

  const jobs = await listJobsByEmployer(employer.telegramId);

  if (!jobs.length) {
    await ctx.reply("Sizda hali e'lon yo'q.", employerMenu);
    return;
  }

  for (const job of jobs) {
    await ctx.reply(
      formatJob(job),
      Markup.inlineKeyboard([
        [Markup.button.callback("Arizalar", `job_apps:${job.id}`)],
        [
          Markup.button.callback("Yopish", `job_close:${job.id}`),
          Markup.button.callback("O'chirish", `job_delete:${job.id}`)
        ]
      ])
    );
  }
}

export async function closeEmployerJob(ctx: Context, jobId: string): Promise<void> {
  const employer = await requireRegisteredUser(ctx, "employer");
  if (!employer) {
    await ctx.answerCbQuery();
    return;
  }

  const job = await closeJob(jobId, employer.telegramId);
  if (job) {
    await updateChannelJobPost(ctx.telegram, job);
  }
  await ctx.answerCbQuery(job ? "E'lon yopildi" : "E'lon topilmadi");
}

export async function deleteEmployerJob(ctx: Context, jobId: string): Promise<void> {
  const employer = await requireRegisteredUser(ctx, "employer");
  if (!employer) {
    await ctx.answerCbQuery();
    return;
  }

  const deleted = await deleteJob(jobId, employer.telegramId);
  await ctx.answerCbQuery(deleted ? "E'lon o'chirildi" : "E'lon topilmadi");
}

export async function sendJobApplications(ctx: Context, jobId: string): Promise<void> {
  const employer = await requireRegisteredUser(ctx, "employer");
  if (!employer) {
    await ctx.answerCbQuery();
    return;
  }

  const job = await findJob(jobId);
  if (!job || job.employerTelegramId !== employer.telegramId) {
    await ctx.answerCbQuery("E'lon topilmadi");
    return;
  }

  const applications = await listApplicationsByJob(jobId);
  await ctx.answerCbQuery();

  if (!applications.length) {
    await ctx.reply("Bu e'longa hali ariza kelmagan.", employerMenu);
    return;
  }

  for (const [index, application] of applications.entries()) {
    const worker = await findUserById(application.userId);
    await ctx.reply(
      formatApplication(worker, application.message, index + 1),
      Markup.inlineKeyboard([
        [Markup.button.callback("To'lov qilish", `pay_worker:${application.id}`)]
      ])
    );
  }
}

export async function startEmployerPayment(ctx: Context, applicationId: string): Promise<void> {
  const employer = await requireRegisteredUser(ctx, "employer");
  if (!employer) {
    await ctx.answerCbQuery();
    return;
  }

  const result = await startPaymentForApplication(applicationId, employer.telegramId);
  await ctx.answerCbQuery();

  if (!result.ok) {
    if (result.reason === "no_card") {
      await ctx.reply("Ishchi karta raqamini kiritmagan. To'lovni boshlash mumkin emas.", employerMenu);
      return;
    }

    if (result.reason === "invalid_salary") {
      await ctx.reply("Ish maoshida raqam topilmadi. Maoshni raqam bilan yozing.", employerMenu);
      return;
    }

    if (result.reason === "already_exists" && result.payment) {
      if (result.payment.status === "awaiting_receipt") {
        startPaymentReceiptSession(ctx, result.payment.id);
        await ctx.reply(formatPaymentInstructions(result.payment, "Ishchi"), backMenu);
        return;
      }

      await ctx.reply("Bu ariza uchun to'lov allaqachon yuborilgan yoki tekshirilmoqda.", employerMenu);
      return;
    }

    await ctx.reply("To'lovni boshlab bo'lmadi.", employerMenu);
    return;
  }

  startPaymentReceiptSession(ctx, result.payment.id);
  await ctx.reply(formatPaymentInstructions(result.payment, result.worker.name), backMenu);
}
