import type { Context } from "telegraf";
import { Markup } from "telegraf";
import { saveJob, unsaveJob, getSavedJobs } from "../../database/jsonDb.js";
import { findJob } from "../../database/jsonDb.js";
import { findUserByTelegramId } from "../../database/jsonDb.js";
import { formatJob } from "../formatters.js";
import { clearSession, getSession } from "../sessionStore.js";
import { getUserId } from "../context.js";
import { backMenu } from "../keyboards.js";

export async function sendSavedJobs(ctx: Context): Promise<void> {
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) {
    await ctx.reply("Avval ro'yxatdan o'ting.");
    return;
  }

  const savedJobs = await getSavedJobs(user.id);

  if (!savedJobs.length) {
    await ctx.reply("Hozircha saqlangan ishlar yo'q.");
    return;
  }

  await ctx.reply(`Saqlangan ishlar (${savedJobs.length} ta):`);

  for (const savedJob of savedJobs.slice(0, 10)) {
    const job = await findJob(savedJob.jobId);
    if (job) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("🗑 O'chirish", `unsave_job:${savedJob.jobId}`)],
        [Markup.button.callback("📋 Tafsilotlar", `job_detail:${savedJob.jobId}`)]
      ]);

      await ctx.reply(formatJob(job), keyboard);
    }
  }
}

export async function toggleSaveJob(ctx: Context, jobId: string): Promise<void> {
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) {
    await ctx.reply("Avval ro'yxatdan o'ting.");
    return;
  }

  const job = await findJob(jobId);
  if (!job) {
    await ctx.reply("Ish topilmadi.");
    return;
  }

  const savedJobs = await getSavedJobs(user.id);
  const alreadySaved = savedJobs.some(sj => sj.jobId === jobId);

  if (alreadySaved) {
    await unsaveJob(user.id, jobId);
    await ctx.reply("Ish saqlanganlardan olib tashlandi.");
  } else {
    await saveJob({ userId: user.id, jobId });
    await ctx.reply("Ish saqlanganlarga qo'shildi.");
  }
}
