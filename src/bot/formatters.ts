import { env } from "../config/env.js";
import type { FAQ, Job, Notification, Payment, Rating, User } from "../types.js";
import { maskCardNumber } from "../utils/validation.js";
import { formatMoney } from "../utils/payment.js";

export function formatJob(job: Job): string {
  return [
    `Holat: ${formatJobStatus(job.status || "open")}`,
    `Ish: ${job.title}`,
    `Joy: ${job.location}`,
    job.geoLocation ? `Lokatsiya: ${job.geoLocation}` : null,
    `Kunlik maosh: ${job.salary}`,
    job.salaryMin ? `Min maosh: ${job.salaryMin} so'm` : null,
    job.salaryMax ? `Max maosh: ${job.salaryMax} so'm` : null,
    job.workTime ? `Ish vaqti: ${job.workTime}` : null,
    job.meals ? `Ovqat: ${job.meals}` : null,
    `Ish turi: ${job.difficulty === "light" ? "Yengil ish" : "Og'ir ish"}`,
    `Muddat: ${job.jobType === "temporary" ? "Vaqtinchalik" : "Doimiy"}`,
    `Tajriba: ${formatExperienceLevel(job.experienceLevel)}`,
    "",
    job.description
  ].filter(Boolean).join("\n");
}

function formatExperienceLevel(level: string): string {
  if (level === "beginner") return "Boshlang'ich";
  if (level === "intermediate") return "O'rta";
  return "Ekspert";
}

export function formatJobStatus(status: Job["status"]): string {
  if (status === "pending") return "ko'rib chiqilmoqda";
  if (status === "open") return "bo'sh";
  if (status === "closed") return "band/yopilgan";
  return "rad etilgan";
}

export function formatChannelPost(job: Job): string {
  return [
    "🔥 Yangi ish!",
    `Holat: ${formatChannelJobStatus(job.status || "open")}`,
    "",
    `👷 ${job.title}`,
    `📍 ${job.location}`,
    job.geoLocation ? `🗺 ${job.geoLocation}` : null,
    `💰 ${job.salary}`,
    job.salaryMin ? `📉 Min: ${job.salaryMin} so'm` : null,
    job.salaryMax ? `📈 Max: ${job.salaryMax} so'm` : null,
    job.workTime ? `🕒 ${job.workTime}` : null,
    job.meals ? `🍽 ${job.meals}` : null,
    `⚒ ${job.difficulty === "light" ? "Yengil ish" : "Og'ir ish"}`,
    `⏱ ${job.jobType === "temporary" ? "Vaqtinchalik" : "Doimiy"}`,
    `🎯 ${formatExperienceLevel(job.experienceLevel)}`,
    "",
    `👉 Ariza yuborish: @${env.botUsername}`
  ].filter(Boolean).join("\n");
}

function formatChannelJobStatus(status: Job["status"]): string {
  if (status === "open") return "ochiq";
  if (status === "closed") return "yopildi";
  if (status === "pending") return "ko'rib chiqilmoqda";
  return "rad etildi";
}

export function formatUserProfile(user: User): string {
  return [
    `Ism: ${user.name}`,
    `Yosh: ${user.age || "kiritilmagan"}`,
    user.profession ? `Kasb: ${user.profession}` : null,
    user.photoFileId ? "Rasm: bor" : "Rasm: yo'q",
    `Telefon: ${user.phone}`,
    user.cardNumber ? `Karta: ${maskCardNumber(user.cardNumber)}` : "Karta: kiritilmagan",
    user.banned ? `Ban: ha (${user.banReason || "sabab ko'rsatilmagan"})` : null,
    `Rozilik: ${user.consentAccepted ? "olingan" : "olinmagan"}`,
    user.consentAcceptedAt ? `Rozilik vaqti: ${user.consentAcceptedAt}` : null,
    `Rol: ${user.role === "worker" ? "Ishchi" : "Ish beruvchi"}`,
    `Til: ${formatLanguage(user.language)}`,
    `Reyting: ${user.rating ? `${user.rating.toFixed(1)} (${user.ratingCount} ta baholash)` : "baholanmagan"}`
  ].filter(Boolean).join("\n");
}

function formatLanguage(lang: string): string {
  if (lang === "uz") return "O'zbek";
  if (lang === "ru") return "Rus";
  return "Ingliz";
}

