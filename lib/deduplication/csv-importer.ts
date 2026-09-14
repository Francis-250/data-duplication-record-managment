import { standardizeDate } from "./standardization";

export interface CsvValidationError {
  row: number;
  field: string;
  value: string;
  reason: string;
}

export interface ParsedStudentRow {
  rowNumber: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  gender?: string | null;
  dateOfBirth?: Date | null;
  nationalId?: string | null;
  passportNumber?: string | null;
  registrationNumber?: string | null;
  applicantNumber?: string | null;
  staffNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  programme?: string | null;
  department?: string | null;
  faculty?: string | null;
  campus?: string | null;
  intake?: string | null;
  academicYear?: string | null;
  address?: string | null;
  recordSource?: string | null;
}

export interface CsvImportAnalysis {
  isValid: boolean;
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRowsCount: number;
  duplicateRowsCount: number;
  errors: CsvValidationError[];
  duplicateRowNumbers: number[];
}

/**
 * Robust CSV Line Splitter handling quotes, commas, and escapes
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Canonical column header aliases
 */
const HEADER_ALIASES: Record<string, string> = {
  // First Name
  firstname: "firstName",
  first_name: "firstName",
  "first name": "firstName",
  fname: "firstName",
  prenom: "firstName",

  // Middle Name
  middlename: "middleName",
  middle_name: "middleName",
  "middle name": "middleName",
  mname: "middleName",

  // Last Name
  lastname: "lastName",
  last_name: "lastName",
  "last name": "lastName",
  lname: "lastName",
  surname: "lastName",
  nom: "lastName",

  // Full Name
  fullname: "fullName",
  full_name: "fullName",
  "full name": "fullName",
  name: "fullName",

  // Gender
  gender: "gender",
  sex: "gender",

  // Date of Birth
  dateofbirth: "dateOfBirth",
  date_of_birth: "dateOfBirth",
  "date of birth": "dateOfBirth",
  dob: "dateOfBirth",
  birthdate: "dateOfBirth",

  // National ID / Passport
  nationalid: "nationalId",
  national_id: "nationalId",
  "national id": "nationalId",
  nid: "nationalId",
  idnumber: "nationalId",
  id_number: "nationalId",
  passport: "passportNumber",
  passportnumber: "passportNumber",
  passport_number: "passportNumber",

  // Registration Number
  registrationnumber: "registrationNumber",
  registration_number: "registrationNumber",
  "registration number": "registrationNumber",
  regnumber: "registrationNumber",
  reg_number: "registrationNumber",
  regno: "registrationNumber",
  reg_no: "registrationNumber",
  student_id: "registrationNumber",
  studentid: "registrationNumber",

  // Applicant Number
  applicantnumber: "applicantNumber",
  applicant_number: "applicantNumber",
  application_no: "applicantNumber",

  // Email
  email: "email",
  emailaddress: "email",
  email_address: "email",
  "email address": "email",

  // Phone
  phone: "phoneNumber",
  phonenumber: "phoneNumber",
  phone_number: "phoneNumber",
  "phone number": "phoneNumber",
  telephone: "phoneNumber",
  mobile: "phoneNumber",

  // Academic details
  programme: "programme",
  program: "programme",
  course: "programme",
  department: "department",
  faculty: "faculty",
  campus: "campus",
  intake: "intake",
  academicyear: "academicYear",
  academic_year: "academicYear",
  "academic year": "academicYear",
  address: "address",
  recordsource: "recordSource",
  record_source: "recordSource",
  source: "recordSource",
};

/**
 * Validates and parses raw CSV content for student records
 */
