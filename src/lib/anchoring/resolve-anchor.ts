import type { CommentAnchor } from "../comments/types";
import { fuzzyFind } from "./fuzzy-match";

export type AnchorStatus = "exact" | "fuzzy" | "orphaned";

export interface ResolvedPosition {
  startOffset: number;
  endOffset: number;
  status: AnchorStatus;
}

/**
 * Resolve an anchor against current markdown content.
 * Uses a 4-strategy cascade:
 * 1. Exact position match
 * 2. Exact text search
 * 3. Fuzzy context match
 * 4. Orphaned
 */
export function resolveAnchor(
  rawMarkdown: string,
  anchor: CommentAnchor
): ResolvedPosition {
  // Strategy 1: Exact position — text at original offset still matches
  const atPosition = rawMarkdown.slice(anchor.startOffset, anchor.endOffset);
  if (atPosition === anchor.selectedText) {
    return {
      startOffset: anchor.startOffset,
      endOffset: anchor.endOffset,
      status: "exact",
    };
  }

  // Strategy 2: Exact text search — find the text elsewhere in the document
  const idx = rawMarkdown.indexOf(anchor.selectedText);
  if (idx !== -1) {
    // If multiple occurrences, try to match with context
    const contextMatch = findWithContext(rawMarkdown, anchor);
    if (contextMatch) return contextMatch;

    return {
      startOffset: idx,
      endOffset: idx + anchor.selectedText.length,
      status: "exact",
    };
  }

  // Strategy 3: Fuzzy match using prefix + selectedText + suffix as context
  const contextString = anchor.prefix + anchor.selectedText + anchor.suffix;
  const fuzzy = fuzzyFind(rawMarkdown, contextString);
  if (fuzzy) {
    // Extract the selectedText portion from the fuzzy match
    const prefixLen = anchor.prefix.length;
    const selectedLen = anchor.selectedText.length;
    const adjustedStart = fuzzy.start + prefixLen;
    const adjustedEnd = adjustedStart + selectedLen;

    // Validate bounds
    if (adjustedStart >= 0 && adjustedEnd <= rawMarkdown.length) {
      return {
        startOffset: adjustedStart,
        endOffset: adjustedEnd,
        status: "fuzzy",
      };
    }
  }

  // Strategy 4: Try fuzzy match on just the selected text
  const fuzzyText = fuzzyFind(rawMarkdown, anchor.selectedText);
  if (fuzzyText) {
    return {
      startOffset: fuzzyText.start,
      endOffset: fuzzyText.end,
      status: "fuzzy",
    };
  }

  // Orphaned — couldn't find the text
  return {
    startOffset: anchor.startOffset,
    endOffset: anchor.endOffset,
    status: "orphaned",
  };
}

/**
 * Find selected text using prefix/suffix context for disambiguation.
 */
function findWithContext(
  rawMarkdown: string,
  anchor: CommentAnchor
): ResolvedPosition | null {
  const { selectedText, prefix, suffix } = anchor;
  let searchFrom = 0;
  let bestMatch: { start: number; score: number } | null = null;

  while (searchFrom < rawMarkdown.length) {
    const idx = rawMarkdown.indexOf(selectedText, searchFrom);
    if (idx === -1) break;

    // Score based on context match
    let score = 0;
    const beforeText = rawMarkdown.slice(Math.max(0, idx - prefix.length), idx);
    const afterText = rawMarkdown.slice(
      idx + selectedText.length,
      idx + selectedText.length + suffix.length
    );

    if (beforeText === prefix) score += 2;
    else if (beforeText.endsWith(prefix.slice(-20))) score += 1;

    if (afterText === suffix) score += 2;
    else if (afterText.startsWith(suffix.slice(0, 20))) score += 1;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { start: idx, score };
    }

    searchFrom = idx + 1;
  }

  if (bestMatch) {
    return {
      startOffset: bestMatch.start,
      endOffset: bestMatch.start + selectedText.length,
      status: bestMatch.score >= 2 ? "exact" : "fuzzy",
    };
  }

  return null;
}
