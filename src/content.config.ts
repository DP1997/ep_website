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
    sortOrder: z.number().optional(),
    client: z.string().optional(),
    image_layout: z.enum(['1-2', '1-3', '1-4', '1-5']).optional(),
    image_dir: z.string(),
    gallery_reverse: z.boolean().optional(),
    gallery_max_height: z.number().optional(),
    gallery_main_position: z.enum(['top', 'center', 'bottom']).optional(),
    format: z.string().optional(),
    technik: z.string().optional(),
    fotograf: z.string().optional(),
    tags: z.object({
      kategorie: z.array(z.string()),
      kontext: z.array(z.string()),
      gebaeudetyp: z.array(z.string()),
      material: z.array(z.string()),
    }),
  }),
});

export const collections = { works };
