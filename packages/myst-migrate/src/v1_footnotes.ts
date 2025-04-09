import { selectAll } from 'unist-util-select';
import { assert } from 'console';
import type { IFile } from './types.js';

export const VERSION = 1;
export const DATE = new Date(Date.parse('2025-02-07'));

export const DESCRIPTION = `
Footnotes have dropped backwards compatibility with \`number\`,
instead using \`enumerator\` on both the \`FootnoteReference\` and \`FootnoteDefinition\` nodes.

Previous versions of the AST had both of these defined.
The \`enumerator\` property is used in all other numberings of figures, sections, equations, etc.
`;

type FootnoteDefinition = {
  type: 'footnoteDefinition';
  children: any[];
  html_id?: string;
  label?: string;
  identifier?: string;
  /** @deprecated this is `enumerator` in version 1 */
  number?: number;
  /** Enumerator is added */
  enumerator?: string;
};

type FootnoteReference = {
  type: 'footnoteReference';
  html_id?: string;
  label?: string;
  identifier?: string;
  /** @deprecated this is `enumerator` in version 2 */
  number?: number;
  /** Enumerator is added */
  enumerator?: string;
};

function maybeParseInt(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const result = Number.parseInt(value, 10);
  if (String(result) === value) {
    return result;
  } else {
    return undefined;
  }
}

export function upgrade(file: IFile): IFile {
  const { version, mdast } = file;

  // The first version can allow version to be null
  assert(version === 0 || version == null, 'Version must be 0');

  const nodes = selectAll('footnoteDefinition,footnoteReference', mdast) as (
    | FootnoteDefinition
    | FootnoteReference
  )[];
  nodes.forEach((node) => {
    if (node.number !== undefined && (node as any).enumerator == null) {
      node.enumerator = String(node.number);
    }
    delete node.number;
  });
  return file;
}

export function downgrade(file: IFile): IFile {
  const { version, mdast } = file;
  assert(version === VERSION, `Version must be ${VERSION}`);

  const nodes = selectAll('footnoteDefinition,footnoteReference', mdast) as (
    | FootnoteDefinition
    | FootnoteReference
  )[];
  nodes.forEach((node) => {
    const maybeNumber = maybeParseInt(node.enumerator);
    if (maybeNumber !== undefined) {
      node.number = maybeNumber;
    }
    if (node.number !== undefined && node.enumerator == null) {
      node.enumerator = String(node.number);
    }
    delete node.enumerator;
  });
  return file;
}
