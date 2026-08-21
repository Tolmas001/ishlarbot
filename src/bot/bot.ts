import { Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { env } from "../config/env.js";
import { findUserByTelegramId, findUsersByTelegramId } from "../database/jsonDb.js";
import { formatUserProfile } from "./formatters.js";
import { requireRegisteredUser } from "./guards.js";
import { consentText } from "./consent.js";
import { backMenu, consentKeyboard, menuFor, startMenu } from "./keyboards.js";
import { clearSession, getSession, setSession } from "./sessionStore.js";
import { getText, getUserId } from "./context.js";
import {
  approveJobAsAdmin,
  closeJobAsAdmin,
  deleteJobAsAdmin,
  isAdmin,
  rejectJobAsAdmin,
  sendAdminPanel,
  sendAllJobsForAdmin,
  sendAllUsersForAdmin,
  sendStats
} from "./flows/admin.flow.js";
import { handleApplyFlow, startApplyFlow } from "./flows/apply.flow.js";
import { closeEmployerJob, deleteEmployerJob, sendEmployerJobs, sendJobApplications } from "./flows/employer.flow.js";
import { handleJobFlow, startJobFlow } from "./flows/job.flow.js";
import { sendJobDetails, sendJobs } from "./flows/jobs-list.flow.js";
import { handleRegisterFlow, startEditProfileFlow, startRegisterFlow } from "./flows/register.flow.js";
import { goBackToMenu } from "./navigation.js";
import { ensureChannelMember } from "./membership.js";

export function createBot(): Telegraf {
  const bot = new Telegraf(env.botToken);

  bot.use(async (ctx, next) => {
    if (!(await ensureChannelMember(ctx))) {
      return;
    }

    await next();
  });

  bot.start(async (ctx) => {
    clearSession(ctx);
    const payload = getStartPayload(ctx);

    if (payload) {
      await sendJobDetails(ctx, payload);
      return;
    }

    const users = await findUsersByTelegramId(getUserId(ctx));
    const user = users[0];

    if (isAdmin(ctx)) {
      await ctx.reply(`Assalomu alaykum${user ? `, ${user.name}` : ""}.`);
      await sendAdminPanel(ctx);
      return;
    }

    if (users.length === 1 && user) {
      await ctx.reply(`Assalomu alaykum, ${user.name}.`, isAdmin(ctx) ? undefined : menuFor(user.role));
      return;
    }

    await ctx.reply("Assalomu alaykum. Rolingizni tanlang:", startMenu);
  });

  bot.hears("Ishchi", async (ctx) => {
    const user = await findUserByTelegramId(getUserId(ctx), "worker");
    if (user) {
      await ctx.reply(`Ishchi menyusi, ${user.name}.`, menuFor(user.role));
      return;
    }

    startRegisterFlow(ctx, "worker");
    await ctx.reply(consentText, consentKeyboard);
  });

  bot.hears("Ish beruvchi", async (ctx) => {
    const user = await findUserByTelegramId(getUserId(ctx), "employer");
    if (user) {
      await ctx.reply(`Ish beruvchi menyusi, ${user.name}.`, menuFor(user.role));
      return;
    }

    startRegisterFlow(ctx, "employer");
    await ctx.reply(consentText, consentKeyboard);
  });

  bot.hears("Qaytish", async (ctx) => {
    await goBackToMenu(ctx);
  });

  bot.hears("Admin panel", async (ctx) => {
    await sendAdminPanel(ctx);
  });

  bot.command("admin", async (ctx) => {
    await sendAdminPanel(ctx);
  });

  bot.hears("Statistika", async (ctx) => {
    await sendStats(ctx);
  });

  bot.hears("Barcha e'lonlar", async (ctx) => {
    await sendAllJobsForAdmin(ctx);
  });

  bot.hears("Barcha userlar", async (ctx) => {
    await sendAllUsersForAdmin(ctx);
  });

  bot.hears("Ish qo'shish", async (ctx) => {
    const user = await findUserByTelegramId(getUserId(ctx), "employer");

    if (!user && !isAdmin(ctx)) {
      await ctx.reply("Avval ish beruvchi sifatida ro'yxatdan o'ting.", startMenu);
      return;
    }

    startJobFlow(ctx, user || getUserId(ctx));
    await ctx.reply("Ish nomini yozing. Masalan: G'isht teruvchi kerak", backMenu);
  });

  bot.hears("Ishlarni ko'rish", async (ctx) => {
    const user = await findUserByTelegramId(getUserId(ctx), "worker")
      || await findUserByTelegramId(getUserId(ctx), "employer");
    await sendJobs(ctx, user);
  });

  bot.hears("Hudud bo'yicha qidirish", async (ctx) => {
    const user = await requireRegisteredUser(ctx, "worker");
    if (!user) return;

    setSession(ctx, { flow: "locationFilter" });
    await ctx.reply("Qaysi hudud bo'yicha qidiramiz? Masalan: Toshkent", backMenu);
  });

  bot.hears("Mening e'lonlarim", async (ctx) => {
    await sendEmployerJobs(ctx);
  });

  bot.hears("Ishchi ma'lumotini o'zgartirish", async (ctx) => {
    const user = await findUserByTelegramId(getUserId(ctx), "worker");

    if (!user) {
      await ctx.reply("Avval ishchi sifatida ro'yxatdan o'ting.", startMenu);
      return;
    }

    startEditProfileFlow(ctx, user);
    await ctx.reply("Yangi ismingizni yozing:", backMenu);
  });

  bot.hears("Ish beruvchi ma'lumotini o'zgartirish", async (ctx) => {
    const user = await findUserByTelegramId(getUserId(ctx), "employer");

    if (!user) {
      await ctx.reply("Avval ish beruvchi sifatida ro'yxatdan o'ting.", startMenu);
      return;
    }

    startEditProfileFlow(ctx, user);
    await ctx.reply("Yangi ism yoki kompaniya nomini yozing:", backMenu);
  });

  bot.hears("Mening ma'lumotim", async (ctx) => {
    const users = await findUsersByTelegramId(getUserId(ctx));

    if (!users.length) {
      await ctx.reply("Avval ro'yxatdan o'ting.", startMenu);
      return;
    }

    for (const user of users) {
      await ctx.reply(formatUserProfile(user), menuFor(user.role));
    }
  });

  bot.action(/^apply:(.+)$/, async (ctx) => {
    await startApplyFlow(ctx, ctx.match[1]);
  });

  bot.action(/^job_apps:(.+)$/, async (ctx) => {
    await sendJobApplications(ctx, ctx.match[1]);
  });

  bot.action(/^job_close:(.+)$/, async (ctx) => {
    await closeEmployerJob(ctx, ctx.match[1]);
  });

  bot.action(/^job_delete:(.+)$/, async (ctx) => {
    await deleteEmployerJob(ctx, ctx.match[1]);
  });

  bot.action(/^admin_delete_job:(.+)$/, async (ctx) => {
    await deleteJobAsAdmin(ctx, ctx.match[1]);
  });

  bot.action(/^admin_approve_job:(.+)$/, async (ctx) => {
    await approveJobAsAdmin(ctx, ctx.match[1]);
  });

  bot.action(/^admin_close_job:(.+)$/, async (ctx) => {
    await closeJobAsAdmin(ctx, ctx.match[1]);
  });

  bot.action(/^admin_reject_job:(.+)$/, async (ctx) => {
    await rejectJobAsAdmin(ctx, ctx.match[1]);
  });

  bot.on(["text", "contact", "photo", "location"], async (ctx) => {
    const session = getSession(ctx);

    if (!session) {
      await ctx.reply("Menyudan kerakli bo'limni tanlang.", startMenu);
      return;
    }

    if (session.flow === "register") {
      await handleRegisterFlow(ctx, session, bot.telegram);
      return;
    }

    if (session.flow === "job") {
      await handleJobFlow(ctx, session, bot.telegram);
      return;
    }

    if (session.flow === "locationFilter") {
      const user = await findUserByTelegramId(getUserId(ctx), "worker");
      clearSession(ctx);
      await sendJobs(ctx, user, getText(ctx));
      return;
    }

    await handleApplyFlow(ctx, session.jobId, bot.telegram);
  });

  bot.catch(async (error, ctx) => {
    console.error(error);
    await ctx.reply("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki Qaytish tugmasini bosing.", backMenu);
  });

  return bot;
}

function getStartPayload(ctx: Context): string | null {
  const text = getText(ctx);

  if (!text.startsWith("/start ")) {
    return null;
  }

  return text.replace("/start ", "").trim() || null;
}
