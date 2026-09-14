/**
 * Similarity Algorithms for the DATA DEDUPLICATION AND RECORD MATCHING SYSTEM:
 * - Exact Match & Case-Insensitive Match
 * - Jaro-Winkler Similarity
 * - Levenshtein Distance & Normalized Similarity
 * - Jaccard Similarity (character and word token n-grams)
 * - Token-Sort / Token-Set Similarity
 * - Date Agreement
 * - Phone Number Agreement
 * - Identifier Agreement
 */

/**
 * Calculates Levenshtein edit distance between two strings
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalized Levenshtein similarity score between 0.0 and 1.0
 */
export function levenshteinSimilarity(s1?: string | null, s2?: string | null): number {
  if (!s1 || !s2) return 0;
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;

  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;

  const dist = levenshteinDistance(str1, str2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Jaro similarity between two strings
 */
export function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);

    for (let j = start; j < end; j++) {
      if (str2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0
  );
}

/**
 * Jaro-Winkler similarity: enhances Jaro score by adding prefix weighting
 * Default prefix scale is 0.1, up to a max of 4 characters.
 */
export function jaroWinklerSimilarity(s1?: string | null, s2?: string | null, prefixScale = 0.1): number {
  if (!s1 || !s2) return 0.0;
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;

  const jaro = jaroSimilarity(str1, str2);
  if (jaro < 0.7) return jaro;

  // Calculate common prefix length up to 4 characters
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return Math.min(1.0, jaro + prefix * prefixScale * (1 - jaro));
}

/**
 * Jaccard token similarity: treats strings as sets of words or character n-grams
 */
export function jaccardSimilarity(s1?: string | null, s2?: string | null, mode: "words" | "ngrams" = "words"): number {
  if (!s1 || !s2) return 0.0;
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;

  let set1: Set<string>;
  let set2: Set<string>;

  if (mode === "words") {
    set1 = new Set(str1.split(/\s+/).filter(Boolean));
    set2 = new Set(str2.split(/\s+/).filter(Boolean));
  } else {
    // 2-gram (bigrams)
    const getBigrams = (s: string) => {
      const res = new Set<string>();
      for (let i = 0; i < s.length - 1; i++) {
        res.add(s.slice(i, i + 2));
      }
      return res;
    };
    set1 = getBigrams(str1);
    set2 = getBigrams(str2);
  }

  if (set1.size === 0 || set2.size === 0) return 0.0;

  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return union === 0 ? 0.0 : intersection / union;
}

/**
 * Token Sort Jaro-Winkler Similarity:
 * Splits words, sorts them alphabetically, and compares the reconstructed strings.
 * Perfect for inverted names like "Mugisha Jean Paul" vs "Jean Paul Mugisha"
 */
export function tokenSortJaroWinkler(s1?: string | null, s2?: string | null): number {
  if (!s1 || !s2) return 0.0;
  const sorted1 = s1.trim().toLowerCase().split(/\s+/).sort().join(" ");
  const sorted2 = s2.trim().toLowerCase().split(/\s+/).sort().join(" ");
  return jaroWinklerSimilarity(sorted1, sorted2);
}

/**
 * Exact Matching (Case-Insensitive, trimmed)
 */
export function exactMatch(s1?: string | null, s2?: string | null): number {
  if (!s1 || !s2) return 0.0;
  return s1.trim().toLowerCase() === s2.trim().toLowerCase() ? 1.0 : 0.0;
}

/**
 * Date Agreement comparison:
 * - Exact date match: 1.0
 * - Same year and month (different day or missing day): 0.85
 * - Same year: 0.60
 * - Else: 0.0
 */
export function dateAgreement(d1?: Date | string | null, d2?: Date | string | null): number {
  if (!d1 || !d2) return 0.0;
  const date1 = d1 instanceof Date ? d1 : new Date(d1);
  const date2 = d2 instanceof Date ? d2 : new Date(d2);

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0.0;

  const y1 = date1.getUTCFullYear();
  const m1 = date1.getUTCMonth();
  const day1 = date1.getUTCDate();

  const y2 = date2.getUTCFullYear();
  const m2 = date2.getUTCMonth();
  const day2 = date2.getUTCDate();

  if (y1 === y2 && m1 === m2 && day1 === day2) return 1.0;
  if (y1 === y2 && m1 === m2) return 0.85;
  if (y1 === y2) return 0.60;

  return 0.0;
}

/**
 * Phone Number Agreement comparison:
 * Standardized numbers compared:
 * - Exact match: 1.0
 * - Suffix match (last 8 digits, common in Rwanda local prefix differences): 0.90
 * - Levenshtein similarity fallback: 0.0 - 0.8
 */
export function phoneAgreement(p1?: string | null, p2?: string | null): number {
  if (!p1 || !p2) return 0.0;
  const digits1 = p1.replace(/\D/g, "");
  const digits2 = p2.replace(/\D/g, "");
  if (!digits1 || !digits2) return 0.0;

  if (digits1 === digits2) return 1.0;

  // Check last 8 digits (e.g. 788123456)
  if (digits1.length >= 8 && digits2.length >= 8) {
    const s1 = digits1.slice(-8);
    const s2 = digits2.slice(-8);
    if (s1 === s2) return 0.90;
  }

  return levenshteinSimilarity(digits1, digits2);
}

/**
 * Unique Identifier Agreement (Registration Number, National ID, Passport)
 */
export function identifierAgreement(id1?: string | null, id2?: string | null): number {
  if (!id1 || !id2) return 0.0;
  const clean1 = id1.trim().toUpperCase().replace(/[\s\-_./\\]/g, "");
  const clean2 = id2.trim().toUpperCase().replace(/[\s\-_./\\]/g, "");
  if (!clean1 || !clean2) return 0.0;

  if (clean1 === clean2) return 1.0;

  // If one contains the other and length >= 6
  if ((clean1.includes(clean2) || clean2.includes(clean1)) && Math.min(clean1.length, clean2.length) >= 6) {
    return 0.85;
  }

  return levenshteinSimilarity(clean1, clean2);
}
