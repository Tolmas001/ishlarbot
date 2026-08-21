import { Markup } from "telegraf";
import type { Context } from "telegraf";
import { findJob, listJobsByLocation } from "../../database/jsonDb.js";
import { getLatestJobs } from "../../services/job.service.js";
import type { User } from "../../types.js";
import { formatJob } from "../formatters.js";
import { menuFor, startMenu } from "../keyboards.js";

export async function sendJobs(ctx: Context, user?: User, location?: string): Promise<void> {
  const jobs = location ? await listJobsByLocation(location, 20) : await getLatestJobs(20);

  if (!jobs.length) {
    await ctx.reply(
      location ? "Bu hudud bo'yicha ish topilmadi." : "Hozircha ish e'lonlari yo'q.",
      user ? menuFor(user.role) : startMenu
    );
    return;
  }

  for (const job of jobs) {
    const keyboard = Markup.inlineKeyboard([Markup.button.callback("Ariza yuborish", `apply:${job.id}`)]);

    if (job.photoFileId) {
      await ctx.replyWithPhoto(job.photoFileId, {
        caption: formatJob(job),
        ...keyboard
      });
      continue;
    }

    await ctx.reply(formatJob(job), keyboard);
  }
}

export async function sendJobDetails(ctx: Context, jobId: string): Promise<void> {
  const job = await findJob(jobId);

  if (!job || (job.status || "open") !== "open") {
    await ctx.reply("Bu ish topilmadi yoki yopilgan.");
    return;
  }

  const keyboard = Markup.inlineKeyboard([Markup.button.callback("Ariza yuborish", `apply:${job.id}`)]);

  if (job.photoFileId) {
    await ctx.replyWithPhoto(job.photoFileId, {
      caption: formatJob(job),
      ...keyboard
    });
    return;
  }

  await ctx.reply(formatJob(job), keyboard);
}
