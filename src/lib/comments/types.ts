export interface CommentAuthor {
  login: string;
  avatarUrl: string;
}

export interface CommentAnchor {
  selectedText: string;
  prefix: string;
  suffix: string;
  startOffset: number;
  endOffset: number;
  /** The commit SHA of the file when this comment was created */
  commitSha?: string;
}

export interface CommentReply {
  id: string;
  author: CommentAuthor;
  body: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  anchor: CommentAnchor;
  body: string;
  createdAt: string;
  resolved: boolean;
  replies: CommentReply[];
}

export interface CommentFileMetadata {
  repo: string;       // "owner/repo"
  branch: string;     // source branch being viewed
  filePath: string;   // "team/index.md"
  url: string;        // app URL to view this file
}

export interface CommentFile {
  version: number;
  metadata?: CommentFileMetadata;
  comments: Comment[];
}

export interface ResolvedAnchor {
  comment: Comment;
  startOffset: number;
  endOffset: number;
  status: "exact" | "fuzzy" | "orphaned";
}
