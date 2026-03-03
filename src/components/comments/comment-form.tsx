"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (body: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = "Reply...",
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState("");
  const [isFocused, setIsFocused] = useState(autoFocus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (body.trim()) {
      onSubmit(body.trim());
      setBody("");
      setIsFocused(false);
    }
  };

  return (
    <div className="mt-2">
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className="min-h-[40px] text-sm resize-none"
        onFocus={() => setIsFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") {
            setIsFocused(false);
            onCancel?.();
          }
        }}
      />
      {isFocused && (
        <div className="flex justify-end gap-1 mt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              setBody("");
              setIsFocused(false);
              onCancel?.();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={!body.trim()}
            onClick={handleSubmit}
          >
            Reply
          </Button>
        </div>
      )}
    </div>
  );
}
