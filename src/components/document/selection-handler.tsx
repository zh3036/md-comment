"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TextSelection } from "@/hooks/use-text-selection";

interface SelectionHandlerProps {
  selection: TextSelection | null;
  onAddComment: (text: string, body: string) => void;
  onDismiss: () => void;
}

export function SelectionHandler({
  selection,
  onAddComment,
  onDismiss,
}: SelectionHandlerProps) {
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState("");
  // Captured selection data — persists even after browser selection collapses
  const [captured, setCaptured] = useState<{ text: string; rect: DOMRect } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When a new browser selection appears, show the popover (but don't reset if we're in form mode)
  useEffect(() => {
    if (selection && !showForm) {
      setCaptured({ text: selection.text, rect: selection.rect });
    }
  }, [selection, showForm]);

  // When selection is dismissed externally and we're NOT showing the form, reset
  useEffect(() => {
    if (!selection && !showForm) {
      setCaptured(null);
      setBody("");
    }
  }, [selection, showForm]);

  useEffect(() => {
    if (showForm && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showForm]);

  const dismiss = useCallback(() => {
    setShowForm(false);
    setCaptured(null);
    setBody("");
    onDismiss();
  }, [onDismiss]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        dismiss();
      }
    }
    if (captured) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [captured, dismiss]);

  if (!captured) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg"
      style={{
        top: Math.min(captured.rect.bottom + 8, window.innerHeight - (showForm ? 200 : 48)),
        left: Math.max(8, Math.min(captured.rect.left, window.innerWidth - 320)),
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {!showForm ? (
        <Button
          size="sm"
          variant="ghost"
          className="px-3 py-1.5 text-sm font-medium"
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent browser from collapsing selection
            e.stopPropagation();
          }}
          onClick={() => setShowForm(true)}
        >
          + Add Comment
        </Button>
      ) : (
        <div className="p-3 w-72">
          <div className="mb-2 text-xs text-neutral-500 truncate">
            &ldquo;{captured.text.slice(0, 60)}
            {captured.text.length > 60 ? "..." : ""}&rdquo;
          </div>
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add your comment..."
            className="mb-2 min-h-[60px] text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (body.trim()) {
                  onAddComment(captured.text, body.trim());
                  dismiss();
                }
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!body.trim()}
              onClick={() => {
                onAddComment(captured.text, body.trim());
                dismiss();
              }}
            >
              Comment
            </Button>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">
            Cmd+Enter to submit
          </div>
        </div>
      )}
    </div>
  );
}
