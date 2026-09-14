import { InstitutionalRecord } from "@prisma/client";

export interface CandidatePair {
  recordA: InstitutionalRecord;
  recordB: InstitutionalRecord;
  blockingKey?: string;
}

/**
 * Basic soundex for phonetic blocking of African and international surnames
 */
function soundex(name: string): string {
  if (!name) return "";
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  if (!clean) return "";

  const map: Record<string, string> = {
    B: "1", F: "1", P: "1", V: "1",
    C: "2", G: "2", J: "2", K: "2", Q: "2", S: "2", X: "2", Z: "2",
    D: "3", T: "3",
    L: "4",
    M: "5", N: "5",
    R: "6",
  };

  let res = clean[0];
  let prevCode = map[clean[0]] || "0";

  for (let i = 1; i < clean.length; i++) {
    const code = map[clean[i]] || "0";
    if (code !== "0" && code !== prevCode) {
      res += code;
      if (res.length === 4) break;
    }
    prevCode = code;
  }

  return res.padEnd(4, "0");
}

/**
 * Generates candidate record pairs using multi-pass blocking keys
 * to avoid quadratic all-pairs explosion while guaranteeing high recall.
 */
export function generateCandidatePairs(
  records: InstitutionalRecord[],
  options: { exhaustiveThreshold?: number } = {}
): CandidatePair[] {
  const threshold = options.exhaustiveThreshold ?? 300;
  const n = records.length;

  // For small datasets (< 300 records), exhaustive comparison ensures 100% candidate recall
  if (n <= threshold) {
    const pairs: CandidatePair[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        pairs.push({
          recordA: records[i],
          recordB: records[j],
          blockingKey: "EXHAUSTIVE",
        });
      }
    }
    return pairs;
  }

  // For larger datasets, multi-pass indexing/blocking
  const pairMap = new Map<string, CandidatePair>();

  const addPair = (a: InstitutionalRecord, b: InstitutionalRecord, key: string) => {
    if (a.id === b.id) return;
    const [rec1, rec2] = a.id < b.id ? [a, b] : [b, a];
    const pairId = `${rec1.id}::${rec2.id}`;
    if (!pairMap.has(pairId)) {
      pairMap.set(pairId, {
        recordA: rec1,
        recordB: rec2,
        blockingKey: key,
      });
    }
  };

  // Block definitions:
  const blocks = new Map<string, InstitutionalRecord[]>();

  for (const record of records) {
    const lastName = (record.lastName || "").trim().toUpperCase();
    const firstName = (record.firstName || "").trim().toUpperCase();
    const sound = soundex(lastName);
    const firstInitial = firstName.slice(0, 2);

    // Pass 1: Soundex of last name + first 2 letters of first name
    if (sound && firstInitial) {
      const b1 = `P1:${sound}:${firstInitial}`;
      if (!blocks.has(b1)) blocks.set(b1, []);
      blocks.get(b1)!.push(record);
    }

    // Pass 2: Birth year + first 2 letters of last name
    if (record.dateOfBirth && lastName) {
      const year = new Date(record.dateOfBirth).getUTCFullYear();
      const b2 = `P2:${year}:${lastName.slice(0, 2)}`;
      if (!blocks.has(b2)) blocks.set(b2, []);
      blocks.get(b2)!.push(record);
    }

    // Pass 3: Standardized phone last 7 digits
    if (record.standardizedPhone && record.standardizedPhone.length >= 7) {
      const b3 = `P3:${record.standardizedPhone.slice(-7)}`;
      if (!blocks.has(b3)) blocks.set(b3, []);
      blocks.get(b3)!.push(record);
    }

    // Pass 4: Standardized National ID or Passport
    if (record.standardizedNationalId && record.standardizedNationalId.length >= 6) {
      const b4 = `P4:${record.standardizedNationalId.slice(0, 8)}`;
      if (!blocks.has(b4)) blocks.set(b4, []);
      blocks.get(b4)!.push(record);
    }

    // Pass 5: Standardized Registration Number base
    if (record.standardizedRegistrationNumber) {
      const b5 = `P5:${record.standardizedRegistrationNumber.slice(0, 8)}`;
      if (!blocks.has(b5)) blocks.set(b5, []);
      blocks.get(b5)!.push(record);
    }

    // Pass 6: Exact standardized email prefix (before @)
    if (record.standardizedEmail) {
      const prefix = record.standardizedEmail.split("@")[0];
      if (prefix && prefix.length >= 3) {
        const b6 = `P6:${prefix}`;
        if (!blocks.has(b6)) blocks.set(b6, []);
        blocks.get(b6)!.push(record);
      }
    }
  }

  // Generate candidate pairs from blocks
  for (const [key, group] of blocks.entries()) {
    // Avoid degenerate blocks with too many records (e.g. over 200 items in a single block)
    if (group.length > 200) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        addPair(group[i], group[j], key);
      }
    }
  }

  return Array.from(pairMap.values());
}
