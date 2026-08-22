import type { Context, Telegram } from "telegraf";
import { filterJobs } from "../../database/jsonDb.js";
import { findUserByTelegramId } from "../../database/jsonDb.js";
import { formatJob } from "../formatters.js";
import { clearSession, getSession, setSession } from "../sessionStore.js";
import { getUserId, getText } from "../context.js";
import { backMenu, filterMenuKeyboard, difficultyKeyboard, jobTypeKeyboard, experienceLevelKeyboard } from "../keyboards.js";
import { Markup } from "telegraf";

export async function startFilterFlow(ctx: Context): Promise<void> {
  const session = { flow: "filter" as const, step: "salaryMin" as const, data: {} };
  setSession(ctx, session);
  await ctx.reply("Minimal maoshni kiriting (so'mda) yoki 'O'tkazib yuborish'ni bosing:", 
    Markup.keyboard([["O'tkazib yuborish"], ["Qaytish"]]).resize()
  );
}

export async function handleFilterFlow(ctx: Context, telegram: Telegram): Promise<void> {
  const session = getSession(ctx);
  if (session?.flow !== "filter") return;

  const text = getText(ctx);

  if (text === "O'tkazib yuborish") {
    session.data.salaryMin = undefined;
    session.step = "salaryMax";
    setSession(ctx, session);
    await ctx.reply("Maksimal maoshni kiriting (so'mda) yoki 'O'tkazib yuborish'ni bosing:",
      Markup.keyboard([["O'tkazib yuborish"], ["Qaytish"]]).resize()
    );
    return;
  }

  if (session.step === "salaryMin") {
    const salaryMin = parseInt(text, 10);
    if (isNaN(salaryMin) || salaryMin < 0) {
      await ctx.reply("Iltimos, to'g'ri raqam kiriting:");
      return;
    }
    session.data.salaryMin = salaryMin;
    session.step = "salaryMax";
    setSession(ctx, session);
    await ctx.reply("Maksimal maoshni kiriting (so'mda) yoki 'O'tkazib yuborish'ni bosing:",
      Markup.keyboard([["O'tkazib yuborish"], ["Qaytish"]]).resize()
    );
    return;
  }

  if (session.step === "salaryMax") {
    if (text !== "O'tkazib yuborish") {
      const salaryMax = parseInt(text, 10);
      if (isNaN(salaryMax) || salaryMax < 0) {
        await ctx.reply("Iltimos, to'g'ri raqam kiriting:");
        return;
      }
      session.data.salaryMax = salaryMax;
    }
    session.step = "difficulty";
    setSession(ctx, session);
    await ctx.reply("Ish qiyinchiligini tanlang:", difficultyKeyboard);
    return;
  }

  if (session.step === "difficulty") {
    if (text === "Yengil ish") {
      session.data.difficulty = "light";
    } else if (text === "Og'ir ish") {
      session.data.difficulty = "heavy";
    } else if (text === "O'tkazib yuborish") {
      session.data.difficulty = undefined;
    } else if (text === "Qaytish") {
      clearSession(ctx);
      return;
    } else {
      await ctx.reply("Iltimos, variantni tanlang:", difficultyKeyboard);
      return;
    }
    session.step = "jobType";
    setSession(ctx, session);
    await ctx.reply("Ish turini tanlang:", jobTypeKeyboard);
    return;
  }

  if (session.step === "jobType") {
    if (text === "Vaqtinchalik") {
      session.data.jobType = "temporary";
    } else if (text === "Doimiy") {
      session.data.jobType = "permanent";
    } else if (text === "O'tkazib yuborish") {
      session.data.jobType = undefined;
    } else if (text === "Qaytish") {
      clearSession(ctx);
      return;
    } else {
      await ctx.reply("Iltimos, variantni tanlang:", jobTypeKeyboard);
      return;
    }
    session.step = "experienceLevel";
    setSession(ctx, session);
    await ctx.reply("Tajriba darajasini tanlang:", experienceLevelKeyboard);
    return;
  }

  if (session.step === "experienceLevel") {
    if (text === "Boshlang'ich") {
      session.data.experienceLevel = "beginner";
    } else if (text === "O'rta") {
      session.data.experienceLevel = "intermediate";
    } else if (text === "Ekspert") {
      session.data.experienceLevel = "expert";
    } else if (text === "O'tkazib yuborish") {
      session.data.experienceLevel = undefined;
    } else if (text === "Qaytish") {
      clearSession(ctx);
      return;
    } else {
      await ctx.reply("Iltimos, variantni tanlang:", experienceLevelKeyboard);
      return;
    }

    const user = await findUserByTelegramId(getUserId(ctx));
    const filteredJobs = await filterJobs(session.data);

    clearSession(ctx);

    if (!filteredJobs.length) {
      await ctx.reply("Berilgan filtrlar bo'yicha ish topilmadi.", backMenu);
      return;
    }

    await ctx.reply(`Topilgan ishlar (${filteredJobs.length} ta):`);

    for (const job of filteredJobs.slice(0, 10)) {
      await ctx.reply(formatJob(job));
    }
  }
}

export async function clearFilters(ctx: Context): Promise<void> {
  clearSession(ctx);
  await ctx.reply("Filtrlar tozalandi.", backMenu);
}
