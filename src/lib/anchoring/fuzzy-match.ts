import search from "approx-string-match";

/**
 * Find the best fuzzy match for a pattern in a text.
 * Returns the position and number of edits, or null if no match within threshold.
 */
export function fuzzyFind(
  text: string,
  pattern: string,
  maxErrors?: number
): { start: number; end: number; errors: number } | null {
  if (!pattern || !text) return null;

  const threshold = maxErrors ?? Math.floor(pattern.length * 0.3);
  const matches = search(text, pattern, threshold);

  if (matches.length === 0) return null;

  // Return the best match (lowest error count)
  const best = matches.reduce((a, b) => (a.errors <= b.errors ? a : b));

  return {
    start: best.start,
    end: best.end + 1, // approx-string-match uses inclusive end
    errors: best.errors,
  };
}
