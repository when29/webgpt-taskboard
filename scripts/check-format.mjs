import fs from 'node:fs';
import { files } from './files.mjs';

let failures = 0;
for (const filename of files('.')) {
  const content = fs.readFileSync(filename, 'utf8');
  if (/[\t ]+\r?$/m.test(content) || (content.length && !content.endsWith('\n'))) {
    console.error(`${filename}: trailing whitespace or missing final newline`);
    failures++;
  }
}
if (failures) process.exitCode = 1;
else console.log('Whitespace and final newlines passed.');
