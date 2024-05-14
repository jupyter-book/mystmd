import type { Entry, FileEntry, PatternEntry } from './types.js';

export function isFile(entry: Entry): entry is FileEntry {
  return (entry as any).file !== undefined;
}

export function isPattern(entry: Entry): entry is PatternEntry {
  return (entry as any).pattern !== undefined;
}
