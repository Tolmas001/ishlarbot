import type { Context } from "telegraf";
import { getFAQs, createFAQ } from "../../database/jsonDb.js";
import { findUserByTelegramId } from "../../database/jsonDb.js";
import { formatFAQ } from "../formatters.js";
import { getUserId } from "../context.js";
import { backMenu } from "../keyboards.js";
import { isAdmin } from "../guards.js";

export async function sendFAQs(ctx: Context): Promise<void> {
  const user = await findUserByTelegramId(getUserId(ctx));
  if (!user) {
    await ctx.reply("Avval ro'yxatdan o'ting.");
    return;
  }

  const faqs = await getFAQs(user.language);

  if (!faqs.length) {
    await ctx.reply("Hozircha FAQ yo'q.");
    return;
  }

  await ctx.reply("Tez-tez so'raladigan savollar:");

  for (const faq of faqs) {
    await ctx.reply(formatFAQ(faq));
  }
}

export async function sendAdminFAQManagement(ctx: Context): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply("Faqat adminlar uchun.");
    return;
  }

  const faqs = await getFAQs("uz");

  if (!faqs.length) {
    await ctx.reply("Hozircha FAQ yo'q. Yangi FAQ qo'shish uchun /add_faq buyrug'ini ishlating.");
    return;
  }

  await ctx.reply(`Mavjud FAQlar (${faqs.length} ta):`);

  for (const faq of faqs) {
    await ctx.reply(formatFAQ(faq));
  }
}

export async function addFAQ(ctx: Context, question: string, answer: string, category: string, language: string = "uz"): Promise<void> {
  if (!isAdmin(ctx)) {
    await ctx.reply("Faqat adminlar uchun.");
    return;
  }

  const faqs = await getFAQs(language);
  const order = faqs.length + 1;

  await createFAQ({
    question,
    answer,
    category,
    language: language as any,
    order
  });

  await ctx.reply("FAQ muvaffaqiyatli qo'shildi.");
}
