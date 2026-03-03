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

export interface CommentFile {
  version: number;
  comments: Comment[];
}

export interface ResolvedAnchor {
  comment: Comment;
  startOffset: number;
  endOffset: number;
  status: "exact" | "fuzzy" | "orphaned";
}
