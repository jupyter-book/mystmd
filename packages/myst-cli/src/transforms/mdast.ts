import fs from 'node:fs';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { join, dirname } from 'node:path';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from '../index.js';

/**
 * This is the {mdast} directive, that loads from disk
 * For example, tables that can't be represented in markdown.
 */
export function importMdastFromJson(session: ISession, filename: string, mdast: GenericParent) {
  const mdastNodes = selectAll('mdast', mdast) as GenericNode[];
  const loadedData: Record<string, GenericNode> = {};
  const dir = dirname(filename);
  mdastNodes.forEach((node) => {
    const [mdastFilename, id] = node.id.split('#');
    let data = loadedData[mdastFilename];
    if (!data) {
      try {
        data = JSON.parse(fs.readFileSync(join(dir, mdastFilename)).toString());
        loadedData[mdastFilename] = data;
      } catch {
        addWarningForFile(
          session,
          filename,
          `Mdast Node import: Could not load ${mdastFilename}`,
          'error',
          { ruleId: RuleId.mdastSnippetImports },
        );
        return;
      }
    }
    if (!data[id]) {
      addWarningForFile(
        session,
        filename,
        `Mdast Node import: Could not find ${id} in ${mdastFilename}`,
        'error',
        { ruleId: RuleId.mdastSnippetImports },
      );
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
