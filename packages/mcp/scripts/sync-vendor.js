import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoUtilsDir = path.resolve(__dirname, '../../../src/utils');
const vendorUtilsDir = path.resolve(__dirname, '../vendor/utils');

if (!fs.existsSync(repoUtilsDir)) {
  console.error(`Source utils directory not found at ${repoUtilsDir}`);
  process.exit(1);
}

fs.rmSync(vendorUtilsDir, { recursive: true, force: true });
fs.mkdirSync(vendorUtilsDir, { recursive: true });

for (const entry of fs.readdirSync(repoUtilsDir)) {
  if (entry.endsWith('.js')) {
    fs.copyFileSync(path.join(repoUtilsDir, entry), path.join(vendorUtilsDir, entry));
  }
}
