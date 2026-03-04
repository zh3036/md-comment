import type { CommentFile, Comment } from "./types";

/**
 * Merge two versions of a comment file.
 * Strategy: union of comments by ID, preferring the version with more replies.
 */
export function mergeCommentFiles(
  local: CommentFile,
  remote: CommentFile
): CommentFile {
  const commentMap = new Map<string, Comment>();

  // Add all remote comments first
  for (const comment of remote.comments) {
    commentMap.set(comment.id, comment);
  }

  // Merge local comments
  for (const comment of local.comments) {
    const existing = commentMap.get(comment.id);
    if (!existing) {
      commentMap.set(comment.id, comment);
    } else {
      // Keep whichever has more replies, or the more recently updated one
      const merged = mergeComment(existing, comment);
      commentMap.set(comment.id, merged);
    }
  }

  return {
    version: Math.max(local.version, remote.version),
    metadata: local.metadata ?? remote.metadata,
    comments: Array.from(commentMap.values()).sort(
      (a, b) => a.anchor.startOffset - b.anchor.startOffset
    ),
  };
}

function mergeComment(a: Comment, b: Comment): Comment {
  // Merge replies by union
  const replyMap = new Map<string, (typeof a.replies)[number]>();
  for (const reply of a.replies) replyMap.set(reply.id, reply);
  for (const reply of b.replies) replyMap.set(reply.id, reply);

  const mergedReplies = Array.from(replyMap.values()).sort(
    (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
  );

  // Use the latest version's resolved status
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  const latest = aTime >= bTime ? a : b;

  return {
    ...latest,
    replies: mergedReplies,
  };
}
