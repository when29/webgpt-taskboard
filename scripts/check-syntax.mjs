import { spawnSync } from 'node:child_process';
import { files } from './files.mjs';

for (const filename of files('.').filter((file) => file.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--preserve-symlinks', '--preserve-symlinks-main', '--check', filename], { shell: false, stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
console.log('All JavaScript modules compile.');
