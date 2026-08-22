import type { Context, Telegram } from "telegraf";
import { createRating, getRatingsByUser, findUserById, findUserByTelegramId } from "../../database/jsonDb.js";
import { formatRating } from "../formatters.js";
import { clearSession, getSession, setSession } from "../sessionStore.js";
import { getUserId, getText } from "../context.js";
import { backMenu, ratingKeyboard } from "../keyboards.js";

export async function startRatingFlow(ctx: Context, targetUserId: string, jobId: string | null): Promise<void> {
  const session = { flow: "rating" as const, targetUserId, jobId };
  setSession(ctx, session);
  await ctx.reply("Foydalanuvchini baholang (1-5):", ratingKeyboard);
}

export async function handleRatingFlow(ctx: Context, telegram: Telegram): Promise<void> {
  const session = getSession(ctx);
  if (session?.flow !== "rating") return;

  const text = getText(ctx);
  const scoreMatch = text.match(/⭐ (\d)/);
  if (!scoreMatch) {
    await ctx.reply("Iltimos, yulduzchani tanlang:", ratingKeyboard);
    return;
  }

  const score = parseInt(scoreMatch[1], 10);
  if (score < 1 || score > 5) {
    await ctx.reply("Baholash 1 dan 5 gacha bo'lishi kerak:", ratingKeyboard);
    return;
  }

  const fromUser = await findUserByTelegramId(getUserId(ctx));
  if (!fromUser) {
    await ctx.reply("Xatolik yuz berdi. Qaytadan urinib ko'ring.", backMenu);
    clearSession(ctx);
    return;
  }

  const toUser = await findUserById(session.targetUserId);
  if (!toUser) {
    await ctx.reply("Foydalanuvchi topilmadi.", backMenu);
    clearSession(ctx);
    return;
  }

  await createRating({
    fromUserId: fromUser.id,
    toUserId: session.targetUserId,
    jobId: session.jobId,
    score,
    comment: null
  });

  await ctx.reply("Baholash muvaffaqiyatli qabul qilindi!", backMenu);
  clearSession(ctx);
}

export async function sendUserRatings(ctx: Context, userId: string): Promise<void> {
  const ratings = await getRatingsByUser(userId);
  const user = await findUserById(userId);

  if (!ratings.length) {
    await ctx.reply("Hozircha baholashlar yo'q.");
    return;
  }

  for (const rating of ratings.slice(0, 10)) {
    const fromUser = await findUserById(rating.fromUserId);
    if (fromUser && user) {
      await ctx.reply(formatRating(rating, fromUser, user));
    }
  }
}
