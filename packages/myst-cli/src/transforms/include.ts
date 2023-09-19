import fs from 'node:fs';
import { fileError, fileWarn, type GenericNode, type GenericParent } from 'myst-common';
import type { Code, Container, Include } from 'myst-spec-ext';
import { parseMyst } from '../process/index.js';
import { selectAll } from 'unist-util-select';
import { join, dirname } from 'node:path';
import type { ISession } from '../session/types.js';
import type { Caption } from 'myst-spec';
import type { VFile } from 'vfile';

/**
 * This is the {include} directive, that loads from disk.
 *
 * RST documentation:
 *  - https://docutils.sourceforge.io/docs/ref/rst/directives.html#including-an-external-document-fragment
 */
export function includeFilesDirective(
  session: ISession,
  vfile: VFile,
  filename: string,
  mdast: GenericParent,
) {
  const includeNodes = selectAll('include', mdast) as Include[];
  const dir = dirname(filename);
  includeNodes.forEach((node) => {
    const file = join(dir, node.file);
    if (!fs.existsSync(file)) {
      fileError(vfile, `Include Directive: Could not find "${file}" in "${filename}"`);
      return;
    }
    const rawContent = fs.readFileSync(file).toString();
    const { content, startingLineNumber } = filterIncludedContent(vfile, node.filter, rawContent);
    let children: GenericNode[];
    if (node.literal) {
      const code: Code = {
        type: 'code',
        value: content,
      };
      if (node.startingLineNumber === 'match') {
        // Replace the starting line number if it should match
        node.startingLineNumber = startingLineNumber;
      }
      // Move the code attributes to the code block
      (
        [
          'lang',
          'emphasizeLines',
          'showLineNumbers',
          'startingLineNumber',
          'label',
          'identifier',
        ] as const
      ).forEach((attr) => {
        if (!node[attr]) return;
        code[attr] = node[attr] as any;
        delete node[attr];
      });
      if (!node.caption) {
        children = [code];
      } else {
        const caption: Caption = {
          type: 'caption',
          children: [
            {
              type: 'paragraph',
              children: node.caption as any[],
            },
          ],
        };
        const container: Container = {
          type: 'container',
          kind: 'code' as any,
          // Move the label to the container
          label: code.label,
          identifier: code.identifier,
          children: [code as any, caption],
        };
        delete code.label;
        delete code.identifier;
        children = [container];
      }
    } else {
      children = parseMyst(session, content, filename).children;
    }
    node.children = children as any;
  });
}

function index(n: number, total: number): [number, number] | null {
  if (n > 0) return [n - 1, n];
  if (n < 0) return [total + n, total + n + 1];
  return null;
}

export function filterIncludedContent(
  vfile: VFile,
  filter: Include['filter'],
  rawContent: string,
): { content: string; startingLineNumber?: number } {
  if (!filter || Object.keys(filter).length === 0) {
    return { content: rawContent, startingLineNumber: undefined };
  }
  const lines = rawContent.split('\n');
  let startingLineNumber: number | undefined;
  if (filter.lines) {
    const filtered = filter.lines.map((f) => {
      if (typeof f === 'number') {
        const ind = index(f, lines.length);
        if (!ind) {
          fileWarn(vfile, 'Invalid line number "0", indexing starts at 1');
          return [];
        }
        if (!startingLineNumber) startingLineNumber = ind[0] + 1;
        return lines.slice(...ind);
      }
      const ind0 = index(f[0], lines.length);
      const ind1 = index(f[1] ?? lines.length, lines.length);
      if (!ind0 || !ind1) {
        fileWarn(vfile, 'Invalid line number "0", indexing starts at 1');
        return [];
      }
      if (!startingLineNumber) startingLineNumber = ind0[0] + 1;
      const slice = lines.slice(ind0[0], ind1[1]);
      if (slice.length === 0) {
        fileWarn(vfile, `Unexpected lines, from "${f[0]}" to "${f[1] ?? ''}"`);
      }
      return slice;
    });
    return { content: filtered.flat().join('\n'), startingLineNumber };
  }
  let startLine =
    filter.startAt || filter.startAfter
      ? lines.findIndex(
          (line) =>
            (filter.startAt && line.includes(filter.startAt)) ||
            (filter.startAfter && line.includes(filter.startAfter)),
        )
      : 0;
  if (startLine === -1) {
    fileWarn(
      vfile,
      `Could not find starting line including "${filter.startAt || filter.startAfter}"`,
    );
    startLine = 0;
  }
  if (filter.startAfter) startLine += 1;
  let endLine =
    filter.endAt || filter.endBefore
      ? lines
          .slice(startLine + 1)
          .findIndex(
            (line) =>
              (filter.endAt && line.includes(filter.endAt)) ||
              (filter.endBefore && line.includes(filter.endBefore)),
          )
      : lines.length;
  if (endLine === -1) {
    fileWarn(vfile, `Could not find ending line including "${filter.endAt || filter.endBefore}"`);
    endLine = lines.length;
  } else if (filter.endAt || filter.endBefore) {
    endLine += startLine;
    if (filter.endAt) endLine += 1;
  }
  startingLineNumber = startLine + 1;
  return { content: lines.slice(startLine, endLine + 1).join('\n'), startingLineNumber };
}
