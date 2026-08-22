import { env } from "../config/env.js";

export type PaymentBreakdown = {
  totalAmount: number;
  commissionAmount: number;
  payoutAmount: number;
  commissionPercent: number;
};

export function calculatePaymentBreakdown(totalAmount: number): PaymentBreakdown {
  const commissionAmount = Math.round(totalAmount * env.commissionPercent / 100);
  const payoutAmount = totalAmount - commissionAmount;

  return {
    totalAmount,
    commissionAmount,
    payoutAmount,
    commissionPercent: env.commissionPercent
  };
}

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString("uz-UZ")} so'm`;
}
