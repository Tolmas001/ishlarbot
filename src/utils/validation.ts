import { env } from "../config/env.js";

export function requireText(value: string | undefined, fieldName: string): string {
  const text = value?.trim();

  if (!text) {
    throw new Error(`${fieldName} kiritilmagan.`);
  }

  if (text.length < 2) {
    throw new Error(`${fieldName} juda qisqa. Kamida 2 ta belgi bo'lishi kerak.`);
  }

  if (text.length > 200) {
    throw new Error(`${fieldName} juda uzun. Maksimum 200 ta belgi bo'lishi mumkin.`);
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

export function parseCardNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 16) {
    return null;
  }

  // Luhn algorithm for card validation
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return null;
  }

  return digits;
}

export function parseSalaryAmount(value: string): number | null {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const amount = Number(digits);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (amount > 100000000) {
    return null; // Max 100 million
  }

  return amount;
}

export function validatePhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '')
    .trim();
}

export function validateJobTitle(title: string): boolean {
  return title.length >= 3 && title.length <= 100;
}

export function validateJobDescription(description: string): boolean {
  return description.length >= 10 && description.length <= 2000;
}

export function validateLocation(location: string): boolean {
  return location.length >= 2 && location.length <= 100;
}

export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length !== 16) {
    return cardNumber;
  }

  return `${cardNumber.slice(0, 4)} **** **** ${cardNumber.slice(12)}`;
}
