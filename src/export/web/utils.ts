import fs from 'fs';
import path from 'path';
import {
  GenericNode,
  getFrontmatter,
  map,
  MyST,
  remove,
  selectAll,
  State,
  transform,
  unified,
  visit,
} from 'mystjs';
import { CitationRenderer, InlineCite } from 'citation-js-utils';
import { createId } from '@curvenote/schema';
import { Options } from './types';
import { reactiveRoles } from './roles';
import { reactiveDirectives } from './directives';
import { tic } from '../utils/exec';
import { Logger } from '../../logging';
import { renderEquation } from './math.server';

export function serverPath(opts: Options) {
  const buildPath = opts.buildPath || '_build';
  return `${buildPath}/web`;
}

export function exists(opts: Options) {
  return fs.existsSync(serverPath(opts));
}

export function ensureBuildFolderExists(opts: Options) {
  if (!exists(opts)) fs.mkdirSync(serverPath(opts), { recursive: true });
}

export function writeFileToFolder(filename: string, data: string | NodeJS.ArrayBufferView) {
  if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data);
}

export function parseMyst(content: string) {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...reactiveDirectives },
  });
  return myst.parse(content);
}

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number }>;
};

export type Footnotes = Record<string, GenericNode>;

export type References = {
  cite: Citations;
  footnotes: Footnotes;
};

export type Root = ReturnType<typeof parseMyst>;
export type Frontmatter = ReturnType<typeof getFrontmatter>;

export interface RendererData {
  sha256: string;
  frontmatter: Frontmatter;
  mdast: Root;
  references: References;
}

function pushCite(references: References, citeRenderer: CitationRenderer, label: string) {
  if (!references.cite.data[label]) {
    references.cite.order.push(label);
  }
  references.cite.data[label] = {
    number: references.cite.order.length,
    html: citeRenderer[label]?.render(),
  };
}

function addKeys(node: GenericNode) {
  node.key = createId();
  return node;
}

export async function transformMdast(
  log: Logger,
  name: string,
  mdast: Root,
  citeRenderer: CitationRenderer,
  sha256: string,
): Promise<RendererData> {
  const toc = tic();
  const state = new State();
  mdast = await unified().use(transform, state, { addContainerCaptionNumbers: true }).run(mdast);
  log.debug(toc(`Processing: "${name}" -- MyST      %s`));
  visit(mdast, 'math', (node: GenericNode) => {
    node.html = renderEquation(node.value, true);
  });
  visit(mdast, 'inlineMath', (node: GenericNode) => {
    node.html = renderEquation(node.value, false);
  });
  log.debug(toc(`Processing: "${name}" -- math      %s`));
  const references: References = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  const footnotes = selectAll('footnoteDefinition', mdast);
  references.footnotes = Object.fromEntries(
    footnotes.map((n: GenericNode) => [n.identifier, map(n, addKeys)]),
  );
  remove(mdast, 'footnoteDefinition');
  log.debug(toc(`Processing: "${name}" -- footnotes %s`));
  selectAll('cite', mdast).forEach((node: GenericNode) => {
    const citeLabel = (node.label ?? '').trim();
    if (!citeLabel) return;
    if (node.kind === 't') {
      pushCite(references, citeRenderer, citeLabel);
      node.label = citeLabel;
      node.children = citeRenderer[citeLabel]?.inline(InlineCite.t) || [];
      return;
    }
    node.children =
      citeLabel?.split(',').map((s: string) => {
        const label = s.trim();
        pushCite(references, citeRenderer, label);
        return {
          type: 'cite',
          label,
          children: citeRenderer[label]?.inline() || [],
        };
      }) ?? [];
    node.type = 'citeGroup';
  });
  log.debug(toc(`Processing: "${name}" -- citations %s`));
  // Last step, add unique keys to every node!
  map(mdast, addKeys);
  const frontmatter = getFrontmatter(mdast);
  log.debug(toc(`Processing: "${name}" -- keys      %s`));
  const data = { sha256, frontmatter, mdast, references };
  return data;
}
