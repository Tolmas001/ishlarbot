import type { Context, Telegram } from "telegraf";
import { upsertUser } from "../../database/jsonDb.js";
import { notifyAdminsAboutProfileUpdate, notifyAdminsAboutRegistration } from "../../services/notification.service.js";
import type { NewUser, RegisterSession, User, UserRole } from "../../types.js";
import { parseAge, requireText } from "../../utils/validation.js";
import { consentText } from "../consent.js";
import { getPhone, getPhotoFileId, getText, getUserId } from "../context.js";
import { backMenu, consentKeyboard, menuFor, phoneKeyboard, startMenu } from "../keyboards.js";
import { clearSession, setSession } from "../sessionStore.js";

export function startRegisterFlow(ctx: Context, role: UserRole): void {
  setSession(ctx, {
    flow: "register",
    role,
    step: "consent",
    mode: "create",
    data: {
      telegramId: getUserId(ctx),
      role,
      username: ctx.from?.username || null
    }
  });
}

export function startEditProfileFlow(ctx: Context, user: User): void {
  setSession(ctx, {
    flow: "register",
    role: user.role,
    step: "name",
    mode: "edit",
    data: {
      telegramId: user.telegramId,
      role: user.role,
      username: user.username
    }
  });
}

export async function handleRegisterFlow(ctx: Context, session: RegisterSession, telegram: Telegram): Promise<void> {
  if (session.step === "consent") {
    const answer = getText(ctx);

    if (answer === "Rozi emasman") {
      clearSession(ctx);
      await ctx.reply("Rozilik berilmagani uchun ro'yxatdan o'tish bekor qilindi.", startMenu);
      return;
    }

    if (answer !== "Roziman") {
      await ctx.reply(consentText, consentKeyboard);
      return;
    }

    session.data.consentAccepted = true;
    session.data.consentAcceptedAt = new Date().toISOString();
    session.step = "name";
    await ctx.reply("Ismingizni yozing:", backMenu);
    return;
  }

  if (session.step === "name") {
    session.data.name = requireText(getText(ctx), "Ism");
    session.step = "age";
    await ctx.reply("Yoshingizni yozing:", backMenu);
    return;
  }

  if (session.step === "age") {
    const age = parseAge(getText(ctx));

    if (!age) {
      await ctx.reply("Yoshni raqam bilan kiriting. Masalan: 25", backMenu);
      return;
    }

    session.data.age = age;
    session.step = "profession";
    await ctx.reply(
      session.role === "worker" ? "Kasbingizni yozing. Masalan: g'isht teruvchi" : "Faoliyat yo'nalishingizni yozing:",
      backMenu
    );
    return;
  }

  if (session.step === "profession") {
    session.data.profession = requireText(getText(ctx), "Kasb");
    session.step = "photo";
    await ctx.reply("O'zingizning rasmingizni yuboring:", backMenu);
    return;
  }

  if (session.step === "photo") {
    const photoFileId = getPhotoFileId(ctx);

    if (!photoFileId) {
      await ctx.reply("Iltimos, rasm yuboring.", backMenu);
      return;
    }

    session.data.photoFileId = photoFileId;
    session.step = "phone";
    await ctx.reply("Telefon raqamingizni yuboring:", phoneKeyboard);
    return;
  }

  if (!getPhone(ctx) || !("contact" in (ctx.message || {}))) {
    await ctx.reply("Telefon raqamni pastdagi tugma orqali yuboring.", phoneKeyboard);
    return;
  }

  const userData: NewUser = {
    telegramId: getUserId(ctx),
    username: ctx.from?.username || null,
    name: requireText(session.data.name, "Ism"),
    age: requireAge(session.data.age),
    profession: requireText(session.data.profession || undefined, "Kasb"),
    photoFileId: requireText(session.data.photoFileId || undefined, "Rasm"),
    consentAccepted: session.data.consentAccepted ?? true,
    consentAcceptedAt: session.data.consentAcceptedAt || null,
    phone: requireText(getPhone(ctx), "Telefon"),
    role: session.role
  };
  const user = await upsertUser(userData);

  if (session.mode === "edit") {
    await notifyAdminsAboutProfileUpdate(telegram, user);
  } else {
    await notifyAdminsAboutRegistration(telegram, user);
  }

  clearSession(ctx);
  await ctx.reply(session.mode === "edit" ? "Ma'lumotlaringiz yangilandi." : "Ro'yxatdan o'tdingiz.", menuFor(user.role));
}

function requireAge(age: number | undefined): number {
  if (!age) {
    throw new Error("Yosh kiritilmagan.");
  }

  return age;
}
