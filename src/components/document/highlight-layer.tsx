"use client";

import { useEffect, useState, useCallback } from "react";
import type { Comment } from "@/lib/comments/types";
import { resolveAnchor, type AnchorStatus } from "@/lib/anchoring/resolve-anchor";

interface HighlightLayerProps {
  comments: Comment[];
  rawMarkdown: string;
  containerRef: React.RefObject<HTMLElement | null>;
  activeCommentId: string | null;
  onHighlightClick: (commentId: string) => void;
}

interface HighlightRect {
  commentId: string;
  status: AnchorStatus;
  rects: DOMRect[];
}

/**
 * Highlight layer renders as a visual overlay on top of the markdown.
 * It NEVER mutates the markdown DOM — only reads text positions.
 */
export function HighlightLayer({
  comments,
  rawMarkdown,
  containerRef,
  activeCommentId,
  onHighlightClick,
}: HighlightLayerProps) {
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Collect all text nodes in a single read-only walk
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    // Build concatenated text + offset map.
    // Insert a virtual space between text nodes from different block-level
    // parents (e.g., different <td>, <p>, <h2>) so that table cell text
    // doesn't merge into one unsearchable string.
    let fullText = "";
    const nodeOffsets: { node: Text; start: number; end: number }[] = [];
    let lastBlock: Element | null = null;

    for (const tn of textNodes) {
      const block = getBlockAncestor(tn);
      if (lastBlock && block !== lastBlock) {
        fullText += " "; // virtual space — not mapped to any text node
      }
      lastBlock = block;

      const content = tn.textContent || "";
      nodeOffsets.push({ node: tn, start: fullText.length, end: fullText.length + content.length });
      fullText += content;
    }

    const unresolvedComments = comments.filter((c) => !c.resolved);
    const newHighlights: HighlightRect[] = [];

    for (const comment of unresolvedComments) {
      const resolved = resolveAnchor(rawMarkdown, comment.anchor);
      if (resolved.status === "orphaned") continue;

      const rawText = rawMarkdown.slice(resolved.startOffset, resolved.endOffset);
      const match = findNormalized(fullText, rawText);
      if (!match) continue;

      // Build a Range to get bounding rects — read only, no DOM mutation
      const rects = getRangeRects(nodeOffsets, match.start, match.end);
      if (rects.length > 0) {
        newHighlights.push({
          commentId: comment.id,
          status: resolved.status,
          rects,
        });
      }
    }

    setHighlights(newHighlights);
  }, [comments, rawMarkdown, containerRef]);

  useEffect(() => {
    // Recalculate after render + small delay for layout
    const timer = setTimeout(recalculate, 50);

    // Recalculate on scroll/resize
    const container = containerRef.current;
    const observer = container ? new ResizeObserver(recalculate) : null;
    if (container) observer?.observe(container);

    window.addEventListener("scroll", recalculate, { capture: true, passive: true });

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      window.removeEventListener("scroll", recalculate, true);
    };
  }, [recalculate, containerRef]);

  const container = containerRef.current;
  if (!container || highlights.length === 0) return null;

  const containerRect = container.getBoundingClientRect();

  return (
    <div
      className="pointer-events-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {highlights.map((hl) =>
        hl.rects.map((rect, i) => (
          <div
            key={`${hl.commentId}-${i}`}
            data-comment-id={hl.commentId}
            data-anchor-status={hl.status}
            className={`pointer-events-auto cursor-pointer rounded-sm transition-colors ${
              activeCommentId === hl.commentId
                ? "bg-yellow-300/50 dark:bg-yellow-600/50"
                : "bg-yellow-200/40 dark:bg-yellow-900/30 hover:bg-yellow-300/50 dark:hover:bg-yellow-700/40"
            }`}
            style={{
              position: "absolute",
              left: rect.left - containerRect.left,
              top: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onHighlightClick(hl.commentId);
            }}
          />
        ))
      )}
    </div>
  );
}

/**
 * Get bounding client rects for a text range WITHOUT modifying the DOM.
 */
