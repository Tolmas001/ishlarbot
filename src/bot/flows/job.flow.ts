import type { Context, Telegram } from "telegraf";
import { Markup } from "telegraf";
import { addJob } from "../../services/job.service.js";
import type { JobSession, NewJob, User } from "../../types.js";
import { requireText } from "../../utils/validation.js";
import { getLocationText, getPhotoFileId, getText } from "../context.js";
import { formatJob } from "../formatters.js";
import {
  backMenu,
  difficultyKeyboard,
  employerMenu,
  skipLocationKeyboard,
  skipPhotoKeyboard,
  skipWorkTimeKeyboard,
  jobTypeKeyboard,
  experienceLevelKeyboard
} from "../keyboards.js";
import { clearSession, setSession } from "../sessionStore.js";

export function startJobFlow(ctx: Context, employer: User | string): void {
  const employerTelegramId = typeof employer === "string" ? employer : employer.telegramId;

  setSession(ctx, {
    flow: "job",
    step: "title",
    data: {
      employerTelegramId
    }
  });
}

export async function handleJobFlow(ctx: Context, session: JobSession, telegram: Telegram): Promise<void> {
  const value = getText(ctx);

  if (session.step === "title") {
    session.data.title = requireText(value, "Ish nomi");
    session.step = "description";
    await ctx.reply("Ish tavsifini yozing:", backMenu);
    return;
  }

  if (session.step === "description") {
    session.data.description = requireText(value, "Tavsif");
    session.step = "salary";
    await ctx.reply("Kunlik maoshni yozing. Masalan: 150 000 so'm / kun", backMenu);
    return;
  }

  if (session.step === "salary") {
    session.data.salary = requireText(value, "Maosh");
    session.step = "salaryMin";
    await ctx.reply("Minimal maoshni kiriting (so'mda) yoki 'O'tkazib yuborish'ni bosing:",
      Markup.keyboard([["O'tkazib yuborish"], ["Qaytish"]]).resize()
    );
    return;
  }

  if (session.step === "salaryMin") {
    if (value !== "O'tkazib yuborish") {
      const salaryMin = parseInt(value, 10);
      if (isNaN(salaryMin) || salaryMin < 0) {
        await ctx.reply("Iltimos, to'g'ri raqam kiriting:");
        return;
      }
      session.data.salaryMin = salaryMin;
    }
    session.step = "salaryMax";
    await ctx.reply("Maksimal maoshni kiriting (so'mda) yoki 'O'tkazib yuborish'ni bosing:",
      Markup.keyboard([["O'tkazib yuborish"], ["Qaytish"]]).resize()
    );
    return;
  }

  if (session.step === "salaryMax") {
    if (value !== "O'tkazib yuborish") {
      const salaryMax = parseInt(value, 10);
      if (isNaN(salaryMax) || salaryMax < 0) {
        await ctx.reply("Iltimos, to'g'ri raqam kiriting:");
        return;
      }
      session.data.salaryMax = salaryMax;
    }
    session.step = "location";
    await ctx.reply("Ish joyini yozing. Masalan: Toshkent, Chilonzor", backMenu);
    return;
  }

  if (session.step === "location") {
    session.data.location = requireText(value, "Joy");
    session.step = "geoLocation";
    await ctx.reply("Aniq lokatsiyani yuboring yoki o'tkazib yuboring:", skipLocationKeyboard);
    return;
  }

  if (session.step === "geoLocation") {
    session.data.geoLocation = getLocationText(ctx) || (value === "Lokatsiya yo'q" ? null : requireText(value, "Lokatsiya"));
    session.step = "workTime";
    await ctx.reply("Ish vaqtini yozing yoki o'tkazib yuboring:", skipWorkTimeKeyboard);
    return;
  }

  if (session.step === "workTime") {
    session.data.workTime = value === "O'tkazib yuborish" ? null : requireText(value, "Ish vaqti");
    session.step = "meals";
    await ctx.reply("Ovqat necha mahal beriladi? Masalan: 2 mahal. Bo'lmasa: yo'q", backMenu);
    return;
  }

  if (session.step === "meals") {
    session.data.meals = requireText(value, "Ovqat");
    session.step = "difficulty";
    await ctx.reply("Ish turi qanday?", difficultyKeyboard);
    return;
  }

  if (session.step === "difficulty") {
    if (value !== "Yengil ish" && value !== "Og'ir ish") {
      await ctx.reply("Ish turini tugma orqali tanlang.", difficultyKeyboard);
      return;
    }

    session.data.difficulty = value === "Yengil ish" ? "light" : "heavy";
    session.step = "jobType";
    await ctx.reply("Ish muddatini tanlang:", jobTypeKeyboard);
    return;
  }

  if (session.step === "jobType") {
    if (value === "Vaqtinchalik") {
      session.data.jobType = "temporary";
    } else if (value === "Doimiy") {
      session.data.jobType = "permanent";
    } else if (value === "Qaytish") {
      clearSession(ctx);
      return;
    } else {
      await ctx.reply("Iltimos, variantni tanlang:", jobTypeKeyboard);
      return;
    }
    session.step = "experienceLevel";
    await ctx.reply("Tajriba darajasini tanlang:", experienceLevelKeyboard);
    return;
  }

  if (session.step === "experienceLevel") {
    if (value === "Boshlang'ich") {
      session.data.experienceLevel = "beginner";
    } else if (value === "O'rta") {
      session.data.experienceLevel = "intermediate";
    } else if (value === "Ekspert") {
      session.data.experienceLevel = "expert";
    } else if (value === "Qaytish") {
      clearSession(ctx);
      return;
    } else {
      await ctx.reply("Iltimos, variantni tanlang:", experienceLevelKeyboard);
      return;
    }
    session.step = "photo";
    await ctx.reply("Ish uchun rasm yuboring yoki o'tkazib yuboring:", skipPhotoKeyboard);
    return;
  }

  const photoFileId = getPhotoFileId(ctx);
  if (!photoFileId && value !== "Rasm qo'shmaslik") {
    await ctx.reply("Rasm yuboring yoki “Rasm qo'shmaslik” tugmasini bosing.", skipPhotoKeyboard);
    return;
  }

  const jobData: NewJob = {
    employerTelegramId: requireText(session.data.employerTelegramId, "Ish beruvchi"),
    title: requireText(session.data.title, "Ish nomi"),
    description: requireText(session.data.description, "Tavsif"),
    salary: requireText(session.data.salary, "Maosh"),
    salaryMin: session.data.salaryMin ?? null,
    salaryMax: session.data.salaryMax ?? null,
    location: requireText(session.data.location, "Joy"),
    geoLocation: session.data.geoLocation ?? null,
    workTime: session.data.workTime ?? null,
    meals: session.data.meals ?? null,
    difficulty: session.data.difficulty ?? "light",
    jobType: session.data.jobType ?? "temporary",
    experienceLevel: session.data.experienceLevel ?? "beginner",
    photoFileId
  };

  const job = await addJob(jobData, telegram);
  clearSession(ctx);
  await ctx.reply(
    `Ish e'loni adminga yuborildi. Admin tasdiqlagandan keyin kanalga chiqadi.\n\n${formatJob(job)}`,
    employerMenu
  );
}
