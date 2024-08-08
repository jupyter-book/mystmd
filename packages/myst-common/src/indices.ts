import type { VFile } from 'vfile';
import type { IndexEntry } from 'myst-spec-ext';
import { fileError } from './utils.js';
import type { GenericNode } from './types.js';

export type IndexTypeLists = {
  single: string[];
  pair: string[];
  triple: string[];
  see: string[];
  seealso: string[];
};

export function parseIndexLine(
  line: string,
  { single, pair, triple, see, seealso }: IndexTypeLists,
  vfile: VFile,
  node: GenericNode,
) {
  if (line.trim().length === 0) return;
  // This splits on unescaped colons
  const splitLine = line.split(/(?<!\\):/).map((val) => val.trim().replace('\\:', ':'));
  if (splitLine.length > 2) {
    fileError(vfile, `Too many colons encountered in index line "${line}"`, {
      node,
      note: 'Index entry must follow pattern "type: entry; sub entry"',
    });
  } else if (splitLine.length === 2) {
    const [entryType, entryValue] = splitLine;
    if (entryType === 'single') single.push(entryValue);
    else if (entryType === 'pair') pair.push(entryValue);
    else if (entryType === 'triple') triple.push(entryValue);
    else if (entryType === 'see') see.push(entryValue);
    else if (entryType === 'seealso') seealso.push(entryValue);
    else {
      fileError(vfile, `Unknown index entry type "${entryType}"`, {
        node: node,
        note: 'Allowed types include: single, pair, triple, see, and seealso',
      });
    }
  } else {
    single.push(...splitLine[0].split(/(?<!\\),/).map((val) => val.trim().replace('\\,', ',')));
  }
}

export function splitEntryValue(entry: string) {
  const emphasis = entry.startsWith('!');
  const splitEntry = entry
    .replace(/^!/, '') // remove leading ! for `emphasis`
    .replace(/^\\!/, '!') // replace leading \! with !
    .split(/(?<!\\);/) // split on ; except for \;
    .map((val) => val.trim().replace('\\;', ';'))
    .filter((val) => val !== '');
  return { emphasis, splitEntry };
}

function createIndexEntry(
  entry: string,
  sub?: string,
  emphasis?: boolean,
  kind?: 'entry' | 'see' | 'seealso',
): IndexEntry {
  const subEntry = sub ? { value: sub, kind: kind ?? 'entry' } : undefined;
  return { entry, subEntry, emphasis };
}

export function createIndexEntries(
  { single, pair, triple, see, seealso }: IndexTypeLists,
  vfile: VFile,
  node: GenericNode,
) {
  const entries: IndexEntry[] = [];
  single.forEach((singleEntry) => {
    const { emphasis, splitEntry } = splitEntryValue(singleEntry);
    if (splitEntry.length !== 1 && splitEntry.length !== 2) {
      fileError(vfile, `Unable to parse index "single" entry "${singleEntry}"`, {
        node,
        note: 'Single index entry must follow pattern "entry" or "entry; sub entry"',
      });
    } else {
      const [entry, subEntry] = splitEntry;
      entries.push(createIndexEntry(entry, subEntry, emphasis));
    }
  });
  pair.forEach((pairEntry) => {
    const { emphasis, splitEntry } = splitEntryValue(pairEntry);
    if (splitEntry.length !== 2) {
      fileError(vfile, `Unable to parse index "pair" entry "${pairEntry}"`, {
        node,
        note: 'Pair index entry must follow pattern "entry; sub entry"',
      });
    } else {
      const [entry, subEntry] = splitEntry;
      entries.push(createIndexEntry(entry, subEntry, emphasis));
      entries.push(createIndexEntry(subEntry, entry, emphasis));
    }
  });
  triple.forEach((tripleEntry) => {
    const { emphasis, splitEntry } = splitEntryValue(tripleEntry);
    if (splitEntry.length !== 3) {
      fileError(vfile, `Unable to parse index "triple" entry "${tripleEntry}"`, {
        node,
        note: 'Triple index entry must follow pattern "entry one; entry two; entry three"',
      });
    } else {
      entries.push(createIndexEntry(splitEntry[0], splitEntry[1], emphasis));
      entries.push(createIndexEntry(splitEntry[1], splitEntry[0], emphasis));
      entries.push(createIndexEntry(splitEntry[1], splitEntry[2], emphasis));
      entries.push(createIndexEntry(splitEntry[2], splitEntry[1], emphasis));
      entries.push(createIndexEntry(splitEntry[0], splitEntry[2], emphasis));
      entries.push(createIndexEntry(splitEntry[2], splitEntry[0], emphasis));
    }
  });
  const addSeeEntry = (seeEntry: string, kind: 'see' | 'seealso') => {
    const { emphasis, splitEntry } = splitEntryValue(seeEntry);
    if (splitEntry.length !== 2) {
      fileError(vfile, `Unable to parse index "${kind}" entry "${seeEntry}"`, {
        node,
        note: 'See index entry must follow pattern "entry; sub entry"',
      });
    } else {
      const [entry, subEntry] = splitEntry;
      entries.push(createIndexEntry(entry, subEntry, emphasis, kind));
    }
  };
  see.forEach((seeEntry) => {
    addSeeEntry(seeEntry, 'see');
  });
  seealso.forEach((seealsoEntry) => {
    addSeeEntry(seealsoEntry, 'seealso');
  });
  if (entries.length === 0) {
    fileError(vfile, 'No entries parsed from index directive', { node });
  }
  return entries;
}
