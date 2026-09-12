import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { files } from './files.mjs';

fs.mkdirSync('dist', { recursive: true });
const manifest = {};
for (const base of ['public', 'src']) {
  for (const filename of files(base)) {
    const destination = base === 'public'
      ? path.join('dist', path.relative('public', filename))
      : path.join('dist', filename);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(filename, destination);
    manifest[path.relative('dist', destination).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex');
  }
}
fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Built ${Object.keys(manifest).length} static assets.`);
