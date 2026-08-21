import { createBot } from "./bot/bot.js";
import { startServer } from "./server.js";

const bot = createBot();

await startServer(bot);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
