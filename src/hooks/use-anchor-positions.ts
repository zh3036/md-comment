"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Comment } from "@/lib/comments/types";
import type { AnchorStatus } from "@/lib/anchoring/resolve-anchor";

export interface AnchorPosition {
  commentId: string;
  top: number;
  status: AnchorStatus;
}

/**
 * Compute vertical positions for sidebar alignment.
 * Each comment's sidebar card should align with its highlight in the markdown.
 */
export function useAnchorPositions(
  comments: Comment[],
  containerRef: React.RefObject<HTMLElement | null>
): AnchorPosition[] {
  const [positions, setPositions] = useState<AnchorPosition[]>([]);
  const prevKeyRef = useRef("");

  // Stable comment IDs string for dependency tracking
  const commentIds = useMemo(
    () => comments.map((c) => c.id).join(","),
    [comments]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function recalculate() {
      const cont = containerRef.current;
      if (!cont) return;

      const containerRect = cont.getBoundingClientRect();
      const newPositions: AnchorPosition[] = [];

      for (const comment of comments) {
        const highlight = cont.querySelector(
          `[data-comment-id="${comment.id}"]`
        );

        if (highlight) {
          const rect = highlight.getBoundingClientRect();
          newPositions.push({
            commentId: comment.id,
            top: Math.round(rect.top - containerRect.top),
            status: (highlight.getAttribute("data-anchor-status") as AnchorStatus) || "exact",
          });
        } else {
          newPositions.push({
            commentId: comment.id,
            top: 0,
            status: "orphaned",
          });
        }
      }

      // Prevent overlapping: ensure minimum spacing of 120px
      newPositions.sort((a, b) => a.top - b.top);
      for (let i = 1; i < newPositions.length; i++) {
        const prev = newPositions[i - 1];
        if (newPositions[i].top < prev.top + 120) {
          newPositions[i] = { ...newPositions[i], top: prev.top + 120 };
        }
      }

      // Only update state if positions actually changed
      const key = newPositions
        .map((p) => `${p.commentId}:${p.top}:${p.status}`)
        .join("|");
      if (key !== prevKeyRef.current) {
        prevKeyRef.current = key;
        setPositions(newPositions);
      }
    }

    // Initial calculation with a small delay to let highlights render
    const timer = setTimeout(recalculate, 100);

    const observer = new ResizeObserver(recalculate);
    observer.observe(container);

    // Use passive scroll listener — no setState in hot path unless changed
    window.addEventListener("scroll", recalculate, { capture: true, passive: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("scroll", recalculate, true);
    };
  }, [commentIds, containerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return positions;
}
