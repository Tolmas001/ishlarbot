import type { Context } from "telegraf";
import { findUsersByTelegramId } from "../database/jsonDb.js";
import { getUserId } from "./context.js";
import { menuFor, startMenu } from "./keyboards.js";
import { clearSession } from "./sessionStore.js";

export async function goBackToMenu(ctx: Context): Promise<void> {
  clearSession(ctx);
  const users = await findUsersByTelegramId(getUserId(ctx));
  const user = users[0];

  if (users.length !== 1 || !user) {
    await ctx.reply("Asosiy menyuga qaytdingiz. Rolingizni tanlang:", startMenu);
    return;
  }

  await ctx.reply("Asosiy menyuga qaytdingiz.", menuFor(user.role));
}
