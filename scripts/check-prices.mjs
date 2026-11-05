// Замок: цена живёт только в src/data/prices.json, который Аня правит в админке.
// Число с «₽», вписанное в код руками, после её правки показало бы старую цену — сборка падает.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const skip = new Set(['src/data', 'src/content']); // прайс и тексты статей Ани
const bad = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (skip.has(p)) continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(astro|ts|mjs|js)$/.test(p)) {
      readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
        // все формы цены руками: пробелы любого вида и их HTML-имена, знак рубля кодом и в теге, `${2200}`, {rub(2200)},
        // «руб.» и «р.» (веер и скептик починок 05.11)
        const plain = line.replace(/&(nbsp|thinsp|#160|#8239|#8201);/g, ' ').replace(/&#8381;/g, '₽').replace(/<[^>]+>/g, '');
        if (/\d[\d\s\u00a0\u2009\u202f})]*\s?(?:₽|руб|р\.)/.test(plain)) bad.push(`${p}:${i + 1}: ${line.trim()}`);
      });
    }
  }
};
walk('src');
if (bad.length) {
  console.error('Цена вписана в код руками — берите её из src/data/prices.json:\n' + bad.join('\n'));
  process.exit(1);
}
