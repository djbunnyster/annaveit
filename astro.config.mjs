import { defineConfig } from 'astro/config';

// Адрес сайта и подпапка задаются при сборке (переменные репозитория SITE_URL и SITE_BASE). Умолчание — боевой домен:
// пропади переменные, сайт соберётся под annaveit.ru, а не под чужой подпапкой (веер 05.11).
const base = process.env.SITE_BASE || '/';

// Картинки, вставленные в текст статьи через админку, приходят как «/uploads/…» — приклеиваем подпапку сайта
function uploadsBase() {
  const prefix = base.replace(/\/$/, '');
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'img' && typeof node.properties?.src === 'string' && node.properties.src.startsWith('/uploads/')) {
      node.properties.src = prefix + node.properties.src;
    }
    (node.children || []).forEach(walk);
  };
  return (tree) => { walk(tree); };
}

export default defineConfig({
  site: process.env.SITE_URL || 'https://annaveit.ru',
  base,
  trailingSlash: 'always',
  markdown: { rehypePlugins: [uploadsBase] },
});
