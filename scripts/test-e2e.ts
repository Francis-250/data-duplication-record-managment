/**
 * End-to-end Verification & Unit Tests for the University of Kigali Record Deduplication System
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
    "Standardizes local Rwandan 07... phone to E.164 +2507..."
  );
  assert(
    standardizePhone("+250-788-123-456") === "+250788123456",
    "Cleans non-digit punctuation from international Rwandan numbers"
  );
  assert(
    standardizeEmail("  STUDENT@UOK.AC.RW  ") === "student@uok.ac.rw",
    "Trims and lowercases emails"
  );
  assert(
    standardizeRegistrationNumber("uok-2023-bit-042") === "UOK/2023/BIT/042",
    "Normalizes hyphens to canonical slashes in Registration Numbers"
  );
  assert(
    standardizeNationalId("1 1998 8 0012345 0 12") === "1199880012345012",
    "Strips spaces from 16-digit Rwandan National ID"
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

  const levSim = levenshteinSimilarity("UOK/2023/BIT/042", "UOK/2023/BIT/043");
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
Jean-Paul,Habimana,UOK/2024/BIT/001,1199880012345012,jp.habimana@uok.ac.rw,0788123456,Information Technology
Aline,Uwase,UOK/2024/BBA/002,1200170098765432,a.uwase@uok.ac.rw,0788234567,Business Administration
Jean Paul,Habimana,UOK/2024/BIT/001,1199880012345012,jp.habimana@uok.ac.rw,0788123456,Information Technology
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
    registrationNumber: "UOK/2023/BIT/042",
    nationalId: "1199880012345012",
    phoneNumber: "+250788123456",
    email: "jp.habimana@uok.ac.rw",
    dateOfBirth: new Date("1998-05-14"),
    programme: "Bachelor of Science in Information Technology",
    campus: "Kigali Campus (Kacyiru)",
    standardizedName: "JEAN PAUL HABIMANA",
    standardizedPhone: "+250788123456",
    standardizedEmail: "jp.habimana@uok.ac.rw",
    standardizedRegistrationNumber: "UOK/2023/BIT/042",
    standardizedNationalId: "1199880012345012",
  };

  const mockRecordB: any = {
    id: "rec-2",
    firstName: "Jean Paul",
    lastName: "Habimana",
    fullName: "Jean Paul Habimana",
    registrationNumber: "uok-2023-bit-042",
    nationalId: "1199880012345012",
    phoneNumber: "0788-123-456",
    email: "jeanpaul.h@gmail.com",
    dateOfBirth: new Date("1998-05-14"),
    programme: "Bachelor of Science in Information Technology",
    campus: "Musanze Campus",
    standardizedName: "JEAN PAUL HABIMANA",
    standardizedPhone: "+250788123456",
    standardizedEmail: "jeanpaul.h@gmail.com",
    standardizedRegistrationNumber: "UOK/2023/BIT/042",
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
    registrationNumber: "UOK/2024/LLB/999",
    nationalId: "1200370011112222",
    phoneNumber: "+250788999000",
    email: "s.ingabire@uok.ac.rw",
    dateOfBirth: new Date("2003-01-01"),
    programme: "Bachelor of Laws",
    campus: "Kigali Campus (Kacyiru)",
    standardizedName: "SANDRINE INGABIRE",
    standardizedPhone: "+250788999000",
    standardizedEmail: "s.ingabire@uok.ac.rw",
    standardizedRegistrationNumber: "UOK/2024/LLB/999",
    standardizedNationalId: "1200370011112222",
  };

  const evalNonMatch = compareRecordPair(mockRecordA, mockRecordC);
  assert(evalNonMatch.classification === MatchClassification.NON_MATCH, "Correctly classifies distinct records as NON_MATCH");
  assert(evalNonMatch.overallScore < 0.50, `Overall score is low for non-match (score: ${evalNonMatch.overallScore})`);

  // 6. Model Evaluation Metrics Test
  console.log("\n5. Testing Evaluation Metrics & Confusion Matrix...");
  const samplePredictions = [
    { predicted: MatchClassification.MATCH, actual: "MATCH" as const },
    { predicted: MatchClassification.MATCH, actual: "MATCH" as const },
    { predicted: MatchClassification.POSSIBLE_MATCH, actual: "MATCH" as const },
    { predicted: MatchClassification.NON_MATCH, actual: "NON_MATCH" as const },
    { predicted: MatchClassification.NON_MATCH, actual: "NON_MATCH" as const },
    { predicted: MatchClassification.MATCH, actual: "NON_MATCH" as const }, // 1 FP
  ];
  const metrics = calculateModelEvaluation(samplePredictions);
  assert(metrics.accuracy > 0.8, `Accuracy calculated correctly (${metrics.accuracy})`);
  assert(metrics.precision > 0.6, `Precision calculated correctly (${metrics.precision})`);
  assert(metrics.recall === 1.0, `Recall calculated correctly (${metrics.recall})`);
  assert(metrics.confusionMatrix.actualMatchPredictedMatch === 3, "Confusion matrix TP count is 3");
  assert(metrics.confusionMatrix.actualNonMatchPredictedMatch === 1, "Confusion matrix FP count is 1");

  console.log("\n========================================================");
  console.log("ALL UNIT AND END-TO-END VERIFICATION TESTS PASSED! ✓");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
