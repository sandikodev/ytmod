import { z } from 'zod'

// YouTube comment schemas
export const CommentSchema = z.object({
  id: z.string(),
  author: z.string(),
  text: z.string(),
  likeCount: z.number(),
  publishedAt: z.string(),
  replyCount: z.number().optional(),
})

export const CommentsResponseSchema = z.object({
  videoId: z.string(),
  videoTitle: z.string().optional(),
  totalComments: z.number(),
  comments: z.array(CommentSchema),
  nextPageToken: z.string().optional(),
})

export const CommentsQuerySchema = z.object({
  videoId: z.string().min(1),
  maxResults: z.coerce.number().min(1).max(100).default(20),
  pageToken: z.string().optional(),
  order: z.enum(['time', 'relevance']).default('relevance'),
})

export type Comment = z.infer<typeof CommentSchema>
export type CommentsResponse = z.infer<typeof CommentsResponseSchema>
export type CommentsQuery = z.infer<typeof CommentsQuerySchema>
