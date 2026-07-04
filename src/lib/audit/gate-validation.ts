import { z } from "zod";

const BLOCKED_PHONES = new Set([
  "5555555555",
  "0000000000",
  "1111111111",
  "1234567890",
  "9999999999",
]);

const BLOCKED_EMAIL_DOMAINS = [
  "test.com",
  "example.com",
  "fake.com",
  "mailinator.com",
  "tempmail.com",
];

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function isRepeatingDigits(digits: string): boolean {
  return /^(\d)\1{9}$/.test(digits);
}

export const gateSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Enter your real first name (at least 2 letters).")
    .max(50)
    .regex(/^[a-zA-Z][a-zA-Z\s'-]+$/, "First name must contain only letters."),
  lastName: z
    .string()
    .trim()
    .min(2, "Enter your real last name (at least 2 letters).")
    .max(50)
    .regex(/^[a-zA-Z][a-zA-Z\s'-]+$/, "Last name must contain only letters."),
  phone: z
    .string()
    .trim()
    .refine((val) => normalizePhone(val).length === 10, "Enter a valid 10-digit US mobile number.")
    .refine((val) => {
      const digits = normalizePhone(val);
      if (BLOCKED_PHONES.has(digits)) return false;
      if (isRepeatingDigits(digits)) return false;
      if (digits.startsWith("555") && digits.slice(3, 6) === "555") return false;
      return true;
    }, "That phone number doesn't look valid. Use your real mobile number."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .refine((val) => {
      const domain = val.split("@")[1]?.toLowerCase() ?? "";
      if (BLOCKED_EMAIL_DOMAINS.some((d) => domain === d)) return false;
      const local = val.split("@")[0] ?? "";
      if (/^555+$/.test(local)) return false;
      if (local.length < 2) return false;
      return true;
    }, "Use a real email where we can send your blueprint."),
});

export function validateGateClient(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}): string | null {
  const result = gateSchema.safeParse(data);
  if (result.success) return null;
  return result.error.errors[0]?.message ?? "Invalid contact information.";
}
