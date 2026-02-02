/* ================= TOKENIZE ================= */

export function tokenize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    // espace autour de la ponctuation pour en faire des tokens
    .replace(/([.,;:!?()])/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}


/* ================= WORD DISTANCE (phrase) ================= */

export function wordDistance(a: string[], b: string[]) {
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  );

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[n][m];
}

/* ================= TYPES ================= */

export type DiffToken =
  | { type: "ok"; word: string }
  | { type: "del"; word: string }
  | { type: "ins"; word: string }
  | { type: "sub"; from: string; to: string };

/* ================= LEVENSHTEIN MOT À MOT ================= */

function levenshteinWord(a: string, b: string) {
  if (!a || !b) return Infinity;

  const la = a.length;
  const lb = b.length;

  const dp = Array.from({ length: la + 1 }, () =>
    Array(lb + 1).fill(0)
  );

  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return dp[la][lb];
}

/* ================= DIFF WORDS (LCS) ================= */

export function diffWords(refText: string, userText: string): DiffToken[] {
  const a = tokenize(refText);
  const b = tokenize(userText);

  const n = a.length;
  const m = b.length;

  // LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0)
  );

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? 1 + dp[i + 1][j + 1]
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Reconstruit le diff brut
  const out: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "ok", word: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", word: a[i] });
      i++;
    } else {
      out.push({ type: "ins", word: b[j] });
      j++;
    }
  }

  while (i < n) out.push({ type: "del", word: a[i++] });
  while (j < m) out.push({ type: "ins", word: b[j++] });

  /* ================= MERGE INTELLIGENT ================= */
  // del + ins => sub UNIQUEMENT si les mots sont proches
  const merged: DiffToken[] = [];
  for (let k = 0; k < out.length; k++) {
    const cur = out[k];
    const next = out[k + 1];

    if (
      cur.type === "del" &&
      next?.type === "ins"
    ) {
      const dist = levenshteinWord(cur.word, next.word);
      const maxLen = Math.max(cur.word.length, next.word.length);

      // seuil : ≤ 40% de différence
      if (dist <= Math.max(1, Math.floor(maxLen * 0.4))) {
        merged.push({
          type: "sub",
          from: cur.word,
          to: next.word,
        });
        k++;
        continue;
      }
    }

    merged.push(cur);
  }

  return merged;
}
