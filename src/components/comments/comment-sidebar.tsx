"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentThread } from "./comment-thread";
import type { Comment } from "@/lib/comments/types";
import type { AnchorPosition } from "@/hooks/use-anchor-positions";

interface CommentSidebarProps {
  comments: Comment[];
  positions: AnchorPosition[];
  activeCommentId: string | null;
  onCommentClick: (commentId: string) => void;
  onReply: (commentId: string, body: string) => void;
  onResolve: (commentId: string, resolved: boolean) => void;
  onDelete: (commentId: string) => void;
  canWrite: boolean;
}

export function CommentSidebar({
  comments,
  positions,
  activeCommentId,
  onCommentClick,
  onReply,
  onResolve,
  onDelete,
  canWrite,
}: CommentSidebarProps) {
  // Separate active and resolved comments
  const activeComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);
  const orphanedComments = comments.filter((c) => {
    const pos = positions.find((p) => p.commentId === c.id);
    return pos?.status === "orphaned";
  });

  const getPosition = (commentId: string) => {
    return positions.find((p) => p.commentId === commentId);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2 relative">
        {/* Comments header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Comments ({activeComments.length})
          </h3>
        </div>

        {/* Active comments positioned relative to their anchors */}
        {activeComments.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-8">
            Select text to add a comment
          </p>
        )}

        {activeComments
          .filter((c) => {
            const pos = getPosition(c.id);
            return pos?.status !== "orphaned";
          })
          .map((comment) => (
            <div key={comment.id} id={`sidebar-${comment.id}`}>
              <CommentThread
                comment={comment}
                isActive={activeCommentId === comment.id}
                onClick={() => onCommentClick(comment.id)}
                onReply={(body) => onReply(comment.id, body)}
                onResolve={(resolved) => onResolve(comment.id, resolved)}
                onDelete={() => onDelete(comment.id)}
                canWrite={canWrite}
              />
            </div>
          ))}

        {/* Orphaned comments */}
        {orphanedComments.length > 0 && (
          <>
            <div className="mt-6 mb-2">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Orphaned Comments
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Text no longer found in document
              </p>
            </div>
            {orphanedComments.map((comment) => (
              <div key={comment.id} id={`sidebar-${comment.id}`}>
                <CommentThread
                  comment={comment}
                  isActive={activeCommentId === comment.id}
                  onClick={() => onCommentClick(comment.id)}
                  onReply={(body) => onReply(comment.id, body)}
                  onResolve={(resolved) => onResolve(comment.id, resolved)}
                  onDelete={() => onDelete(comment.id)}
                  canWrite={canWrite}
                />
              </div>
            ))}
          </>
        )}

        {/* Resolved comments */}
        {resolvedComments.length > 0 && (
          <>
            <div className="mt-6 mb-2">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Resolved ({resolvedComments.length})
              </h4>
            </div>
            {resolvedComments.map((comment) => (
              <div key={comment.id} id={`sidebar-${comment.id}`}>
                <CommentThread
                  comment={comment}
                  isActive={activeCommentId === comment.id}
                  onClick={() => onCommentClick(comment.id)}
                  onReply={(body) => onReply(comment.id, body)}
                  onResolve={(resolved) => onResolve(comment.id, resolved)}
                  onDelete={() => onDelete(comment.id)}
                  canWrite={canWrite}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
