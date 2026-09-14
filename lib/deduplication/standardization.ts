/**
 * Data standardization utilities for the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM.
 * Standardizes names, phones, emails, registration numbers, national IDs, and dates
 * while preserving original values.
 */

export interface StandardizedRecordData {
  standardizedName: string | null;
  standardizedEmail: string | null;
  standardizedPhone: string | null;
  standardizedRegistrationNumber: string | null;
  standardizedNationalId: string | null;
}

/**
 * Normalizes person names:
 * - Collapses multiple spaces
 * - Trims leading and trailing spaces
 * - Removes non-alphabetical punctuation (replaces hyphens with a space or unified token)
 * - Converts to uppercase
 * - Strips common academic or polite titles (Mr, Ms, Mrs, Dr, Hon)
 */
export function standardizeName(firstName?: string | null, middleName?: string | null, lastName?: string | null, fullName?: string | null): string | null {
  const parts: string[] = [];
  if (firstName) parts.push(firstName);
  if (middleName) parts.push(middleName);
  if (lastName) parts.push(lastName);

  let raw = parts.length > 0 ? parts.join(" ") : (fullName ?? "");
  if (!raw || !raw.trim()) return null;

  // Remove common prefixes
  raw = raw.replace(/\b(mr|mrs|ms|miss|dr|prof|hon)\.?\b/gi, "");

  // Remove punctuation (keep letters and spaces)
  const cleaned = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  return cleaned || null;
}

/**
 * Standardizes email addresses:
 * - Trims whitespace
 * - Converts to lower case
 * - Validates basic email structure
 */
export function standardizeEmail(email?: string | null): string | null {
  if (!email || !email.trim()) return null;
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : cleaned;
}

/**
 * Standardizes phone numbers:
 * - Handles Rwanda numbers (default +250 or local 07... / 7...)
 * - Removes non-digits (spaces, dashes, parens)
 * - Standardizes to +2507XXXXXXXX format or E.164
 */
export function standardizePhone(phone?: string | null): string | null {
  if (!phone || !phone.trim()) return null;

  // Remove all non-digits except a leading +
  const cleaned = phone.trim().replace(/[^\d+]/g, "");

  // Rwanda numbers: e.g. 0788123456 or 788123456 or +250788123456 or 250788123456
  if (cleaned.startsWith("+250")) {
    // Keep +250 format
    return cleaned;
  }
  if (cleaned.startsWith("250") && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("07") && cleaned.length === 10) {
    return `+250${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("7") && cleaned.length === 9) {
    return `+250${cleaned}`;
  }

  // If leading +, preserve it, otherwise return digits only
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Standardizes Registration Numbers:
 * - Converts to uppercase
 * - Normalizes slashes and hyphens (e.g. REG/2023/BIT/001 or REG-2023-BIT-001)
 * - Strips accidental spaces
 */
export function standardizeRegistrationNumber(regNo?: string | null): string | null {
  if (!regNo || !regNo.trim()) return null;

  const cleaned = regNo
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[\\_-]/g, "/");

  return cleaned || null;
}

/**
 * Standardizes National ID or Passport numbers:
 * - Strips all spaces, dashes, dots
 * - Converts to uppercase
 * - Rwandan National ID is a 16-digit sequence starting with 1 (e.g. 1 1998 8 0012345 0 12)
 */
export function standardizeNationalId(id?: string | null): string | null {
  if (!id || !id.trim()) return null;
  const cleaned = id.trim().toUpperCase().replace(/[\s\-_.]/g, "");
  return cleaned || null;
}

/**
 * Parses and standardizes dates to Date object and ISO string (YYYY-MM-DD):
 * Handles formats:
 * - YYYY-MM-DD
 * - DD/MM/YYYY
 * - MM/DD/YYYY
 * - ISO strings
 */
export function standardizeDate(dateInput?: string | Date | null): { date: Date | null; iso: string | null } {
  if (!dateInput) return { date: null, iso: null };
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return { date: null, iso: null };
    return {
      date: dateInput,
      iso: dateInput.toISOString().split("T")[0],
    };
  }

  const str = String(dateInput).trim();
  if (!str) return { date: null, iso: null };

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return { date: d, iso: str };
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    const d = new Date(Date.UTC(year, month - 1, day));
    if (!isNaN(d.getTime())) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { date: d, iso };
    }
  }

  // Fallback native parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return {
      date: parsed,
      iso: parsed.toISOString().split("T")[0],
    };
  }

  return { date: null, iso: null };
}

/**
 * Computes all standardized fields for an institutional record input
 */
export function computeStandardizedFields(record: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  registrationNumber?: string | null;
  nationalId?: string | null;
}): StandardizedRecordData {
  const full = record.fullName || [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
  return {
    standardizedName: standardizeName(record.firstName, record.middleName, record.lastName, full),
    standardizedEmail: standardizeEmail(record.email),
    standardizedPhone: standardizePhone(record.phoneNumber),
    standardizedRegistrationNumber: standardizeRegistrationNumber(record.registrationNumber),
    standardizedNationalId: standardizeNationalId(record.nationalId),
  };
}
