import fs from 'node:fs';
import path from 'node:path';
import { castSession } from '../../session/cache.js';
import type { ISession } from '../../session/types.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import type { References } from 'myst-common';

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
      citationLookup[key] = renderer.exportBibTeX();
    });
  });
  const bibtexContent: string[] = [];
  order.forEach((key) => {
    if (bibtexContent.includes(citationLookup[key])) return;
    if (citationLookup[key]) {
      bibtexContent.push(citationLookup[key]);
    } else {
      addWarningForFile(session, output, `unknown citation ${key}`);
    }
  });
  if (!bibtexContent.length) return false;
  if (!fs.existsSync(output)) fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, bibtexContent.join('\n'));
  return true;
}
