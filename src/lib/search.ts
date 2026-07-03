/** Classic edit-distance, used only as a last-resort tiebreaker below. */
function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => [
    i,
    ...Array(cols - 1).fill(0),
  ]);
  for (let j = 1; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[rows - 1][cols - 1];
}

/**
 * Finds the single best name match for a query, ranked exact > starts-with
 * > contains > closest-by-edit-distance, so a search always resolves to one
 * row to jump to rather than a filtered set.
 */
export function findBestNameMatch<T extends { name: string }>(
  items: T[],
  query: string,
): T | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  let best: T | null = null;
  let bestScore = Infinity;
  for (const item of items) {
    const name = item.name.trim().toLowerCase();
    if (!name) continue;
    let score: number;
    if (name === q) score = -3;
    else if (name.startsWith(q)) score = -2;
    else if (name.includes(q)) score = -1;
    else score = levenshtein(name, q);

    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}