export function parseAndValidateCsv(csvContent: string, sourceName = "CSV Import"): CsvImportAnalysis {
  const lines = csvContent.split(/\r?\n/);
  const errors: CsvValidationError[] = [];
  const validRows: ParsedStudentRow[] = [];
  const duplicateRowNumbers: number[] = [];

  if (lines.length === 0 || !csvContent.trim()) {
    return {
      isValid: false,
      totalRows: 0,
      validRows: [],
      invalidRowsCount: 0,
      duplicateRowsCount: 0,
      errors: [{ row: 0, field: "file", value: "", reason: "Uploaded CSV file is completely empty." }],
      duplicateRowNumbers: [],
    };
  }

  // Find header row (skip leading blank lines)
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      isValid: false,
      totalRows: 0,
      validRows: [],
      invalidRowsCount: 0,
      duplicateRowsCount: 0,
      errors: [{ row: 0, field: "header", value: "", reason: "No header row found." }],
      duplicateRowNumbers: [],
    };
  }

  const rawHeaders = parseCsvLine(lines[headerIndex]);
  const mappedHeaders: (string | null)[] = rawHeaders.map((h) => {
    const clean = h.trim().toLowerCase();
    return HEADER_ALIASES[clean] || null;
  });

  const hasFirstName = mappedHeaders.includes("firstName");
  const hasLastName = mappedHeaders.includes("lastName");
  const hasFullName = mappedHeaders.includes("fullName");

  if (!((hasFirstName && hasLastName) || hasFullName)) {
    errors.push({
      row: headerIndex + 1,
      field: "headers",
      value: rawHeaders.join(", "),
      reason: "Missing required name columns (Requires 'firstName' and 'lastName', or 'fullName').",
    });
    return {
      isValid: false,
      totalRows: 0,
      validRows: [],
      invalidRowsCount: 0,
      duplicateRowsCount: 0,
      errors,
      duplicateRowNumbers: [],
    };
  }

  // Track in-file duplicates using standardized identifiers
  const seenNationalIds = new Map<string, number>();
  const seenRegNumbers = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  const seenNamePhone = new Map<string, number>();
  let dataRowCount = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const rowNum = i + 1;

    // Detect empty row
    if (!rawLine.trim()) {
      continue; // skip whitespace rows gracefully
    }

    dataRowCount++;
    const values = parseCsvLine(rawLine);
    const rowData: Record<string, string> = {};

    mappedHeaders.forEach((colKey, colIdx) => {
      if (colKey && values[colIdx] !== undefined) {
        rowData[colKey] = values[colIdx].trim();
      }
    });

    // Row validations
    let rowHasError = false;

    // 1. Name validation
    let firstName = rowData.firstName || "";
    let lastName = rowData.lastName || "";
    const middleName = rowData.middleName || null;
    let fullName = rowData.fullName || "";

    if (!fullName && firstName && lastName) {
      fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
    } else if (fullName && (!firstName || !lastName)) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      } else {
        firstName = fullName;
        lastName = fullName;
      }
    }

    if (!firstName) {
      errors.push({
        row: rowNum,
        field: "firstName",
        value: "",
        reason: "First name is missing.",
      });
      rowHasError = true;
    }

    if (!lastName) {
      errors.push({
        row: rowNum,
        field: "lastName",
        value: "",
        reason: "Last name is missing.",
      });
      rowHasError = true;
    }

    // 2. Email validation (if provided)
    if (rowData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rowData.email)) {
        errors.push({
          row: rowNum,
          field: "email",
          value: rowData.email,
          reason: "Invalid email address format.",
        });
        rowHasError = true;
      }
    }

    // 3. Phone validation (if provided)
    if (rowData.phoneNumber) {
      const phoneDigits = rowData.phoneNumber.replace(/[^\d]/g, "");
      if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        errors.push({
          row: rowNum,
          field: "phoneNumber",
          value: rowData.phoneNumber,
          reason: "Phone number must contain between 8 and 15 digits.",
        });
        rowHasError = true;
      }
    }

    // 4. Date of Birth validation (if provided)
    let parsedDob: Date | null = null;
    if (rowData.dateOfBirth) {
      const stdDob = standardizeDate(rowData.dateOfBirth);
      if (!stdDob.date) {
        errors.push({
          row: rowNum,
          field: "dateOfBirth",
          value: rowData.dateOfBirth,
          reason: "Invalid date format. Expected YYYY-MM-DD or DD/MM/YYYY.",
        });
        rowHasError = true;
      } else {
        parsedDob = stdDob.date;
      }
    }

    // 5. In-file duplicate detection
    const cleanNationalId = rowData.nationalId?.replace(/[\s\-_]/g, "").toUpperCase();
    const cleanRegNumber = rowData.registrationNumber?.replace(/[\s\-_/.]/g, "").toUpperCase();
    const cleanEmail = rowData.email?.trim().toLowerCase();
    const cleanPhone = rowData.phoneNumber?.replace(/[^\d]/g, "");
    const cleanNameTokens = (fullName || `${firstName} ${lastName}`)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .sort()
      .join(" ");

    let duplicateOfRow: number | null = null;
    let duplicateReason = "";

    if (cleanNationalId && cleanNationalId.length >= 8 && seenNationalIds.has(cleanNationalId)) {
      duplicateOfRow = seenNationalIds.get(cleanNationalId)!;
      duplicateReason = `matches row ${duplicateOfRow} on National ID (${rowData.nationalId})`;
    } else if (cleanRegNumber && cleanRegNumber.length >= 4 && seenRegNumbers.has(cleanRegNumber)) {
      duplicateOfRow = seenRegNumbers.get(cleanRegNumber)!;
      duplicateReason = `matches row ${duplicateOfRow} on Registration Number (${rowData.registrationNumber})`;
    } else if (cleanEmail && cleanEmail.includes("@") && seenEmails.has(cleanEmail)) {
      duplicateOfRow = seenEmails.get(cleanEmail)!;
      duplicateReason = `matches row ${duplicateOfRow} on Email (${rowData.email})`;
    } else if (cleanNameTokens && cleanPhone && cleanPhone.length >= 8) {
      const namePhoneKey = `${cleanNameTokens}|${cleanPhone.slice(-8)}`;
      if (seenNamePhone.has(namePhoneKey)) {
        duplicateOfRow = seenNamePhone.get(namePhoneKey)!;
        duplicateReason = `matches row ${duplicateOfRow} on student name & phone number`;
      }
    }

    if (duplicateOfRow !== null) {
      duplicateRowNumbers.push(rowNum);
      errors.push({
        row: rowNum,
        field: "row",
        value: `Duplicate of row ${duplicateOfRow}`,
        reason: `In-file duplicate: ${duplicateReason}.`,
      });
      rowHasError = true;
    } else {
      if (cleanNationalId && cleanNationalId.length >= 8) seenNationalIds.set(cleanNationalId, rowNum);
      if (cleanRegNumber && cleanRegNumber.length >= 4) seenRegNumbers.set(cleanRegNumber, rowNum);
      if (cleanEmail && cleanEmail.includes("@")) seenEmails.set(cleanEmail, rowNum);
      if (cleanNameTokens && cleanPhone && cleanPhone.length >= 8) {
        seenNamePhone.set(`${cleanNameTokens}|${cleanPhone.slice(-8)}`, rowNum);
      }
    }

    if (!rowHasError) {
      validRows.push({
        rowNumber: rowNum,
        firstName,
        middleName,
        lastName,
        fullName: fullName || `${firstName} ${lastName}`,
        gender: rowData.gender || null,
        dateOfBirth: parsedDob,
        nationalId: rowData.nationalId || null,
        passportNumber: rowData.passportNumber || null,
        registrationNumber: rowData.registrationNumber || null,
        applicantNumber: rowData.applicantNumber || null,
        staffNumber: rowData.staffNumber || null,
        email: rowData.email || null,
        phoneNumber: rowData.phoneNumber || null,
        programme: rowData.programme || null,
        department: rowData.department || null,
        faculty: rowData.faculty || null,
        campus: rowData.campus || "Kigali Campus",
        intake: rowData.intake || null,
        academicYear: rowData.academicYear || "2024/2025",
        address: rowData.address || null,
        recordSource: rowData.recordSource || sourceName,
      });
    }
  }

  const invalidRowsCount = errors.filter((e) => !e.reason.includes("In-file duplicate")).length;
  const duplicateRowsCount = duplicateRowNumbers.length;

  return {
    isValid: errors.length === 0,
    totalRows: dataRowCount,
    validRows,
    invalidRowsCount,
    duplicateRowsCount,
    errors,
    duplicateRowNumbers,
  };
}
