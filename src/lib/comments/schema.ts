import { z } from "zod/v4";

const commentAuthorSchema = z.object({
  login: z.string(),
  avatarUrl: z.string(),
});

const commentAnchorSchema = z.object({
  selectedText: z.string(),
  prefix: z.string(),
  suffix: z.string(),
  startOffset: z.number(),
  endOffset: z.number(),
  commitSha: z.string().optional(),
});

const commentReplySchema = z.object({
  id: z.string(),
  author: commentAuthorSchema,
  body: z.string(),
  createdAt: z.string(),
});

const commentSchema = z.object({
  id: z.string(),
  author: commentAuthorSchema,
  anchor: commentAnchorSchema,
  body: z.string(),
  createdAt: z.string(),
  resolved: z.boolean(),
  replies: z.array(commentReplySchema),
});

const commentFileMetadataSchema = z.object({
  repo: z.string(),
  branch: z.string(),
  filePath: z.string(),
  url: z.string(),
});

export const commentFileSchema = z.object({
  version: z.number(),
  metadata: commentFileMetadataSchema.optional(),
  comments: z.array(commentSchema),
});
