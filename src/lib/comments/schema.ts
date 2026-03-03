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

export const commentFileSchema = z.object({
  version: z.number(),
  comments: z.array(commentSchema),
});
