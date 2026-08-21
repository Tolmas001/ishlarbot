import "dotenv/config";

export const env = {
  botToken: requireEnv("BOT_TOKEN"),
  port: Number(process.env.PORT || 3000),
  webhookUrl: process.env.WEBHOOK_URL,
  channelId: process.env.CHANNEL_ID,
  botUsername: process.env.BOT_USERNAME || "botname",
  adminIds: parseList(process.env.ADMIN_IDS),
  minAge: Number(process.env.MIN_AGE || 16),
  maxAge: Number(process.env.MAX_AGE || 100)
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} topilmadi. .env faylga qiymat yozing.`);
  }

  return value;
}

function parseList(value: string | undefined): string[] {
  return value
    ? value.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}
