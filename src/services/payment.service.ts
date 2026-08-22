import type { Telegram } from "telegraf";
import {
  createPayment,
  findActivePaymentByApplication,
  findApplication,
  findJob,
  findUserById
} from "../database/jsonDb.js";
import type { Job, Payment, User } from "../types.js";
import { calculatePaymentBreakdown } from "../utils/payment.js";
import { parseSalaryAmount } from "../utils/validation.js";
import { env } from "../config/env.js";

export type StartPaymentResult =
  | { ok: true; payment: Payment; worker: User; job: Job }
  | { ok: false; reason: "application_not_found" | "job_not_found" | "worker_not_found" | "no_card" | "invalid_salary" | "already_exists"; payment?: Payment };

export async function startPaymentForApplication(
  applicationId: string,
  employerTelegramId: string
): Promise<StartPaymentResult> {
  const application = await findApplication(applicationId);

  if (!application) {
    return { ok: false, reason: "application_not_found" };
  }

  const job = await findJob(application.jobId);

  if (!job || job.employerTelegramId !== employerTelegramId) {
    return { ok: false, reason: "job_not_found" };
  }

  const worker = await findUserById(application.userId);

  if (!worker) {
    return { ok: false, reason: "worker_not_found" };
  }

  if (!worker.cardNumber) {
    return { ok: false, reason: "no_card" };
  }

  const totalAmount = parseSalaryAmount(job.salary);

  if (!totalAmount) {
    return { ok: false, reason: "invalid_salary" };
  }

  const existingPayment = await findActivePaymentByApplication(applicationId);

  if (existingPayment) {
    return { ok: false, reason: "already_exists", payment: existingPayment };
  }

  const breakdown = calculatePaymentBreakdown(totalAmount);
  const payment = await createPayment({
    jobId: job.id,
    applicationId: application.id,
    workerId: worker.id,
    employerTelegramId,
    totalAmount: breakdown.totalAmount,
    commissionAmount: breakdown.commissionAmount,
    payoutAmount: breakdown.payoutAmount,
    cardNumber: worker.cardNumber
  });

  return { ok: true, payment, worker, job };
}

export async function notifyAdminsAboutReceipt(
  telegram: Telegram,
  payment: Payment,
  job: Job,
  worker: User
): Promise<void> {
  const text = [
    "Yangi to'lov cheki tekshiruvga keldi",
    "",
    `Ish: ${job.title}`,
    `Ishchi: ${worker.name}`,
    `Karta: ${payment.cardNumber}`,
    `Jami: ${payment.totalAmount.toLocaleString("uz-UZ")} so'm`,
    `Komissiya (${env.commissionPercent}%): ${payment.commissionAmount.toLocaleString("uz-UZ")} so'm`,
    `Ishchiga: ${payment.payoutAmount.toLocaleString("uz-UZ")} so'm`
  ].join("\n");

  for (const adminId of env.adminIds) {
    await telegram.sendPhoto(adminId, payment.receiptFileId!, {
      caption: text
    }).catch(() => undefined);

    await telegram.sendMessage(adminId, "Chekni tekshiring:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Chek to'g'ri", callback_data: `payment_approve:${payment.id}` },
            { text: "Soxta chek - ban", callback_data: `payment_reject:${payment.id}` }
          ]
        ]
      }
    }).catch(() => undefined);
  }
}
