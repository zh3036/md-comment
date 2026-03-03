"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommentAuthor } from "@/lib/comments/types";

interface CommentCardProps {
  author: CommentAuthor;
  body: string;
  createdAt: string;
}

export function CommentCard({ author, body, createdAt }: CommentCardProps) {
  const timeAgo = getTimeAgo(createdAt);

  return (
    <div className="flex gap-2">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={author.avatarUrl} alt={author.login} />
        <AvatarFallback className="text-[10px]">
          {author.login.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{author.login}</span>
          <span className="text-xs text-neutral-500 shrink-0">{timeAgo}</span>
        </div>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 whitespace-pre-wrap break-words">
          {body}
        </p>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
