/**
 * Sentinel Health Production Entry Point
 * Satisfies Cloud Run startup command: node server.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundledPath = path.resolve(__dirname, 'server.bundle.js');

if (fs.existsSync(bundledPath)) {
  await import('./server.bundle.js');
} else {
  // In development, load server implementation
  await import('./server/serverImpl.ts');
}
