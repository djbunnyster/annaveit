import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Карта сайта для Яндекса и Google: главная, список статей и каждая статья
export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const posts = await getCollection('posts');
  const urls = [base, `${base}blog/`, ...posts.map((p) => `${base}blog/${p.id}/`)].map((p) => new URL(p, site).href);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
