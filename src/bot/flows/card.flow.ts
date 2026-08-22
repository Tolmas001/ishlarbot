import type { Context } from "telegraf";
import { updateUserCard } from "../../database/jsonDb.js";
import { parseCardNumber, maskCardNumber } from "../../utils/validation.js";
import { getText } from "../context.js";
import { backMenu, workerMenu } from "../keyboards.js";
import { clearSession, setSession } from "../sessionStore.js";
import { requireRegisteredUser } from "../guards.js";

export function startCardUpdateFlow(ctx: Context): void {
  setSession(ctx, { flow: "card" });
}

export async function handleCardUpdateFlow(ctx: Context): Promise<void> {
  const worker = await requireRegisteredUser(ctx, "worker");
  if (!worker) return;

  const cardNumber = parseCardNumber(getText(ctx));

  if (!cardNumber) {
    await ctx.reply("Karta raqamini 16 ta raqam bilan kiriting. Masalan: 8600123456789012", backMenu);
    return;
  }

  await updateUserCard(worker.id, cardNumber);
  clearSession(ctx);
  await ctx.reply(`Karta raqamingiz saqlandi: ${maskCardNumber(cardNumber)}`, workerMenu);
}
