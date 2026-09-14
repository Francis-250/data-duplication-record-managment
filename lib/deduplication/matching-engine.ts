import { InstitutionalRecord, MatchClassification } from "@prisma/client";
import {
  jaroWinklerSimilarity,
  levenshteinSimilarity,
  tokenSortJaroWinkler,
  jaccardSimilarity,
  dateAgreement,
  phoneAgreement,
  identifierAgreement,
  exactMatch,
} from "./similarity";

export interface EvaluatedFieldComparison {
  fieldName: string;
  recordAValue: string | null;
  recordBValue: string | null;
  standardizedA: string | null;
  standardizedB: string | null;
  similarityMethod: string;
  similarityScore: number;
  isExactMatch: boolean;
}

export interface PairMatchResult {
  recordAId: string;
  recordBId: string;
  overallScore: number;
  confidenceScore: number;
  classification: MatchClassification;
  explanation: string;
  algorithm: string;
  modelVersion: string;
  fieldComparisons: EvaluatedFieldComparison[];
}

export interface ModelEvaluationMetrics {
  totalPairs: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    actualMatchPredictedMatch: number;
    actualMatchPredictedNonMatch: number;
    actualNonMatchPredictedMatch: number;
    actualNonMatchPredictedNonMatch: number;
  };
}

/**
 * Weights assigned based on Fellegi-Sunter probabilistic record linkage principles:
 * Highly unique discriminators (National ID, Reg No, Phone, Email) have highest weight.
 */
export const DEFAULT_FIELD_WEIGHTS: Record<string, { weight: number; method: string }> = {
  nationalId: { weight: 0.25, method: "Identifier Agreement" },
  registrationNumber: { weight: 0.22, method: "Identifier Agreement" },
  fullName: { weight: 0.18, method: "Token-Sort Jaro-Winkler" },
  email: { weight: 0.12, method: "Exact / Levenshtein" },
  phoneNumber: { weight: 0.10, method: "Phone Agreement" },
  dateOfBirth: { weight: 0.08, method: "Date Agreement" },
  programme: { weight: 0.03, method: "Jaccard Token Similarity" },
  campus: { weight: 0.02, method: "Exact Match" },
};

/**
 * Compares two institutional records across all defined fields
 */
