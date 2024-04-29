import type { Entry, FileEntry, URLEntry, PatternEntry } from './types.js';

export function isFile(entry: Entry): entry is FileEntry {
  return (entry as any).file !== undefined;
}

export function isURL(entry: Entry): entry is URLEntry {
  return (entry as any).url !== undefined;
}

export function isPattern(entry: Entry): entry is PatternEntry {
  return (entry as any).pattern !== undefined;
}
