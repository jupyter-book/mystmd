import type { ISession } from '../session/types';

export function shouldIgnoreFile(session: ISession, file: string) {
  const ignore = ['node_modules', session.buildFolder];
  return file.startsWith('.') || ignore.includes(file);
}
