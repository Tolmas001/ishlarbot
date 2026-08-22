import type { Context } from "telegraf";
import { env } from "../../config/env.js";
import { findJob, findUserById, submitPaymentReceipt } from "../../database/jsonDb.js";
import { notifyAdminsAboutReceipt } from "../../services/payment.service.js";
import { formatMoney } from "../../utils/payment.js";
import { getPhotoFileId } from "../context.js";
import { backMenu, employerMenu } from "../keyboards.js";
import { clearSession, setSession } from "../sessionStore.js";
import { requireRegisteredUser } from "../guards.js";

export async function handlePaymentReceiptFlow(ctx: Context, paymentId: string, telegram: Context["telegram"]): Promise<void> {
  const employer = await requireRegisteredUser(ctx, "employer");
  if (!employer) return;

  const photoFileId = getPhotoFileId(ctx);

  if (!photoFileId) {
    await ctx.reply("Iltimos, kartaga o'tkazilgan to'lov chekini rasm sifatida yuboring.", backMenu);
    return;
  }

  const payment = await submitPaymentReceipt(paymentId, photoFileId);

  if (!payment) {
    clearSession(ctx);
    await ctx.reply("To'lov topilmadi yoki chek allaqachon yuborilgan.", employerMenu);
    return;
  }

  if (payment.employerTelegramId !== employer.telegramId) {
    clearSession(ctx);
    await ctx.reply("Bu to'lov sizga tegishli emas.", employerMenu);
    return;
  }

  const job = await findJob(payment.jobId);
  const worker = await findUserById(payment.workerId);

  if (job && worker) {
    await notifyAdminsAboutReceipt(telegram, payment, job, worker);
  }

  clearSession(ctx);
  await ctx.reply(
    [
      "Chek adminga yuborildi.",
      "Tekshiruvdan o'tgach, sizga xabar beriladi."
    ].join("\n"),
    employerMenu
  );
}

export function formatPaymentInstructions(payment: {
  payoutAmount: number;
  commissionAmount: number;
  totalAmount: number;
  cardNumber: string;
}, workerName: string): string {
  return [
    "Kunlik ish to'lovi",
    "",
    `Ishchi: ${workerName}`,
    `Karta raqami: ${payment.cardNumber}`,
    "",
    `Jami summa: ${formatMoney(payment.totalAmount)}`,
    `Bot komissiyasi (${env.commissionPercent}%): ${formatMoney(payment.commissionAmount)}`,
    `Ishchiga o'tkazish: ${formatMoney(payment.payoutAmount)}`,
    "",
    "Iltimos, yuqoridagi karta raqamiga ishchiga tegishli summani o'tkazing.",
    "Keyin to'lov chekini rasm sifatida yuboring."
  ].join("\n");
}

export function startPaymentReceiptSession(ctx: Context, paymentId: string): void {
  setSession(ctx, {
    flow: "payment",
    paymentId
  });
}
