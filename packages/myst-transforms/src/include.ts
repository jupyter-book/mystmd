import type { GenericNode, GenericParent } from 'myst-common';
import { fileError, fileWarn, RuleId, transferTargetAttrs } from 'myst-common';
import type { Code, Container, Include } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { Caption } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { PageFrontmatter } from 'myst-frontmatter';

type ParseResult = { mdast: GenericParent; frontmatter?: PageFrontmatter };

export type Options = {
  loadFile: (filename: string) => Promise<string | undefined> | string | undefined;
  resolveFile: (includeFile: string, sourceFile: string, vfile: VFile) => string | undefined;
  parseContent: (filename: string, content: string) => Promise<ParseResult> | ParseResult;
  sourceFile: string;
  stack?: string[];
};

/**
 * Pluck any relevant frontmatter from include files
 *
 * For now, this only includes math macros and abbreviations; all other
 * include frontmatter is ignored.
 *
 * If values are defined on both the page and the include file,
 * values from the include file will take priority.
 */
function updateFrontmatterFromInclude(
  frontmatter: PageFrontmatter,
  includeFrontmatter?: PageFrontmatter,
) {
  if (frontmatter.math || includeFrontmatter?.math) {
    frontmatter.math = { ...frontmatter.math, ...includeFrontmatter?.math };
  }
  if (frontmatter.abbreviations || includeFrontmatter?.abbreviations) {
    frontmatter.abbreviations = {
      ...frontmatter.abbreviations,
      ...includeFrontmatter?.abbreviations,
    };
  }
}

/**
 * This is the {include} directive, that loads from disk.
 *
 * RST documentation:
 *  - https://docutils.sourceforge.io/docs/ref/rst/directives.html#including-an-external-document-fragment
 */
export async function includeDirectiveTransform(
  tree: GenericParent,
  frontmatter: PageFrontmatter,
  vfile: VFile,
  opts: Options,
) {
  const includeNodes = selectAll('include', tree) as Include[];
  if (includeNodes.length === 0) return;
  if (!opts?.stack) opts.stack = [opts.sourceFile];
  await Promise.all(
    includeNodes.map(async (node) => {
      // If the transform has already run, don't run it again!
      if (node.children && node.children.length > 0) return;
      const fullFile = opts.resolveFile(node.file, opts.sourceFile, vfile);
      if (!fullFile) return;
      // If we encounter the same include file twice in a single stack, return
      if (opts.stack?.includes(fullFile)) {
        fileError(vfile, `Include Directive: "${fullFile}" depends on itself`, {
          ruleId: RuleId.includeContentLoads,
          note: [...opts.stack, fullFile].join(' > '),
        });
        return;
      }
      const rawContent = await opts.loadFile(fullFile);
      if (rawContent == null) return;
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
            'filename',
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
            children: [code as any, caption],
          };
          // Move the label to the container
          transferTargetAttrs(code, container, vfile);
          children = [container];
        }
      } else {
        const parsed = await opts.parseContent(fullFile, content);
        children = parsed.mdast.children;
        updateFrontmatterFromInclude(frontmatter, parsed.frontmatter);
      }
      node.children = children as any;
      if (!node.children?.length) return;
      // Recurse!
      await includeDirectiveTransform(node as GenericParent, frontmatter, vfile, {
        ...opts,
        stack: [...(opts.stack ?? []), fullFile],
        sourceFile: fullFile,
      });
    }),
  );
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
          fileWarn(vfile, 'Invalid line number "0", indexing starts at 1', {
            ruleId: RuleId.includeContentFilters,
          });
          return [];
        }
        if (!startingLineNumber) startingLineNumber = ind[0] + 1;
        return lines.slice(...ind);
      }
      const ind0 = index(f[0], lines.length);
      const ind1 = index(f[1] ?? lines.length, lines.length);
      if (!ind0 || !ind1) {
        fileWarn(vfile, 'Invalid line number "0", indexing starts at 1', {
          ruleId: RuleId.includeContentFilters,
        });
        return [];
      }
      if (!startingLineNumber) startingLineNumber = ind0[0] + 1;
      const slice = lines.slice(ind0[0], ind1[1]);
      if (slice.length === 0) {
        fileWarn(vfile, `Unexpected lines, from "${f[0]}" to "${f[1] ?? ''}"`, {
          ruleId: RuleId.includeContentFilters,
        });
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
      { ruleId: RuleId.includeContentFilters },
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
    fileWarn(vfile, `Could not find ending line including "${filter.endAt || filter.endBefore}"`, {
      ruleId: RuleId.includeContentFilters,
    });
    endLine = lines.length;
  } else if (filter.endAt || filter.endBefore) {
    endLine += startLine;
    if (filter.endAt) endLine += 1;
  }
  startingLineNumber = startLine + 1;
  return { content: lines.slice(startLine, endLine + 1).join('\n'), startingLineNumber };
}

export const includeDirectivePlugin: Plugin<
  [PageFrontmatter, Options],
  GenericParent,
  GenericParent
> = (frontmatter, opts) => async (tree, file) => {
  await includeDirectiveTransform(tree as GenericParent, frontmatter, file, opts);
};
