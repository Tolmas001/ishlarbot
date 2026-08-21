import express from "express";
import type { Telegraf } from "telegraf";
import { createApiRouter } from "./api/routes.js";
import { env } from "./config/env.js";

export async function startServer(bot: Telegraf): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use(createApiRouter(bot.telegram));

  if (env.webhookUrl) {
    app.use(await bot.createWebhook({ domain: env.webhookUrl }));
  }

  app.listen(env.port, async () => {
    if (env.webhookUrl) {
      console.log(`Server ${env.port}-portda webhook rejimida ishlayapti.`);
      return;
    }

    await bot.telegram.deleteWebhook();
    bot.launch();
    console.log(`Server ${env.port}-portda ishlayapti. Bot polling rejimida ishga tushdi.`);
  });
}
