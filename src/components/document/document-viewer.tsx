"use client";

import { useRef, useState, useCallback } from "react";
import { MarkdownRenderer } from "./markdown-renderer";
import { HighlightLayer } from "./highlight-layer";
import { SelectionHandler } from "./selection-handler";
import { CommentSidebar } from "../comments/comment-sidebar";
import { useComments } from "@/hooks/use-comments";
import { useTextSelection } from "@/hooks/use-text-selection";
import { useAnchorPositions } from "@/hooks/use-anchor-positions";
import { createAnchor, findSelectionInRawMarkdown } from "@/lib/anchoring/create-anchor";

interface DocumentViewerProps {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  content: string;
  commitSha: string;
  canWrite: boolean;
  userLogin: string;
  userAvatar: string;
}

export function DocumentViewer({
  owner,
  repo,
  branch,
  filePath,
  content,
  commitSha,
  canWrite,
  userLogin,
  userAvatar,
}: DocumentViewerProps) {
  const markdownRef = useRef<HTMLDivElement>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const {
    comments,
    isLoading,
    addNewComment,
    addNewReply,
    toggleResolve,
    removeComment,
  } = useComments(owner, repo, filePath);

  const { selection, clearSelection } = useTextSelection(markdownRef);
  const positions = useAnchorPositions(comments, markdownRef);

  const handleAddComment = useCallback(
    async (selectedText: string, body: string) => {
      const offsets = findSelectionInRawMarkdown(content, selectedText);
      if (!offsets) {
        console.error("Could not find selected text in raw markdown");
        return;
      }

      const anchor = createAnchor(
        content,
        selectedText,
        offsets.startOffset,
        offsets.endOffset
      );
      anchor.commitSha = commitSha;

      await addNewComment({
        author: { login: userLogin, avatarUrl: userAvatar },
        anchor,
        body,
      });

      clearSelection();
    },
    [content, addNewComment, clearSelection, userLogin, userAvatar]
  );

  const handleHighlightClick = useCallback((commentId: string) => {
    setActiveCommentId(commentId);
    // Scroll sidebar to the comment
    const sidebarEl = document.getElementById(`sidebar-${commentId}`);
    sidebarEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const handleSidebarCommentClick = useCallback((commentId: string) => {
    setActiveCommentId(commentId);
    // Scroll to the highlight in the markdown
    const highlight = document.querySelector(
      `[data-comment-id="${commentId}"]`
    );
    highlight?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="flex h-full">
      {/* Markdown content — 65% */}
      <div className="flex-1 overflow-auto" style={{ flex: "0 0 65%" }}>
        <div
          ref={markdownRef}
          className="max-w-4xl mx-auto px-8 py-6 relative"
          onClick={() => setActiveCommentId(null)}
        >
          <MarkdownRenderer content={content} />
          <HighlightLayer
            comments={comments}
            rawMarkdown={content}
            containerRef={markdownRef}
            activeCommentId={activeCommentId}
            onHighlightClick={handleHighlightClick}
          />
        </div>
      </div>

      {/* Comment sidebar — 35% */}
      <div className="border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950" style={{ flex: "0 0 35%" }}>
        {isLoading ? (
          <div className="p-4 text-sm text-neutral-400">Loading comments...</div>
        ) : (
          <CommentSidebar
            comments={comments}
            positions={positions}
            activeCommentId={activeCommentId}
            onCommentClick={handleSidebarCommentClick}
            onReply={addNewReply}
            onResolve={toggleResolve}
            onDelete={removeComment}
            canWrite={canWrite}
          />
        )}
      </div>

      {/* Selection popover */}
      {canWrite && (
        <SelectionHandler
          selection={selection}
          onAddComment={handleAddComment}
          onDismiss={clearSelection}
        />
      )}
    </div>
  );
}
