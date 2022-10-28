import { createHash } from 'crypto';

export function computeHash(content: string) {
  return createHash('md5').update(content).digest('hex');
}
