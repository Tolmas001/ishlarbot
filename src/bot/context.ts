import type { Context } from "telegraf";

export function getUserId(ctx: Context): string {
  if (!ctx.from?.id) {
    throw new Error("Telegram foydalanuvchi ID topilmadi.");
  }

  return String(ctx.from.id);
}

export function getText(ctx: Context): string {
  if (!ctx.message || !("text" in ctx.message)) {
    return "";
  }

  return ctx.message.text.trim();
}

export function getPhone(ctx: Context): string {
  if (!ctx.message) {
    return "";
  }

  if ("contact" in ctx.message && ctx.message.contact?.phone_number) {
    return ctx.message.contact.phone_number;
  }

  if ("text" in ctx.message) {
    return ctx.message.text.trim();
  }

  return "";
}

export function getPhotoFileId(ctx: Context): string | null {
  if (!ctx.message || !("photo" in ctx.message)) {
    return null;
  }

  const photos = ctx.message.photo;
  return photos.at(-1)?.file_id || null;
}

export function getLocationText(ctx: Context): string | null {
  if (!ctx.message || !("location" in ctx.message) || !ctx.message.location) {
    return null;
  }

  const { latitude, longitude } = ctx.message.location;
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}
