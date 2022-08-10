import fs from 'fs';

export function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
}
