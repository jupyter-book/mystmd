import fs from 'fs';
import type { Root } from 'mdast';
import type { GenericNode } from 'myst-common';
import { parseMyst } from '../process/index.js';
import { selectAll } from 'unist-util-select';
import { join, dirname } from 'path';
import type { ISession } from '../session/types.js';

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
    const children = parseMyst(session, content, filename).children as GenericNode[];
    node.children = children;
  });
}
