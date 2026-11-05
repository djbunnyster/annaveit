// Три свежих поста канала с картинкой — для блока «Разборы в канале».
// Читает публичную ленту t.me/s/<канал>, картинки скачивает к себе (ссылки Telegram живут недолго).
// Не смог прочитать ленту — оставляет прошлый channel.json и громко пишет об этом: сборка не падает,
// но в логе Actions видно, что блок не обновился.
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';

const site = JSON.parse(await readFile(new URL('../src/data/site.json', import.meta.url), 'utf8'));
const OUT_JSON = new URL('../src/data/channel.json', import.meta.url);
const IMG_DIR = new URL('../public/uploads/tg/', import.meta.url);
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; veit-site-build)' };
// Посты, которые уже стоят на сайте кейсами «до и после», в блоке канала не повторяем
const casesDir = new URL('../src/content/cases/', import.meta.url);
const used = new Set();
for (const f of (await readdir(casesDir)).filter((f) => f.endsWith('.json'))) {
  try {
    const c = JSON.parse(await readFile(new URL(f, casesDir), 'utf8'));
    if (c.tg) used.add(String(c.tg));
  } catch (e) {
    console.warn(`!!! кейс ${f} не прочитан (${e.message}) — его пост может повториться в блоке канала`);
  }
}

const decode = (s) =>
  s.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')
   .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

try {
  const res = await fetch(`https://t.me/s/${site.channel}`, { headers: UA });
  if (!res.ok) throw new Error(`лента ответила ${res.status}`);
  const html = await res.text();
  const posts = [];
  for (const block of html.split('class="tgme_widget_message_wrap').slice(1)) {
    const id = block.match(/data-post="[^/]+\/(\d+)"/)?.[1];
    const img = block.match(/tgme_widget_message_photo_wrap[^>]*background-image:url\('([^']+)'\)/)?.[1];
    const textHtml = block.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/)?.[1];
    const date = block.match(/datetime="([^"]+)"/)?.[1];
    if (!id || !img || !textHtml || used.has(id)) continue;
    // Эмодзи из постов на сайт не переносим: на сайте свои иконки, а не системные смайлы
    const clean = decode(textHtml).replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '').replace(/[ \t]{2,}/g, ' ');
    const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
    posts.push({ id, img, date, title: lines[0], text: lines.slice(1).join(' ') });
  }
  const fresh = posts.sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 3);
  if (fresh.length === 0) throw new Error('в ленте не нашлось постов с картинкой и текстом');

  // Сначала все картинки в память; старые файлы трогаем, только когда скачалось всё —
  // иначе сбой на середине оставил бы прошлый channel.json с удалёнными картинками
  const files = [];
  for (const p of fresh) {
    const r = await fetch(p.img, { headers: UA });
    if (!r.ok) throw new Error(`картинка поста ${p.id}: ${r.status}`);
    files.push([`post-${p.id}.jpg`, Buffer.from(await r.arrayBuffer())]);
    p.img = `/uploads/tg/post-${p.id}.jpg`;
  }
  await mkdir(IMG_DIR, { recursive: true });
  for (const f of await readdir(IMG_DIR)) await unlink(new URL(f, IMG_DIR));
  for (const [name, buf] of files) await writeFile(new URL(name, IMG_DIR), buf);
  await writeFile(OUT_JSON, JSON.stringify({ updated: new Date().toISOString(), posts: fresh }, null, 2));
  console.log(`канал: ${fresh.map((p) => p.id).join(', ')}`);
} catch (e) {
  console.warn(`\n!!! КАНАЛ НЕ ОБНОВЛЁН: ${e.message}. На сайте остаются прошлые посты.\n`);
}
