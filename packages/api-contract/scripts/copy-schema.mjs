import { mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const destDir = join(root, 'dist', 'generated');
const src = join(root, 'src', 'generated', 'schema.d.ts');
const dest = join(destDir, 'schema.d.ts');

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