function getRangeRects(
  nodeOffsets: { node: Text; start: number; end: number }[],
  matchStart: number,
  matchEnd: number
): DOMRect[] {
  const range = document.createRange();
  let startSet = false;
  let endSet = false;

  for (const { node: tn, start, end } of nodeOffsets) {
    if (!startSet) {
      if (matchStart >= start && matchStart < end) {
        // Position is inside this text node
        range.setStart(tn, matchStart - start);
        startSet = true;
      } else if (matchStart < start) {
        // Position fell in a virtual-space gap — snap to start of next node
        range.setStart(tn, 0);
        startSet = true;
      }
    }
    if (startSet && !endSet) {
      if (matchEnd > start && matchEnd <= end) {
        range.setEnd(tn, matchEnd - start);
        endSet = true;
        break;
      } else if (matchEnd <= start) {
        // End fell in a virtual-space gap — snap to end of previous node
        break;
      }
    }
  }

  if (startSet && !endSet) {
    const last = nodeOffsets[nodeOffsets.length - 1];
    range.setEnd(last.node, last.node.textContent?.length ?? 0);
  }

  if (!startSet) return [];

  // getClientRects returns one rect per line for multi-line selections
  return Array.from(range.getClientRects());
}

/**
 * Strip markdown formatting (both block-level and inline) to approximate DOM text.
 * This bridges the gap between raw markdown anchors and rendered DOM content.
 */
function stripMarkdown(s: string): string {
  return s
    // Block-level: heading markers
    .replace(/^#{1,6}\s+/gm, "")
    // Block-level: table pipes (leading, trailing, and separators)
    .replace(/^\||\|$/gm, "")
    .replace(/\|/g, " ")
    // Block-level: table separator rows (e.g., |---|---|)
    .replace(/^[\s|:-]+$/gm, "")
    // Block-level: list markers
    .replace(/^(\s*)[-*+]\s+/gm, "$1")
    .replace(/^(\s*)\d+\.\s+/gm, "$1")
    // Block-level: blockquote markers
    .replace(/^>\s?/gm, "")
    // Block-level: horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Inline: images ![alt](url) → alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Inline: links [text](url) → text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Inline: bold/italic (must be before single *)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Inline: strikethrough
    .replace(/~~(.*?)~~/g, "$1")
    // Inline: code
    .replace(/`([^`]*)`/g, "$1")
    // Cleanup: remove any remaining lone formatting chars (from truncated selections)
    .replace(/[`*_~]/g, "");
}

/**
 * Find `text` (which may contain raw markdown formatting) in `fullText` (DOM text).
 */
function findNormalized(
  fullText: string,
  text: string
): { start: number; end: number } | null {
  const exactIdx = fullText.indexOf(text);
  if (exactIdx !== -1) {
    return { start: exactIdx, end: exactIdx + text.length };
  }

  const stripped = stripMarkdown(text).replace(/\s+/g, " ").trim();
  if (!stripped) return null;

  const origPositions: number[] = [];
  let normalized = "";
  let prevWasSpace = false;

  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    if (/\s/.test(ch)) {
      if (!prevWasSpace) {
        normalized += " ";
        origPositions.push(i);
        prevWasSpace = true;
      }
    } else {
      normalized += ch;
      origPositions.push(i);
      prevWasSpace = false;
    }
  }

  const idx = normalized.indexOf(stripped);
  if (idx === -1) return null;

  const lastMatchedIdx = idx + stripped.length - 1;
  const origStart = origPositions[idx];
  const origEnd = lastMatchedIdx + 1 < origPositions.length
    ? origPositions[lastMatchedIdx + 1]
    : origPositions[lastMatchedIdx] + 1;

  return { start: origStart, end: origEnd };
}

const BLOCK_TAGS = new Set([
  "P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6",
  "LI", "TD", "TH", "TR", "BLOCKQUOTE", "PRE", "SECTION", "ARTICLE",
]);

/**
 * Walk up from a text node to find its nearest block-level ancestor.
 */
function getBlockAncestor(node: Node): Element | null {
  let el = node.parentElement;
  while (el) {
    if (BLOCK_TAGS.has(el.tagName)) return el;
    el = el.parentElement;
  }
  return null;
}
