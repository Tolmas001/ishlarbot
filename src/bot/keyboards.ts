import { Markup } from "telegraf";
import type { UserRole } from "../types.js";

export const startMenu = Markup.keyboard([["Ishchi", "Ish beruvchi"]]).resize();

export const workerMenu = Markup.keyboard([
  ["Ishlarni ko'rish"],
  ["Saqlangan ishlar"],
  ["Hudud bo'yicha qidirish"],
  ["Filtrlar"],
  ["Mening ma'lumotim"],
  ["Xabarlar"],
  ["Bildirishnomalar"],
  ["Karta raqamini o'zgartirish"],
  ["Ishchi ma'lumotini o'zgartirish"],
  ["Tilni o'zgartirish"],
  ["FAQ"],
  ["Yordam"]
]).resize();

export const employerMenu = Markup.keyboard([
  ["Ish qo'shish"],
  ["Mening e'lonlarim"],
  ["Ishlarni ko'rish"],
  ["Xabarlar"],
  ["Bildirishnomalar"],
  ["Ish beruvchi ma'lumotini o'zgartirish"],
  ["Tilni o'zgartirish"],
  ["FAQ"],
  ["Yordam"]
]).resize();

export const adminMenu = Markup.keyboard([
  ["Statistika"],
  ["Barcha userlar"],
  ["Barcha e'lonlar"],
  ["To'lov cheklari"],
  ["Yordam so'rovlari"],
  ["Audit loglar"],
  ["Ish qo'shish"],
  ["Ishlarni ko'rish"],
  ["FAQ boshqarish"]
]).resize();

export const backMenu = Markup.keyboard([["Qaytish"]]).resize();

export const consentKeyboard = Markup.keyboard([["Roziman"], ["Rozi emasman"], ["Qaytish"]]).resize();

export const skipWorkTimeKeyboard = Markup.keyboard([["O'tkazib yuborish"], ["Qaytish"]]).resize();

export const skipLocationKeyboard = Markup.keyboard([["Lokatsiya yo'q"], ["Qaytish"]]).resize();

export const difficultyKeyboard = Markup.keyboard([["Yengil ish"], ["Og'ir ish"], ["Qaytish"]]).resize();

export const jobTypeKeyboard = Markup.keyboard([["Vaqtinchalik"], ["Doimiy"], ["Qaytish"]]).resize();

export const experienceLevelKeyboard = Markup.keyboard([["Boshlang'ich"], ["O'rta"], ["Ekspert"], ["Qaytish"]]).resize();

export const languageKeyboard = Markup.keyboard([["O'zbek"], ["Rus"], ["Ingliz"], ["Qaytish"]]).resize();

export const filterMenuKeyboard = Markup.keyboard([
  ["Maosh bo'yicha"],
  ["Ish turi bo'yicha"],
  ["Tajriba darajasi"],
  ["Qiyinchilik darajasi"],
  ["Filtrlarni tozalash"],
  ["Qaytish"]
]).resize();

export const ratingKeyboard = Markup.keyboard([
  ["⭐ 1"], ["⭐ 2"], ["⭐ 3"], ["⭐ 4"], ["⭐ 5"],
  ["Qaytish"]
]).resize();

export const skipPhotoKeyboard = Markup.keyboard([["Rasm qo'shmaslik"], ["Qaytish"]]).resize();

export const phoneKeyboard = Markup.keyboard([
  [Markup.button.contactRequest("Telefon raqamni yuborish")],
  ["Qaytish"]
]).resize();

export function menuFor(role: UserRole) {
  return role === "worker" ? workerMenu : employerMenu;
}
