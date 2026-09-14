/**
 * End-to-end Verification & Unit Tests for the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM
 */

import {
  standardizeName,
  standardizePhone,
  standardizeEmail,
  standardizeRegistrationNumber,
  standardizeNationalId,
  standardizeDate,
} from "../lib/deduplication/standardization";
import {
  levenshteinSimilarity,
  jaroWinklerSimilarity,
  jaccardSimilarity,
  tokenSortJaroWinkler,
  dateAgreement,
  phoneAgreement,
  identifierAgreement,
} from "../lib/deduplication/similarity";
import { parseAndValidateCsv } from "../lib/deduplication/csv-importer";
import { compareRecordPair, calculateModelEvaluation } from "../lib/deduplication/matching-engine";
import { generateCandidatePairs } from "../lib/deduplication/blocking";
import { MatchClassification } from "@prisma/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("\n========================================================");
  console.log("RUNNING DEDUPLICATION SYSTEM END-TO-END VERIFICATION");
  console.log("========================================================\n");

  // 1. Data Standardization Tests
  console.log("1. Testing Data Standardization...");
  assert(
    standardizeName("Dr. Jean-Paul", null, "Habimana") === "JEAN PAUL HABIMANA",
    "Standardizes honorifics, hyphens, and whitespace in names"
  );
  assert(
    standardizePhone("0788 123 456") === "+250788123456",
    "Standardizes local 07... phone to E.164 +2507..."
  );
  assert(
    standardizePhone("+250-788-123-456") === "+250788123456",
    "Cleans non-digit punctuation from international numbers"
  );
  assert(
    standardizeEmail("  STUDENT@DEDUP.SYSTEM  ") === "student@dedup.system",
    "Trims and lowercases emails"
  );
  assert(
    standardizeRegistrationNumber("reg-2023-bit-042") === "REG/2023/BIT/042",
    "Normalizes hyphens to canonical slashes in Registration Numbers"
  );
  assert(
    standardizeNationalId("1 1998 8 0012345 0 12") === "1199880012345012",
    "Strips spaces from 16-digit National ID"
  );
  assert(
    standardizeDate("14/05/1998").iso === "1998-05-14",
    "Standardizes DD/MM/YYYY date to ISO YYYY-MM-DD"
  );
  assert(
    standardizeDate("1998-05-14").iso === "1998-05-14",
    "Preserves ISO YYYY-MM-DD"
  );

  // 2. Similarity Algorithms Tests
  console.log("\n2. Testing Similarity Algorithms...");
  const jwSame = jaroWinklerSimilarity("Habimana", "Habimana");
  assert(jwSame === 1.0, "Jaro-Winkler exact match equals 1.0");

  const jwTypo = jaroWinklerSimilarity("Jean-Paul", "Jean Paul");
  assert(jwTypo > 0.95, `Jaro-Winkler handles typographical spaces/hyphens (score: ${jwTypo})`);

  const tokenSort = tokenSortJaroWinkler("Uwase Aline Mukamana", "Aline Mukamana Uwase");
  assert(tokenSort > 0.95, `Token-Sort Jaro-Winkler handles rearranged name tokens (score: ${tokenSort})`);

  const levSim = levenshteinSimilarity("REG/2023/BIT/042", "REG/2023/BIT/043");
  assert(levSim > 0.90, `Levenshtein similarity scores single-digit difference (score: ${levSim})`);

  const phoneMatch = phoneAgreement("+250788123456", "0788123456");
  assert(phoneMatch >= 0.90, `Phone agreement detects suffix agreement across country code prefixes (score: ${phoneMatch})`);

  const dateMatch = dateAgreement("1998-05-14", "1998-05-14");
  assert(dateMatch === 1.0, "Date agreement gives 1.0 for exact date match");

  const idMatch = identifierAgreement("1199880012345012", "1 1998 8 0012345 0 12");
  assert(idMatch === 1.0, "Identifier agreement handles formatting differences");

  // 3. CSV Import & In-File Duplicate Detection
  console.log("\n3. Testing CSV Validation & In-File Duplicate Detection...");
  const testCsv = `First Name,Last Name,Registration Number,National ID,Email,Phone,Programme
Jean-Paul,Habimana,REG/2024/BIT/001,1199880012345012,jp.habimana@dedup.system,0788123456,Information Technology
Aline,Uwase,REG/2024/BBA/002,1200170098765432,a.uwase@dedup.system,0788234567,Business Administration
Jean Paul,Habimana,REG/2024/BIT/001,1199880012345012,jp.habimana@dedup.system,0788123456,Information Technology
`;
  const csvAnalysis = parseAndValidateCsv(testCsv);
  assert(csvAnalysis.totalRows === 3, "Parses 3 data rows correctly");
  assert(csvAnalysis.validRows.length === 2, "Identifies 2 unique valid rows");
  assert(csvAnalysis.duplicateRowsCount === 1, "Detects in-file duplicate row (row 4 duplicate of row 2)");
  assert(csvAnalysis.errors.some((e) => e.reason.includes("In-file duplicate")), "Generates detailed in-file duplicate error");

  // 4. Record Comparison & Machine Learning Classification
  console.log("\n4. Testing Record Comparison & ML Classification...");
  const mockRecordA: any = {
    id: "rec-1",
    firstName: "Jean-Paul",
    lastName: "Habimana",
    fullName: "Jean-Paul Habimana",
    registrationNumber: "REG/2023/BIT/042",
    nationalId: "1199880012345012",
    phoneNumber: "+250788123456",
    email: "jp.habimana@dedup.system",
    dateOfBirth: new Date("1998-05-14"),
    programme: "Bachelor of Science in Information Technology",
    campus: "Main Campus",
    standardizedName: "JEAN PAUL HABIMANA",
    standardizedPhone: "+250788123456",
    standardizedEmail: "jp.habimana@dedup.system",
    standardizedRegistrationNumber: "REG/2023/BIT/042",
    standardizedNationalId: "1199880012345012",
  };

  const mockRecordB: any = {
    id: "rec-2",
    firstName: "Jean Paul",
    lastName: "Habimana",
    fullName: "Jean Paul Habimana",
    registrationNumber: "reg-2023-bit-042",
    nationalId: "1199880012345012",
    phoneNumber: "0788-123-456",
    email: "jeanpaul.h@gmail.com",
    dateOfBirth: new Date("1998-05-14"),
    programme: "Bachelor of Science in Information Technology",
    campus: "North Campus",
    standardizedName: "JEAN PAUL HABIMANA",
    standardizedPhone: "+250788123456",
    standardizedEmail: "jeanpaul.h@gmail.com",
    standardizedRegistrationNumber: "REG/2023/BIT/042",
    standardizedNationalId: "1199880012345012",
  };

  const evalResult = compareRecordPair(mockRecordA, mockRecordB);
  assert(evalResult.classification === MatchClassification.MATCH, "Correctly classifies high-similarity pair as MATCH");
  assert(evalResult.overallScore >= 0.80, `Overall score is above threshold (score: ${evalResult.overallScore})`);
  assert(evalResult.fieldComparisons.length >= 8, `Evaluated ${evalResult.fieldComparisons.length} field attributes`);

  // 5. Distinct Record Non-Match Test
  const mockRecordC: any = {
    id: "rec-3",
    firstName: "Sandrine",
    lastName: "Ingabire",
    fullName: "Sandrine Ingabire",
    registrationNumber: "REG/2024/LLB/999",
    nationalId: "1200370011112222",
    phoneNumber: "+250788999000",
    email: "s.ingabire@dedup.system",
    dateOfBirth: new Date("2003-01-01"),
    programme: "Bachelor of Laws",
    campus: "Main Campus",
    standardizedName: "SANDRINE INGABIRE",
    standardizedPhone: "+250788999000",
    standardizedEmail: "s.ingabire@dedup.system",
    standardizedRegistrationNumber: "REG/2024/LLB/999",
    standardizedNationalId: "1200370011112222",
  };

  const evalNonMatch = compareRecordPair(mockRecordA, mockRecordC);
  assert(evalNonMatch.classification === MatchClassification.NON_MATCH, "Correctly classifies distinct records as NON_MATCH");
  assert(evalNonMatch.overallScore < 0.50, `Overall score is low for non-match (score: ${evalNonMatch.overallScore})`);

  // 6. Model Evaluation Metrics Test
  console.log("\n5. Testing Evaluation Metrics & Confusion Matrix...");
  const mockCandidates = [
    { predicted: MatchClassification.MATCH, actual: "MATCH" as const },
    { predicted: MatchClassification.MATCH, actual: "MATCH" as const },
    { predicted: MatchClassification.MATCH, actual: "NON_MATCH" as const }, // False Positive
    { predicted: MatchClassification.NON_MATCH, actual: "MATCH" as const }, // False Negative
    { predicted: MatchClassification.NON_MATCH, actual: "NON_MATCH" as const }, // True Negative
  ];
  const evalMetrics = calculateModelEvaluation(mockCandidates);
  assert(evalMetrics.totalPairs === 5, "Calculates metrics on evaluated pairs");
  assert(evalMetrics.truePositives === 2, "Identifies 2 true positives");
  assert(evalMetrics.falsePositives === 1, "Identifies 1 false positive");
  assert(evalMetrics.falseNegatives === 1, "Identifies 1 false negative");
  assert(evalMetrics.trueNegatives === 1, "Identifies 1 true negative");
  assert(evalMetrics.accuracy === 0.6, "Calculates accurate overall accuracy");
  console.log(`  ✓ Confusion Matrix: TP=${evalMetrics.truePositives}, FP=${evalMetrics.falsePositives}, TN=${evalMetrics.trueNegatives}, FN=${evalMetrics.falseNegatives}`);
  console.log(`  ✓ Precision: ${(evalMetrics.precision * 100).toFixed(1)}%, Recall: ${(evalMetrics.recall * 100).toFixed(1)}%, F1: ${(evalMetrics.f1Score * 100).toFixed(1)}%`);

  // 7. Blocking Candidate Pair Generation
  console.log("\n6. Testing Multi-Pass Candidate Pair Blocking...");
  const sampleRecords: any[] = [
    mockRecordA,
    mockRecordB,
    mockRecordC,
  ];
  const blockedPairs = generateCandidatePairs(sampleRecords, { exhaustiveThreshold: 100 });
  assert(blockedPairs.length > 0, `Generated ${blockedPairs.length} candidate pairs via blocking passes`);
  const foundHabimanaPair = blockedPairs.some(
    (p) => (p.recordA.id === "rec-1" && p.recordB.id === "rec-2") || (p.recordA.id === "rec-2" && p.recordB.id === "rec-1")
  );
  assert(foundHabimanaPair, "Blocking rules successfully captured the Jean-Paul Habimana duplicate pair");

  console.log("\n========================================================");
  console.log("ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (100% PASS)");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
