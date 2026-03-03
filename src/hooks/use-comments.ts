"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { getComments } from "@/actions/get-comments";
import { addComment, addReply, resolveComment, deleteComment } from "@/actions/save-comment";
import type { Comment, CommentFile } from "@/lib/comments/types";

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: Error | undefined;
  addNewComment: (
    comment: Omit<Comment, "id" | "createdAt" | "resolved" | "replies">
  ) => Promise<Comment>;
  addNewReply: (commentId: string, body: string) => Promise<void>;
  toggleResolve: (commentId: string, resolved: boolean) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  refresh: () => void;
}

export function useComments(
  owner: string,
  repo: string,
  filePath: string
): UseCommentsReturn {
  const key = `comments:${owner}/${repo}/${filePath}`;

  const { data, error, isLoading, mutate } = useSWR<{
    data: CommentFile;
    sha: string | null;
  }>(key, () => getComments(owner, repo, filePath), {
    revalidateOnFocus: true,
    refreshInterval: 30000, // Poll every 30s for other users' changes
  });

  const comments = data?.data.comments ?? [];

  const addNewComment = useCallback(
    async (
      comment: Omit<Comment, "id" | "createdAt" | "resolved" | "replies">
    ) => {
      const newComment = await addComment(owner, repo, filePath, comment);
      mutate();
      return newComment;
    },
    [owner, repo, filePath, mutate]
  );

  const addNewReply = useCallback(
    async (commentId: string, body: string) => {
      await addReply(owner, repo, filePath, commentId, body);
      mutate();
    },
    [owner, repo, filePath, mutate]
  );

  const toggleResolve = useCallback(
    async (commentId: string, resolved: boolean) => {
      await resolveComment(owner, repo, filePath, commentId, resolved);
      mutate();
    },
    [owner, repo, filePath, mutate]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      await deleteComment(owner, repo, filePath, commentId);
      mutate();
    },
    [owner, repo, filePath, mutate]
  );

  return {
    comments,
    isLoading,
    error,
    addNewComment,
    addNewReply,
    toggleResolve,
    removeComment,
    refresh: () => mutate(),
  };
}
