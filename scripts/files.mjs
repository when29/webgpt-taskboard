import fs from 'node:fs';
import path from 'node:path';

export function files(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', 'dist'].includes(entry.name) || entry.name.startsWith('.writer')) return [];
    const filename = path.join(root, entry.name);
    return entry.isDirectory() ? files(filename) : [filename];
  });
}
