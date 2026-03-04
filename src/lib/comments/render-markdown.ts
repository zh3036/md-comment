import type { CommentFile, Comment } from "./types";

/**
 * Render a CommentFile to a human-readable markdown string.
 */
export function renderCommentsMarkdown(commentFile: CommentFile): string {
  const meta = commentFile.metadata;
  const lines: string[] = [];

  lines.push("<!-- Auto-generated from comments JSON — do not edit manually -->");

  if (meta) {
    lines.push(`# Comments: ${meta.filePath}`);
    lines.push("");
    lines.push(`Repo: ${meta.repo} | Branch: ${meta.branch}`);
    lines.push(`View: ${meta.url}`);
  } else {
    lines.push("# Comments");
  }

  if (commentFile.comments.length === 0) {
    lines.push("");
    lines.push("*No comments yet.*");
    return lines.join("\n") + "\n";
  }

  for (const comment of commentFile.comments) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push(renderComment(comment));
  }

  return lines.join("\n") + "\n";
}

function renderComment(comment: Comment): string {
  const lines: string[] = [];
  const date = formatDate(comment.createdAt);

  lines.push(`## ${comment.author.login} — ${date}`);
  lines.push("");

  // Quoted selected text (truncate if very long)
  const selected = comment.anchor.selectedText;
  const truncated =
    selected.length > 200
      ? selected.slice(0, 200) + "…"
      : selected;
  // Collapse newlines for the quote
  lines.push(`> "${truncated.replace(/\n/g, " ")}"`);
  lines.push("");

  lines.push(comment.body);

  // Replies
  for (const reply of comment.replies) {
    const replyDate = formatDate(reply.createdAt);
    lines.push("");
    lines.push(`**${reply.author.login}** (reply, ${replyDate}): ${reply.body}`);
  }

  lines.push("");
  lines.push(`Status: ${comment.resolved ? "Resolved" : "Open"}`);

  return lines.join("\n");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 16);
}
