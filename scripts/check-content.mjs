// Замок перед сборкой: дата статьи — только ГГГГ-ММ-ДД, так её пишет админка (admin.annaveit.ru).
// Повод (01.11): прежняя админка записала «01.11.2026», сборка прочла его как 11 января, а «25.11.2026» роняло сборку
// целиком — сайт тихо переставал обновляться. Статья с другой датой — громкий отказ здесь, а не тихая поломка.
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../src/content/posts/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
if (!files.length) {
  console.error('check-content: статей не найдено — замку нечего проверять, проверь путь');
  process.exit(1);
}
const bad = files.filter((f) => {
  const head = readFileSync(new URL(f, dir), 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const date = head?.[1].match(/^date:\s*['"]?([^'"\n]*)['"]?\s*$/m)?.[1];
  return !date || !/^\d{4}-\d{2}-\d{2}$/.test(date);
});
if (bad.length) {
  console.error(`check-content: дата статьи не в формате ГГГГ-ММ-ДД: ${bad.join(', ')}`);
  process.exit(1);
}
console.log(`check-content: статей ${files.length}, даты в ГГГГ-ММ-ДД`);
