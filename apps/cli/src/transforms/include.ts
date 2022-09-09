import fs from 'fs';
import type { GenericNode } from 'mystjs';
import type { Root } from 'mdast';
import { parseMyst } from '../myst';
import { selectAll } from 'mystjs';
import { join, dirname } from 'path';
import type { ISession } from '../session';

/**
 * This is the {include} directive, that loads from disk.
 *
 * RST documentation:
 *  - https://docutils.sourceforge.io/docs/ref/rst/directives.html#including-an-external-document-fragment
 */
export function includeFilesDirective(session: ISession, filename: string, mdast: Root) {
  const includeNodes = selectAll('include', mdast) as GenericNode[];
  const dir = dirname(filename);
  includeNodes.forEach((node) => {
    const file = join(dir, node.file);
    if (!fs.existsSync(file)) {
      session.log.error(`Include Directive: Could not find "${file}" in "${filename}"`);
      return;
    }
    const content = fs.readFileSync(file).toString();
    const children = parseMyst(content).children as GenericNode[];
    node.children = children;
  });
}