export function formatEmployerApplication(job: Job, worker: User, message: string | null): string {
  return [
    "Yangi ariza!",
    "",
    `Ish: ${job.title}`,
    `Ishchi: ${worker.name}`,
    `Yosh: ${worker.age || "kiritilmagan"}`,
    worker.profession ? `Kasb: ${worker.profession}` : null,
    worker.photoFileId ? "Rasm: bor" : null,
    `Telefon: ${worker.phone}`,
    worker.cardNumber ? `Karta: ${worker.cardNumber}` : "Karta: kiritilmagan",
    message ? `Xabar: ${message}` : null
  ].filter(Boolean).join("\n");
}

export function formatApplication(worker: User | undefined, message: string | null, index: number): string {
  if (!worker) {
    return `${index}. Ishchi topilmadi`;
  }

  return [
    `${index}. ${worker.name}`,
    `Yosh: ${worker.age || "kiritilmagan"}`,
    worker.profession ? `Kasb: ${worker.profession}` : null,
    worker.photoFileId ? "Rasm: bor" : null,
    `Telefon: ${worker.phone}`,
    worker.cardNumber ? `Karta: ${maskCardNumber(worker.cardNumber)}` : "Karta: kiritilmagan",
    message ? `Xabar: ${message}` : null
  ].filter(Boolean).join("\n");
}

export function formatPayment(payment: Payment, jobTitle: string, workerName: string): string {
  return [
    `To'lov holati: ${formatPaymentStatus(payment.status)}`,
    `Ish: ${jobTitle}`,
    `Ishchi: ${workerName}`,
    `Karta: ${payment.cardNumber}`,
    `Jami: ${formatMoney(payment.totalAmount)}`,
    `Komissiya (${env.commissionPercent}%): ${formatMoney(payment.commissionAmount)}`,
    `Ishchiga: ${formatMoney(payment.payoutAmount)}`
  ].join("\n");
}

function formatPaymentStatus(status: Payment["status"]): string {
  if (status === "awaiting_receipt") return "chek kutilmoqda";
  if (status === "pending_review") return "admin tekshiruvida";
  if (status === "approved") return "tasdiqlangan";
  return "rad etilgan (soxta chek)";
}

export function formatNotification(notification: Notification): string {
  return [
    `🔔 ${notification.title}`,
    "",
    notification.body,
    notification.data ? `\n📅 ${new Date(notification.createdAt).toLocaleString("uz-UZ")}` : null
  ].filter(Boolean).join("\n");
}

export function formatRating(rating: Rating, fromUser: User, toUser: User): string {
  return [
    `⭐ Baholash: ${"⭐".repeat(rating.score)}`,
    `Kimdan: ${fromUser.name}`,
    `Kimga: ${toUser.name}`,
    rating.comment ? `Izoh: ${rating.comment}` : null,
    `📅 ${new Date(rating.createdAt).toLocaleString("uz-UZ")}`
  ].filter(Boolean).join("\n");
}

export function formatFAQ(faq: FAQ): string {
  return [
    `❓ ${faq.question}`,
    "",
    `💡 ${faq.answer}`,
    `📂 Kategoriya: ${faq.category}`
  ].filter(Boolean).join("\n");
}

export function formatHelpRequest(request: any, user: User): string {
  return [
    `🆘 Yordam so'rovi #${request.id}`,
    `Foydalanuvchi: ${user.name}`,
    `Xabar: ${request.message}`,
    `Holat: ${request.status === "pending" ? "Kutilmoqda" : "Hal qilingan"}`,
    request.adminResponse ? `Admin javobi: ${request.adminResponse}` : null,
    `📅 ${new Date(request.createdAt).toLocaleString("uz-UZ")}`
  ].filter(Boolean).join("\n");
}

export function formatAuditLog(log: any, user: User): string {
  return [
    `📋 Audit log`,
    `Foydalanuvchi: ${user.name}`,
    `Amal: ${log.action}`,
    `Obyekt turi: ${log.entityType}`,
    `Obyekt ID: ${log.entityId}`,
    log.changes ? `O'zgarishlar: ${JSON.stringify(log.changes)}` : null,
    log.ipAddress ? `IP: ${log.ipAddress}` : null,
    `📅 ${new Date(log.createdAt).toLocaleString("uz-UZ")}`
  ].filter(Boolean).join("\n");
}
