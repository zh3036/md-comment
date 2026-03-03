"use client";

import { useCallback, useEffect, useState } from "react";

export interface TextSelection {
  text: string;
  rect: DOMRect;
  anchorNode: Node;
  focusNode: Node;
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const handleMouseUp = useCallback(() => {
    // Small delay to let the selection finalize
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const container = containerRef.current;

      if (!container || !container.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }

      setSelection({
        text,
        rect: range.getBoundingClientRect(),
        anchorNode: sel.anchorNode!,
        focusNode: sel.focusNode!,
      });
    });
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  return { selection, clearSelection };
}
