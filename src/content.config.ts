import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      pinned: z.boolean().optional(),
      order: z.number().optional(),
      image: image().optional(),
      coverImage: z.url().or(z.string().startsWith('/')).optional(),
      canonicalURL: z.url().optional(),
      license: z
        .object({
          type: z
            .enum([
              'cc-by-nc-sa-4.0',
              'no-repost',
              'original',
              'internet',
              'repost-allowed',
              'paid-repost',
              'type1',
              'type2',
              'type3',
              'type4',
              'type5',
              'type6',
            ])
            .optional(),
          author: z.string().optional(),
          sourceTitle: z.string().optional(),
          sourceUrl: z.url().optional(),
        })
        .or(z.literal(false))
        .optional(),
      keywords: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      authors: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
    }),
})

const authors = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    pronouns: z.string().optional(),
    avatar: z.url().or(z.string().startsWith('/')),
    bio: z.string().optional(),
    mail: z.email().optional(),
    website: z.url().optional(),
    twitter: z.url().optional(),
    github: z.url().optional(),
    linkedin: z.url().optional(),
    discord: z.url().optional(),
  }),
})

export const collections = { blog, authors }
