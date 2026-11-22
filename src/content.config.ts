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
    image_layout: z.enum(['1-1', '1-2', '1-3', '1-3e', '1-4', '1-4w', '1-5']).optional(),
    image_dir: z.string(),
    gallery_reverse: z.boolean().optional(),
    gallery_swap: z.boolean().optional(),
    meta_span: z.number().int().min(1).optional(),
    copy_align: z.enum(['top', 'center', 'bottom']).optional(),
    copy_image: z.number().optional(),
    copy_image_h: z.number().optional(),
    strip_break: z.boolean().optional(),
    hero_fit: z.boolean().optional(),
    hero_side: z.boolean().optional(),
    hero_side_align: z.enum(['bottom']).optional(),
    villa: z.boolean().optional(),
    impuls: z.boolean().optional(),
    stack_copy_stacked: z.boolean().optional(),
    dim_layout: z.enum(['kompakt', 'stack', 'reihen', 'band']).optional(),
    gallery_max_height: z.number().optional(),
    gallery_main_position: z.enum(['top', 'center', 'bottom']).optional(),
    lightbox_max: z.boolean().optional(),
    dim: z.boolean().optional(),
    variant_of: z.string().optional(),
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

const projektstudien = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projektstudien' }),
  schema: z.object({
    title: z.string(),
    location: z.string().optional(),
    year: z.string().optional(),
    client: z.string().optional(),
    material: z.string().optional(),
    image_dir: z.string(),
    images: z.array(z.string()).optional(),
  }),
});

export const collections = { works, projektstudien };
