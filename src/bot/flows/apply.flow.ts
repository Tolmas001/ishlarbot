import type { Context, Telegram } from "telegraf";
import { findJob } from "../../database/jsonDb.js";
import { applyToJob } from "../../services/application.service.js";
import { getText } from "../context.js";
import { backMenu, workerMenu } from "../keyboards.js";
import { clearSession, setSession } from "../sessionStore.js";
import { requireRegisteredUser } from "../guards.js";

export async function startApplyFlow(ctx: Context, jobId: string): Promise<void> {
  const worker = await requireRegisteredUser(ctx, "worker");
  if (!worker) {
    await ctx.answerCbQuery();
    return;
  }

  const job = await findJob(jobId);
  if (!job) {
    await ctx.answerCbQuery("Ish topilmadi");
    return;
  }

  setSession(ctx, {
    flow: "apply",
    jobId: job.id
  });

  await ctx.answerCbQuery();
  await ctx.reply("Ariza uchun qisqa xabar yozing. Xabar kerak bo'lmasa: - yozing", backMenu);
}

export async function handleApplyFlow(ctx: Context, jobId: string, telegram: Telegram): Promise<void> {
  const worker = await requireRegisteredUser(ctx, "worker");
  if (!worker) return;

  const job = await findJob(jobId);
  if (!job) {
    clearSession(ctx);
    await ctx.reply("Ish topilmadi.", workerMenu);
    return;
  }

  const message = getText(ctx);
  const application = await applyToJob({
    jobId,
    userId: worker.id,
    message: message === "-" ? null : message || null
  }, telegram);

  clearSession(ctx);

  if (!application) {
    await ctx.reply("Siz bu ishga avval ariza yuborgansiz.", workerMenu);
    return;
  }

  await ctx.reply("Arizangiz yuborildi.", workerMenu);
}
