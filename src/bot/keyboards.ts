import { Markup } from "telegraf";
import type { UserRole } from "../types.js";

export const startMenu = Markup.keyboard([["Ishchi", "Ish beruvchi"]]).resize();

export const workerMenu = Markup.keyboard([
  ["Ishlarni ko'rish"],
  ["Hudud bo'yicha qidirish"],
  ["Mening ma'lumotim"],
  ["Ishchi ma'lumotini o'zgartirish"]
]).resize();

export const employerMenu = Markup.keyboard([
  ["Ish qo'shish"],
  ["Mening e'lonlarim"],
  ["Ishlarni ko'rish"],
  ["Ish beruvchi ma'lumotini o'zgartirish"]
]).resize();

export const adminMenu = Markup.keyboard([
  ["Statistika"],
  ["Barcha userlar"],
  ["Barcha e'lonlar"],
  ["Ish qo'shish"],
  ["Ishlarni ko'rish"]
]).resize();

export const backMenu = Markup.keyboard([["Qaytish"]]).resize();

export const consentKeyboard = Markup.keyboard([["Roziman"], ["Rozi emasman"], ["Qaytish"]]).resize();

export const skipWorkTimeKeyboard = Markup.keyboard([["O'tkazib yuborish"], ["Qaytish"]]).resize();

export const skipLocationKeyboard = Markup.keyboard([["Lokatsiya yo'q"], ["Qaytish"]]).resize();

export const difficultyKeyboard = Markup.keyboard([["Yengil ish"], ["Og'ir ish"], ["Qaytish"]]).resize();

export const skipPhotoKeyboard = Markup.keyboard([["Rasm qo'shmaslik"], ["Qaytish"]]).resize();

export const phoneKeyboard = Markup.keyboard([
  [Markup.button.contactRequest("Telefon raqamni yuborish")],
  ["Qaytish"]
]).resize();

export function menuFor(role: UserRole) {
  return role === "worker" ? workerMenu : employerMenu;
}
