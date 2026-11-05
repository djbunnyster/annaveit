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
        if (/\d[\d\s ]*\s?₽/.test(line)) bad.push(`${p}:${i + 1}: ${line.trim()}`);
      });
    }
  }
};
walk('src');
if (bad.length) {
  console.error('Цена вписана в код руками — берите её из src/data/prices.json:\n' + bad.join('\n'));
  process.exit(1);
}
