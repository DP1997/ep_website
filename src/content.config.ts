import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    location: z.string(),
    description: z.string(),
    date: z.string(),
    client: z.string(),
    image_layout: z.enum(['1-2', '1-3', '1-4']),
    image_dir: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = { works };