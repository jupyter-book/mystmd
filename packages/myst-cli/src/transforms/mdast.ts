import fs from 'node:fs';
import type { GenericNode } from 'myst-common';
import type { Root } from 'mdast';
import { selectAll } from 'unist-util-select';
import { join, dirname } from 'node:path';
import type { ISession } from '../session/types.js';

/**
 * This is the {mdast} directive, that loads from disk
 * For example, tables that can't be represented in markdown.
 */
export function importMdastFromJson(session: ISession, filename: string, mdast: Root) {
  const mdastNodes = selectAll('mdast', mdast) as GenericNode[];
  const loadedData: Record<string, GenericNode> = {};
  const dir = dirname(filename);
  mdastNodes.forEach((node) => {
    const [mdastFilename, id] = node.id.split('#');
    let data = loadedData[mdastFilename];
    if (!data) {
      data = JSON.parse(fs.readFileSync(join(dir, mdastFilename)).toString());
      loadedData[mdastFilename] = data;
    }
    if (!data[id]) {
      session.log.error(`Mdast Node import: Could not find ${id} in ${mdastFilename}`);
      return;
    }
    // Clear the current object
    Object.keys(node).forEach((k) => {
      delete node[k];
    });
    // Replace with the import
    Object.assign(node, data[id]);
  });
}
