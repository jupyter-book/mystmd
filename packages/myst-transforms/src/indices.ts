import type { Plugin } from 'unified';
import type { GenericNode, GenericParent } from 'myst-common';
import { copyNode, createId, fileWarn, normalizeLabel, RuleId } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { IReferenceStateResolver, ReferenceState, Target } from './enumerate.js';
import type { VFile } from 'vfile';

const ALLOWED_INDEX_CHARS = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Changes é to E etc. */
export function getNormalizedFirstLetter(entry: string): string {
  if (!entry) return 'Other';
  const char = entry
    .trim()[0]
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
  return ALLOWED_INDEX_CHARS.includes(char) ? char : 'Other';
}

/**
 * Ensure all nodes with index entries have label/identifier/html_id
 */
export function indexIdentifierTransform(mdast: GenericParent) {
  const indexEntryNodes = selectAll('[indexEntries]', mdast) as GenericNode[];
  indexEntryNodes.forEach((indexEntryNode) => {
    if (!indexEntryNode.label) {
      indexEntryNode.label = `index-${createId()}`;
    }
    if (!indexEntryNode.identifier) {
      const { identifier, html_id } = normalizeLabel(indexEntryNode.label) ?? {};
      indexEntryNode.identifier = identifier;
      indexEntryNode.html_id = html_id;
    }
  });
}

export const indexIdentifierPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  indexIdentifierTransform(tree);
};

type IndexTargetInfo = {
  node: GenericNode;
  emphasis?: boolean;
};

type IndexSeeInfo = {
  value: string;
  emphasis?: boolean;
};

/**
 * Take a list of index targets collected from a project and build lookup structure
 *
 * This sorts by starting letter, then top-level entry name, then sub-entry name
 */
function organizeTargetEntries(indexTargets: Target[], vfile: VFile) {
  const entryDict: Record<
    string, // Letter or Other
    Record<
      string, // Entry name
      {
        nodes: IndexTargetInfo[];
        see: IndexSeeInfo[];
        seeAlso: IndexSeeInfo[];
        subEntries: Record<string, IndexTargetInfo[]>;
      }
    >
  > = {};
  indexTargets.forEach(({ node }) => {
    node.indexEntries?.forEach(({ entry, subEntry, emphasis }) => {
      const letter = getNormalizedFirstLetter(entry);
      if (!entryDict[letter]) entryDict[letter] = {};
      const indexTargetInfo: IndexTargetInfo = { node, emphasis };
      if (!entryDict[letter][entry]) {
        const existing = Object.keys(entryDict[letter]).find(
          (e) => e.toUpperCase() === entry.toUpperCase(),
        );
        if (existing) {
          fileWarn(
            vfile,
            `Duplicate index entry with different cases: "${existing}" and "${entry}"`,
            { ruleId: RuleId.indexEntriesResolve, node },
          );
        }
        entryDict[letter][entry] = { nodes: [], see: [], seeAlso: [], subEntries: {} };
      }
      const indexItem = entryDict[letter][entry];
      if (subEntry?.value) {
        if (subEntry.kind === 'see') {
          indexItem.see.push({ value: subEntry.value, emphasis });
        } else if (subEntry.kind === 'seealso') {
          indexItem.seeAlso.push({ value: subEntry.value, emphasis });
        } else {
          if (!indexItem.subEntries[subEntry.value]) {
            indexItem.subEntries[subEntry.value] = [];
          }
          indexItem.subEntries[subEntry.value].push(indexTargetInfo);
        }
      } else {
        indexItem.nodes.push(indexTargetInfo);
      }
    });
  });
  return entryDict;
}

/**
 * Sort list of objects so `emphasis: true` come first
 */
function emphasisFirst<T extends { emphasis?: boolean }>(items: T[]) {
  return [...items.filter((item) => !!item.emphasis), ...items.filter((item) => !item.emphasis)];
}

/**
 * Create comma-separated xref nodes for a list of index targets
 */
function resolveIndexReferences(nodes: IndexTargetInfo[]) {
  return emphasisFirst(nodes)
    .map(({ node, emphasis }, ind) => {
      const out: GenericNode[] = [];
      if (ind === 0) {
        out.push({
          type: 'text',
          value: ' ',
        });
      } else {
        out.push({
          type: 'text',
          value: ', ',
        });
      }
      const xref = {
        type: 'crossReference',
        identifier: node.identifier,
        label: node.label,
        children: node.type === 'span' && node.children ? copyNode(node.children) : undefined,
      };
      if (emphasis) {
        out.push({
          type: 'emphasis',
          children: [xref],
        });
      } else {
        out.push(xref);
      }
      return out;
    })
    .flat();
}

