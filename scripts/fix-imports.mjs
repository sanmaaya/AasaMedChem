import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const root = join(process.cwd(), 'src');

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) fixFile(p);
  }
}

function fixFile(path) {
  let content = readFileSync(path, 'utf8');
  const next = content
    .replace(/(@\/[^'"]+)\.(jsx|js)(?=['"])/g, '$1')
    .replace(/(from ['"]\.\/[^'"]+)\.js(?=['"])/g, '$1');
  if (next !== content) writeFileSync(path, next);
}

walk(root);
console.log('Fixed import extensions in src/');
