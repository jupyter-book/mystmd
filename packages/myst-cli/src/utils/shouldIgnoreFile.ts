import type { ISession } from '../session/types';

export function shouldIgnoreFile(session: ISession, file: string) {
  const ignore = ['node_modules', '_build'];
  return file.startsWith('.') || ignore.includes(file);
}