function resolveIndexPrefix(
  nodes: IndexSeeInfo[],
  key: string,
  allEntries: string[],
  vfile: VFile,
  prefix: string,
) {
  return emphasisFirst(nodes)
    .map(({ value, emphasis }, ind) => {
      if (!allEntries.includes(value)) {
        fileWarn(vfile, `"${prefix}" destination for "${key}" does not exist: "${value}"`, {
          ruleId: RuleId.indexEntriesResolve,
        });
      }
      const out: GenericNode[] = [];
      if (ind === 0) {
        out.push({
          type: 'text',
          value: ` ${prefix} `,
        });
      } else {
        out.push({
          type: 'text',
          value: ', ',
        });
      }
      const xrefLetter = getNormalizedFirstLetter(value).toLowerCase();
      const xref = {
        type: 'crossReference',
        identifier: `index-heading-${xrefLetter}`,
        label: `index-heading-${xrefLetter}`,
        children: [
          {
            type: 'text',
            value,
          },
        ],
      };
      if (emphasis) {
        out.push({
          type: 'emphasis',
          children: [xref],
        });
      } else {
        out.push(xref);
      }
      return out;
    })
    .flat();
}

/**
 * Create comma-separated xref nodes for a list of "See" targets
 */
function resolveIndexSee(nodes: IndexSeeInfo[], key: string, allEntries: string[], vfile: VFile) {
  return resolveIndexPrefix(nodes, key, allEntries, vfile, 'See');
}

/**
 * Create comma-separated xref nodes for a list of "See also" targets
 */
function resolveIndexSeeAlso(
  nodes: IndexSeeInfo[],
  key: string,
  allEntries: string[],
  vfile: VFile,
) {
  return resolveIndexPrefix(nodes, key, allEntries, vfile, 'See also');
}

export function buildIndexTransform(
  mdast: GenericParent,
  vfile: VFile,
  state: ReferenceState,
  stateResolver: IReferenceStateResolver,
) {
  const genindices = selectAll('genindex', mdast) as GenericNode[];
  if (!genindices.length) return;
  const indexTargets = stateResolver
    .getAllTargets()
    .filter((target) => !!target.node.indexEntries?.length);
  const entryDict = organizeTargetEntries(indexTargets, vfile);
  const allEntries = Object.values(entryDict)
    .map((entryItems) => [...Object.keys(entryItems)])
    .flat();
  const indexContent: GenericNode[] = [];
  [...ALLOWED_INDEX_CHARS, 'Other'].forEach((letter) => {
    if (!entryDict[letter]) return;
    const term = {
      type: 'definitionTerm',
      children: [
        {
          type: 'text',
          value: letter,
        },
      ],
      label: `index-heading-${letter.toLowerCase()}`,
      identifier: `index-heading-${letter.toLowerCase()}`,
      html_id: `index-heading-${letter.toLowerCase()}`,
    };
    const description = {
      type: 'definitionDescription',
      children: Object.keys(entryDict[letter])
        .sort()
        .map((key) => {
          const indexItem = entryDict[letter][key];
          return [
            {
              type: 'text',
              value: `${key}:`,
            },
            ...resolveIndexReferences(indexItem.nodes),
            ...resolveIndexSee(indexItem.see, key, allEntries, vfile),
            ...resolveIndexSeeAlso(indexItem.seeAlso, key, allEntries, vfile),
            {
              type: 'list',
              children: Object.keys(indexItem.subEntries)
                .sort()
                .map((sub) => {
                  return {
                    type: 'listItem',
                    children: [
                      {
                        type: 'paragraph',
                        children: [
                          {
                            type: 'text',
                            value: `${sub}: `,
                          },
                          ...resolveIndexReferences(indexItem.subEntries[sub]),
                        ],
                      },
                    ],
                  };
                }),
            },
          ];
        })
        .flat(),
    };
    state.addTarget(term as any);
    indexContent.push(term, description);
  });
  genindices.forEach((genindex) => {
    genindex.type = 'block';
    genindex.data = { part: 'index' };
    if (!genindex.children) genindex.children = [];
    genindex.children.push({
      type: 'definitionList',
      children: indexContent,
    });
  });
}
