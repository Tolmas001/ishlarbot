import { Markup } from "telegraf";
import type { Context } from "telegraf";
import { closeJob, deleteJob, findJob, findUserById, listApplicationsByJob, listJobsByEmployer } from "../../database/jsonDb.js";
import { formatApplication, formatJob } from "../formatters.js";
import { employerMenu } from "../keyboards.js";
import { requireRegisteredUser } from "../guards.js";
import { updateChannelJobPost } from "../../services/notification.service.js";

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
    await ctx.reply(formatApplication(worker, application.message, index + 1));
  }
}
