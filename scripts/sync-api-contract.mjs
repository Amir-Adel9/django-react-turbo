/**
 * Copies apps/api/openapi.yml to packages/api-contract/openapi.yml.
 * Run from repo root after: pnpm --filter api gen-schema
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'apps', 'api', 'openapi.yml');
const dest = join(root, 'packages', 'api-contract', 'openapi.yml');

if (!existsSync(src)) {
  console.error('Missing apps/api/openapi.yml. Run: pnpm --filter api gen-schema');
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log('Synced openapi.yml to packages/api-contract/');
