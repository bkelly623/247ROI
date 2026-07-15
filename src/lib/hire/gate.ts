import { z } from "zod";

const BLOCKED_PHONES = new Set([
  "5555555555",
  "0000000000",
  "1111111111",
  "1234567890",
  "9999999999",
]);

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function isRepeatingDigits(digits: string): boolean {
  return /^(\d)\1{9}$/.test(digits);
}

const phoneField = z
  .string()
  .trim()
  .refine((val) => normalizePhone(val).length === 10, "Enter a valid 10-digit US mobile number.")
  .refine((val) => {
    const digits = normalizePhone(val);
    if (BLOCKED_PHONES.has(digits)) return false;
    if (isRepeatingDigits(digits)) return false;
    if (digits.startsWith("555") && digits.slice(3, 6) === "555") return false;
    return true;
  }, "That phone number doesn't look valid.");

/** Hire unlock gate: first name + phone required. Email optional. */
export const hireGateSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Enter your first name (at least 2 letters).")
    .max(50)
    .regex(/^[a-zA-Z][a-zA-Z\s'-]+$/, "First name must contain only letters."),
  lastName: z.string().trim().max(50).default(""),
  phone: phoneField,
  email: z
    .string()
    .trim()
    .default("")
    .refine((val) => {
      if (!val) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }, "Enter a valid email, or leave it blank."),
});

export function validateHireGateClient(data: {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
}): string | null {
  const result = hireGateSchema.safeParse({
    firstName: data.firstName,
    lastName: data.lastName ?? "",
    phone: data.phone,
    email: data.email ?? "",
  });
  if (result.success) return null;
  return result.error.errors[0]?.message ?? "Invalid contact information.";
}

export type HireGateContact = z.infer<typeof hireGateSchema>;
