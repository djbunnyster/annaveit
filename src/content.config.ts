import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Админка пишет пустые поля как '' — для сайта это «нет значения», а не пустая ссылка
const opt = z.string().optional().transform((v) => v || undefined);
// Дата статьи: админка хранит YYYY-MM-DD; старые записи DD.MM.YYYY читаем как день.месяц, а не как месяц.день
const date = z.preprocess((v) => {
  if (typeof v === 'string') {
    const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  }
  return v;
}, z.coerce.date());

// Работы, кейсы, статьи и отзывы Аня добавляет сама через админку на admin.annaveit.ru (она пишет эти файлы в репозиторий).
const works = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    niche: z.string(),
    image: z.string(),
    video: opt,
    order: z.number().default(100),
    hero: z.boolean().default(false),
  }),
});

const cases = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    before: z.string(),
    after: z.string(),
    problem: z.string(),
    solution: z.string(),
    tg: z.number().optional(),
    order: z.number().default(100),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date,
    cover: opt,
    excerpt: opt,
  }),
});

// Отзывы клиентов: только настоящие. Пока нет ни одного, раздела на сайте нет.
const reviews = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/reviews' }),
  schema: z.object({
    name: z.string(),
    shop: opt,
    text: z.string(),
    image: opt,
    order: z.number().default(100),
  }),
});

export const collections = { works, cases, posts, reviews };
