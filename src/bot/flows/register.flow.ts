import type { Context, Telegram } from "telegraf";
import { upsertUser } from "../../database/jsonDb.js";
import { notifyAdminsAboutProfileUpdate, notifyAdminsAboutRegistration } from "../../services/notification.service.js";
import type { NewUser, RegisterSession, User, UserRole } from "../../types.js";
import { parseAge, parseCardNumber, requireText } from "../../utils/validation.js";
import { consentText } from "../consent.js";
import { getPhone, getPhotoFileId, getText, getUserId } from "../context.js";
import { backMenu, consentKeyboard, languageKeyboard, menuFor, phoneKeyboard, startMenu } from "../keyboards.js";
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
      username: ctx.from?.username || null,
      language: "uz",
      rating: 0,
      ratingCount: 0
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

  if (session.step === "phone") {
    if (!getPhone(ctx) || !("contact" in (ctx.message || {}))) {
      await ctx.reply("Telefon raqamni pastdagi tugma orqali yuboring.", phoneKeyboard);
      return;
    }

    session.data.phone = requireText(getPhone(ctx), "Telefon");

    if (session.role === "worker" && session.mode === "create") {
      session.step = "card";
      await ctx.reply("Karta raqamingizni kiriting (16 ta raqam). Maosh shu kartaga o'tkaziladi:", backMenu);
      return;
    }

    await finishRegistration(ctx, session, telegram);
    return;
  }

  if (session.step === "card") {
    const cardNumber = parseCardNumber(getText(ctx));

    if (!cardNumber) {
      await ctx.reply("Karta raqamini 16 ta raqam bilan kiriting. Masalan: 8600123456789012", backMenu);
      return;
    }

    session.data.cardNumber = cardNumber;
    await finishRegistration(ctx, session, telegram);
  }
}

async function finishRegistration(ctx: Context, session: RegisterSession, telegram: Telegram): Promise<void> {
  const userData: NewUser = {
    telegramId: getUserId(ctx),
    username: ctx.from?.username || null,
    name: requireText(session.data.name, "Ism"),
    age: requireAge(session.data.age),
    profession: requireText(session.data.profession || undefined, "Kasb"),
    photoFileId: requireText(session.data.photoFileId || undefined, "Rasm"),
    consentAccepted: session.data.consentAccepted ?? true,
    consentAcceptedAt: session.data.consentAcceptedAt || null,
    phone: requireText(session.data.phone || getPhone(ctx), "Telefon"),
    cardNumber: session.data.cardNumber ?? null,
    banned: false,
    bannedAt: null,
    banReason: null,
    role: session.role,
    language: session.data.language ?? "uz",
    rating: session.data.rating ?? 0,
    ratingCount: session.data.ratingCount ?? 0
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
