import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    location: z.string().optional(),
    description: z.string().optional(),
    short: z.string().optional(),
    date: z.string(),
    client: z.string().optional(),
    image_layout: z.enum(['1-2', '1-3', '1-4']).optional(),
    image_dir: z.string(),
    format: z.string().optional(),
    technik: z.string().optional(),
    fotograf: z.string().optional(),
    tags: z.object({
      type: z.array(z.string()),
      location: z.array(z.string()),
      material: z.array(z.string()),
    }),
  }),
});

export const collections = { works };
