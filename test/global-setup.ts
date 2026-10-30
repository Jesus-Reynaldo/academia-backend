import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export default async function setup() {
  // Recreate the schema from scratch on the MySQL test database (DATABASE_URL from .env.test).
  execSync('npx prisma migrate reset --force', {
    cwd: rootDir,
    stdio: 'inherit',
  });
}
