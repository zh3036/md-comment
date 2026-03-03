import type { CommentAnchor } from "../comments/types";

const CONTEXT_LENGTH = 50;

/**
 * Create a CommentAnchor from a text selection against raw markdown content.
 */
export function createAnchor(
  rawMarkdown: string,
  selectedText: string,
  startOffset: number,
  endOffset: number
): CommentAnchor {
  const prefix = rawMarkdown.slice(
    Math.max(0, startOffset - CONTEXT_LENGTH),
    startOffset
  );
  const suffix = rawMarkdown.slice(
    endOffset,
    endOffset + CONTEXT_LENGTH
  );

  // Store the actual raw markdown text at the matched offsets (may contain newlines)
  const rawSelectedText = rawMarkdown.slice(startOffset, endOffset);

  return {
    selectedText: rawSelectedText,
    prefix,
    suffix,
    startOffset,
    endOffset,
  };
}

/**
 * Find the offset of selected text in raw markdown.
 * The rendered text may have whitespace differences (e.g., newlines collapsed to spaces),
 * so we do whitespace-normalized matching.
 */
export function findSelectionInRawMarkdown(
  rawMarkdown: string,
  selectedText: string,
  approximatePosition?: number
): { startOffset: number; endOffset: number } | null {
  if (!selectedText) return null;

  // Strategy 1: Exact match
  const exactIdx = rawMarkdown.indexOf(selectedText);
  if (exactIdx !== -1) {
    return {
      startOffset: exactIdx,
      endOffset: exactIdx + selectedText.length,
    };
  }

  // Strategy 2: Whitespace-normalized matching
  // The rendered text collapses \n to spaces, strips markdown syntax, etc.
  // Build a regex that treats any whitespace in the selection as flexible whitespace
  const match = findWithNormalizedWhitespace(rawMarkdown, selectedText);
  if (match) return match;

  // Strategy 3: Try matching just the first and last segments to bracket the range
  const segments = selectedText.split(/\s+/).filter(Boolean);
  if (segments.length >= 2) {
    const first = segments[0];
    const last = segments[segments.length - 1];

    const firstIdx = rawMarkdown.indexOf(first);
    const lastIdx = rawMarkdown.lastIndexOf(last);

    if (firstIdx !== -1 && lastIdx !== -1 && lastIdx >= firstIdx) {
      return {
        startOffset: firstIdx,
        endOffset: lastIdx + last.length,
      };
    }
  }

  return null;
}

/**
 * Match selected text against raw markdown with flexible whitespace.
 * Collapses all whitespace runs in both strings to match against each other.
 */
function findWithNormalizedWhitespace(
  rawMarkdown: string,
  selectedText: string
): { startOffset: number; endOffset: number } | null {
  // Split selected text into non-whitespace tokens
  const tokens = selectedText.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  // Escape regex special chars in each token
  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // Build a regex where each token is separated by flexible whitespace (\s+)
  const pattern = escaped.join('\\s+');

  try {
    const regex = new RegExp(pattern);
    const match = regex.exec(rawMarkdown);
    if (match) {
      return {
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      };
    }
  } catch {
    // Regex too complex, fall through
  }

  return null;
}
