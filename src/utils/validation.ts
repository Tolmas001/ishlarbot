export function requireText(value: string | undefined, fieldName: string): string {
  const text = value?.trim();

  if (!text) {
    throw new Error(`${fieldName} kiritilmagan.`);
  }

  return text;
}

export function parseAge(value: string): number | null {
  const age = Number(value.trim());

  if (!Number.isInteger(age) || age < env.minAge || age > env.maxAge) {
    return null;
  }

  return age;
}
import { env } from "../config/env.js";