export function compareRecordPair(
  recordA: InstitutionalRecord,
  recordB: InstitutionalRecord,
  options: {
    matchThreshold?: number;
    possibleThreshold?: number;
    algorithm?: string;
    weights?: Record<string, number>;
  } = {}
): PairMatchResult {
  const matchThreshold = options.matchThreshold ?? 0.80;
  const possibleThreshold = options.possibleThreshold ?? 0.52;
  const algorithm = options.algorithm ?? "Hybrid Fellegi-Sunter & Token Similarity";
  const modelVersion = "v2.4-DEDUP-ML";

  const comparisons: EvaluatedFieldComparison[] = [];
  const explanations: string[] = [];

  // 1. National ID / Passport
  const nidScore = identifierAgreement(
    recordA.standardizedNationalId || recordA.nationalId || recordA.passportNumber,
    recordB.standardizedNationalId || recordB.nationalId || recordB.passportNumber
  );
  if (recordA.nationalId || recordB.nationalId) {
    comparisons.push({
      fieldName: "nationalId",
      recordAValue: recordA.nationalId || recordA.passportNumber || null,
      recordBValue: recordB.nationalId || recordB.passportNumber || null,
      standardizedA: recordA.standardizedNationalId || null,
      standardizedB: recordB.standardizedNationalId || null,
      similarityMethod: "Identifier Agreement",
      similarityScore: nidScore,
      isExactMatch: nidScore === 1.0,
    });
    if (nidScore === 1.0) explanations.push("Identical National ID / Passport");
    else if (nidScore >= 0.85) explanations.push("Very high National ID similarity");
  }

  // 2. Registration Number
  const regScore = identifierAgreement(
    recordA.standardizedRegistrationNumber || recordA.registrationNumber,
    recordB.standardizedRegistrationNumber || recordB.registrationNumber
  );
  if (recordA.registrationNumber || recordB.registrationNumber) {
    comparisons.push({
      fieldName: "registrationNumber",
      recordAValue: recordA.registrationNumber || null,
      recordBValue: recordB.registrationNumber || null,
      standardizedA: recordA.standardizedRegistrationNumber || null,
      standardizedB: recordB.standardizedRegistrationNumber || null,
      similarityMethod: "Identifier Agreement",
      similarityScore: regScore,
      isExactMatch: regScore === 1.0,
    });
    if (regScore === 1.0) explanations.push("Exact Registration Number match");
    else if (regScore >= 0.85) explanations.push("Close Registration Number format variant");
  }

  // 3. First Name
  const fnScore = jaroWinklerSimilarity(recordA.firstName, recordB.firstName);
  comparisons.push({
    fieldName: "firstName",
    recordAValue: recordA.firstName,
    recordBValue: recordB.firstName,
    standardizedA: recordA.firstName?.trim().toUpperCase() || null,
    standardizedB: recordB.firstName?.trim().toUpperCase() || null,
    similarityMethod: "Jaro-Winkler",
    similarityScore: fnScore,
    isExactMatch: fnScore === 1.0,
  });

  // 4. Last Name
  const lnScore = jaroWinklerSimilarity(recordA.lastName, recordB.lastName);
  comparisons.push({
    fieldName: "lastName",
    recordAValue: recordA.lastName,
    recordBValue: recordB.lastName,
    standardizedA: recordA.lastName?.trim().toUpperCase() || null,
    standardizedB: recordB.lastName?.trim().toUpperCase() || null,
    similarityMethod: "Jaro-Winkler",
    similarityScore: lnScore,
    isExactMatch: lnScore === 1.0,
  });

  // 5. Full Name (handles inverted names & token order)
  const nameA = recordA.standardizedName || recordA.fullName || `${recordA.firstName} ${recordA.lastName}`;
  const nameB = recordB.standardizedName || recordB.fullName || `${recordB.firstName} ${recordB.lastName}`;
  const fullNameScore = tokenSortJaroWinkler(nameA, nameB);
  comparisons.push({
    fieldName: "fullName",
    recordAValue: recordA.fullName,
    recordBValue: recordB.fullName,
    standardizedA: recordA.standardizedName,
    standardizedB: recordB.standardizedName,
    similarityMethod: "Token-Sort Jaro-Winkler",
    similarityScore: fullNameScore,
    isExactMatch: fullNameScore === 1.0,
  });
  if (fullNameScore === 1.0) explanations.push("Exact Full Name match");
  else if (fullNameScore >= 0.88) explanations.push(`Slight spelling/order variation in name (${(fullNameScore * 100).toFixed(0)}%)`);

  // 6. Date of Birth
  const dobScore = dateAgreement(recordA.dateOfBirth, recordB.dateOfBirth);
  if (recordA.dateOfBirth || recordB.dateOfBirth) {
    comparisons.push({
      fieldName: "dateOfBirth",
      recordAValue: recordA.dateOfBirth ? new Date(recordA.dateOfBirth).toISOString().split("T")[0] : null,
      recordBValue: recordB.dateOfBirth ? new Date(recordB.dateOfBirth).toISOString().split("T")[0] : null,
      standardizedA: recordA.dateOfBirth ? new Date(recordA.dateOfBirth).toISOString().split("T")[0] : null,
      standardizedB: recordB.dateOfBirth ? new Date(recordB.dateOfBirth).toISOString().split("T")[0] : null,
      similarityMethod: "Date Agreement",
      similarityScore: dobScore,
      isExactMatch: dobScore === 1.0,
    });
    if (dobScore === 1.0) explanations.push("Identical Date of Birth");
    else if (dobScore >= 0.80) explanations.push("Matching Birth Year and Month");
  }

  // 7. Email
  const emailScore = levenshteinSimilarity(
    recordA.standardizedEmail || recordA.email,
    recordB.standardizedEmail || recordB.email
  );
  if (recordA.email || recordB.email) {
    comparisons.push({
      fieldName: "email",
      recordAValue: recordA.email || null,
      recordBValue: recordB.email || null,
      standardizedA: recordA.standardizedEmail || null,
      standardizedB: recordB.standardizedEmail || null,
      similarityMethod: "Normalized Levenshtein",
      similarityScore: emailScore,
      isExactMatch: emailScore === 1.0,
    });
    if (emailScore === 1.0) explanations.push("Matching Email address");
  }

  // 8. Phone Number
  const phoneScore = phoneAgreement(
    recordA.standardizedPhone || recordA.phoneNumber,
    recordB.standardizedPhone || recordB.phoneNumber
  );
  if (recordA.phoneNumber || recordB.phoneNumber) {
    comparisons.push({
      fieldName: "phoneNumber",
      recordAValue: recordA.phoneNumber || null,
      recordBValue: recordB.phoneNumber || null,
      standardizedA: recordA.standardizedPhone || null,
      standardizedB: recordB.standardizedPhone || null,
      similarityMethod: "Phone Agreement",
      similarityScore: phoneScore,
      isExactMatch: phoneScore === 1.0,
    });
    if (phoneScore >= 0.90) explanations.push("Matching Phone Number");
  }

  // 9. Programme
  const progScore = jaccardSimilarity(recordA.programme, recordB.programme);
  if (recordA.programme || recordB.programme) {
    comparisons.push({
      fieldName: "programme",
      recordAValue: recordA.programme || null,
      recordBValue: recordB.programme || null,
      standardizedA: recordA.programme?.trim().toUpperCase() || null,
      standardizedB: recordB.programme?.trim().toUpperCase() || null,
      similarityMethod: "Jaccard Token Similarity",
      similarityScore: progScore,
      isExactMatch: progScore === 1.0,
    });
  }

  // 10. Campus
  const campusScore = exactMatch(recordA.campus, recordB.campus);
  if (recordA.campus || recordB.campus) {
    comparisons.push({
      fieldName: "campus",
      recordAValue: recordA.campus || null,
      recordBValue: recordB.campus || null,
      standardizedA: recordA.campus?.trim().toUpperCase() || null,
      standardizedB: recordB.campus?.trim().toUpperCase() || null,
      similarityMethod: "Exact Match",
      similarityScore: campusScore,
      isExactMatch: campusScore === 1.0,
    });
  }

  // Dynamic re-normalization of weights based on fields present in comparison
  let totalApplicableWeight = 0;
  let weightedScoreSum = 0;

  for (const comp of comparisons) {
    const config = DEFAULT_FIELD_WEIGHTS[comp.fieldName] || { weight: 0.05 };
    totalApplicableWeight += config.weight;
    weightedScoreSum += comp.similarityScore * config.weight;
  }

  const baseScore = totalApplicableWeight > 0 ? weightedScoreSum / totalApplicableWeight : 0;

  // Boost rules for deterministic evidence (Rule-based augmentation):
  let finalScore = baseScore;

  // Strong Deterministic rule 1: If National ID matches exactly and names are close, definite match
  if (nidScore === 1.0 && fullNameScore >= 0.70) {
    finalScore = Math.max(finalScore, 0.96);
  }

  // Strong Deterministic rule 2: If Reg Number matches exactly and last name or first name matches
  if (regScore === 1.0 && (fnScore >= 0.80 || lnScore >= 0.80 || fullNameScore >= 0.75)) {
    finalScore = Math.max(finalScore, 0.95);
  }

  // Strong Deterministic rule 3: Exact email & Phone agreement & close name
  if (emailScore === 1.0 && phoneScore >= 0.90 && fullNameScore >= 0.65) {
    finalScore = Math.max(finalScore, 0.92);
  }

  // Penalization rule: If both records have valid different National IDs, penalize overall score
  if (
    recordA.standardizedNationalId &&
    recordB.standardizedNationalId &&
    recordA.standardizedNationalId.length >= 10 &&
    recordB.standardizedNationalId.length >= 10 &&
    nidScore < 0.80
  ) {
    finalScore = Math.min(finalScore, 0.40);
    explanations.push("Conflicting distinct National IDs recorded");
  }

  // Cap between 0 and 1
  finalScore = Math.min(1.0, Math.max(0.0, Math.round(finalScore * 1000) / 1000));

  // Determine Classification
  let classification: MatchClassification;
  if (finalScore >= matchThreshold) {
    classification = MatchClassification.MATCH;
  } else if (finalScore >= possibleThreshold) {
    classification = MatchClassification.POSSIBLE_MATCH;
  } else {
    classification = MatchClassification.NON_MATCH;
  }

  // Confidence Score
  const confidenceScore = Math.min(
    1.0,
    Math.round((finalScore * 0.7 + (comparisons.filter((c) => c.similarityScore > 0.8).length / comparisons.length) * 0.3) * 1000) / 1000
  );

  const finalExplanation = explanations.length > 0
    ? explanations.join("; ")
    : `Overall field agreement score is ${(finalScore * 100).toFixed(1)}% across ${comparisons.length} evaluated attributes.`;

  return {
    recordAId: recordA.id,
    recordBId: recordB.id,
    overallScore: finalScore,
    confidenceScore,
    classification,
    explanation: finalExplanation,
    algorithm,
    modelVersion,
    fieldComparisons: comparisons,
  };
}

/**
 * Calculates model evaluation metrics against known labeled pairs:
 * Accuracy, Precision, Recall, F1-Score, Confusion Matrix
 */
export function calculateModelEvaluation(
  results: { predicted: MatchClassification; actual: "MATCH" | "NON_MATCH" }[]
): ModelEvaluationMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const item of results) {
    const isPredictedMatch = item.predicted === MatchClassification.MATCH || item.predicted === MatchClassification.POSSIBLE_MATCH;
    const isActualMatch = item.actual === "MATCH";

    if (isPredictedMatch && isActualMatch) tp++;
    else if (isPredictedMatch && !isActualMatch) fp++;
    else if (!isPredictedMatch && !isActualMatch) tn++;
    else if (!isPredictedMatch && isActualMatch) fn++;
  }

  const totalPairs = results.length;
  const accuracy = totalPairs > 0 ? (tp + tn) / totalPairs : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    totalPairs,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    f1Score: Math.round(f1Score * 1000) / 1000,
    confusionMatrix: {
      actualMatchPredictedMatch: tp,
      actualMatchPredictedNonMatch: fn,
      actualNonMatchPredictedMatch: fp,
      actualNonMatchPredictedNonMatch: tn,
    },
  };
}
