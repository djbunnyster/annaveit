import { defineConfig } from 'astro/config';

// Адрес сайта и подпапка задаются при сборке: на GitHub Pages сайт живёт в /veit-design/,
// а на своём домене .ru подпапки не будет (переменные репозитория SITE_URL и SITE_BASE=/).
const base = process.env.SITE_BASE || '/veit-design/';

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
  site: process.env.SITE_URL || 'https://djbunnyster.github.io',
  base,
  trailingSlash: 'always',
  markdown: { rehypePlugins: [uploadsBase] },
});
