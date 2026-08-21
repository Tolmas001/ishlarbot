import { env } from "../config/env.js";
import type { Job, User } from "../types.js";

export function formatJob(job: Job): string {
  return [
    `Holat: ${formatJobStatus(job.status || "open")}`,
    `Ish: ${job.title}`,
    `Joy: ${job.location}`,
    job.geoLocation ? `Lokatsiya: ${job.geoLocation}` : null,
    `Kunlik maosh: ${job.salary}`,
    job.workTime ? `Ish vaqti: ${job.workTime}` : null,
    job.meals ? `Ovqat: ${job.meals}` : null,
    `Ish turi: ${job.difficulty === "light" ? "Yengil ish" : "Og'ir ish"}`,
    "",
    job.description
  ].filter(Boolean).join("\n");
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
    job.workTime ? `🕒 ${job.workTime}` : null,
    job.meals ? `🍽 ${job.meals}` : null,
    `⚒ ${job.difficulty === "light" ? "Yengil ish" : "Og'ir ish"}`,
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
    `Rozilik: ${user.consentAccepted ? "olingan" : "olinmagan"}`,
    user.consentAcceptedAt ? `Rozilik vaqti: ${user.consentAcceptedAt}` : null,
    `Rol: ${user.role === "worker" ? "Ishchi" : "Ish beruvchi"}`
  ].filter(Boolean).join("\n");
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
    message ? `Xabar: ${message}` : null
  ].filter(Boolean).join("\n");
}
