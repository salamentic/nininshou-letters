import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(resolve(__dirname, '../src/assets/nininshou.json'), 'utf-8'));

const outDir = resolve(__dirname, '../public/letters');
mkdirSync(outDir, { recursive: true });

const escape = s => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

let count = 0;
for (const envelope of data) {
  for (const page of envelope.pages) {
    let html;
    if (page.segments?.length) {
      html = page.segments
        .map(seg => `<p class="${seg.author === 'sensei' ? 'sensei' : 'boy'}">${escape(seg.text)}</p>`)
        .join('\n');
    } else {
      const cls = page.author === 'sensei' ? 'sensei' : 'boy';
      html = `<p class="${cls}">${escape(page.body ?? '')}</p>`;
    }
    writeFileSync(`${outDir}/${page.page}.html`, html + '\n', 'utf-8');
    count++;
  }
}
console.log(`Generated ${count} HTML pages → public/letters/`);
