import fs from 'node:fs';
import path from 'node:path';
import { castSession } from '../../session/cache.js';
import type { ISession } from '../../session/types.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import type { References } from 'myst-common';

/**
 * Extract a single entry from the entire content of a bibtex file
 *
 * Look for the pattern '@article{key' then finds the closing bracket
 * and returns that substring. The "article" prefix may be any
 * lowercase alpha word.
 */
export function extractBibtex(key: string, bibtex: string) {
  const match = bibtex.match(new RegExp(`@[a-z]*{${key}`, 'g'));
  if (!match) return;
  const start = bibtex.indexOf(match[0]);
  let bracketCount = 0;
  let ind = start + match[0].length;
  while (bibtex[ind] && (bibtex[ind] !== '}' || bracketCount !== 0)) {
    if (bibtex[ind - 1] && bibtex[ind - 1] !== '\\') {
      if (bibtex[ind] === '{') bracketCount++;
      if (bibtex[ind] === '}') bracketCount--;
    }
    ind++;
  }
  return bibtex[ind] ? bibtex.substring(start, ind + 1) : undefined;
}

/**
 * Write new bibtex file from citation renderer data and reference order
 *
 * Returns true if file was written
 */
export function writeBibtexFromCitationRenderers(
  session: ISession,
  output: string,
  content: { references: References }[],
) {
  const order = content
    .map(({ references }) => {
      return references.cite?.order ?? [];
    })
    .flat();
  if (!order.length) return false;
  const cache = castSession(session);
  const citationLookup: Record<string, string> = {};
  Object.values(cache.$citationRenderers).forEach((renderers) => {
    Object.entries(renderers).forEach(([key, renderer]) => {
      const bibtexContent = (renderer.cite._graph as any[]).find((item) => {
        return item.type === '@biblatex/text';
      });
      if (bibtexContent?.data) {
        citationLookup[key] = extractBibtex(key, bibtexContent.data) ?? bibtexContent.data;
      }
    });
  });
  const bibtexContent: string[] = [];
  order.forEach((key) => {
    if (bibtexContent.includes(citationLookup[key])) return;
    if (citationLookup[key]) {
      bibtexContent.push(citationLookup[key]);
    }
    addWarningForFile(session, output, `unknown citation ${key}`);
  });
  if (!bibtexContent.length) return false;
  if (!fs.existsSync(output)) fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, bibtexContent.join('\n'));
  return true;
}
