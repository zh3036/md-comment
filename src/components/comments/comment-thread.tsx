"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommentCard } from "./comment-card";
import { CommentForm } from "./comment-form";
import type { Comment } from "@/lib/comments/types";

interface CommentThreadProps {
  comment: Comment;
  isActive: boolean;
  onClick: () => void;
  onReply: (body: string) => void;
  onResolve: (resolved: boolean) => void;
  onDelete: () => void;
  canWrite: boolean;
}

export function CommentThread({
  comment,
  isActive,
  onClick,
  onReply,
  onResolve,
  onDelete,
  canWrite,
}: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <Card
      className={`p-3 transition-all cursor-pointer ${
        isActive
          ? "ring-2 ring-yellow-400 dark:ring-yellow-600 shadow-md"
          : "hover:shadow-sm"
      } ${comment.resolved ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Quoted text snippet */}
      <div className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800 rounded px-2 py-1 mb-2 truncate border-l-2 border-yellow-400">
        &ldquo;{comment.anchor.selectedText.slice(0, 80)}
        {comment.anchor.selectedText.length > 80 ? "..." : ""}&rdquo;
      </div>

      {/* Root comment */}
      <CommentCard
        author={comment.author}
        body={comment.body}
        createdAt={comment.createdAt}
      />

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-4 mt-2 space-y-2 border-l-2 border-neutral-100 dark:border-neutral-800 pl-3">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              author={reply.author}
              body={reply.body}
              createdAt={reply.createdAt}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      {canWrite && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyForm(!showReplyForm);
            }}
          >
            Reply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onResolve(!comment.resolved);
            }}
          >
            {comment.resolved ? "Reopen" : "Resolve"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </Button>
          {comment.resolved && (
            <Badge variant="outline" className="ml-auto text-[10px] h-5">
              Resolved
            </Badge>
          )}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && canWrite && (
        <div onClick={(e) => e.stopPropagation()}>
          <CommentForm
            autoFocus
            onSubmit={(body) => {
              onReply(body);
              setShowReplyForm(false);
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </Card>
  );
}
