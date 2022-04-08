import { createId } from '@curvenote/schema';
import fs from 'fs';
import path from 'path';
import {
  MyST,
  getFrontmatter,
  GenericNode,
  transform,
  State,
  unified,
  selectAll,
  map,
  visit,
  remove,
} from 'mystjs';
import { getCitations, CitationRenderer } from 'citation-js-utils';
import throttle from 'lodash.throttle';
import { renderEquation } from './math.server';
import { reactiveRoles } from './roles';
import { reactiveDirectives } from './directives';
import { ISession } from '../../session/types';
import { tic } from '../utils/exec';
import { serverPath } from './utils';
import { Options } from './types';

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number }>;
};

export type Footnotes = Record<string, GenericNode>;

export type References = {
  cite: Citations;
  footnotes: Footnotes;
};

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

async function prepare(
  session: ISession,
  fileName: string,
  content: string,
  citeRenderer: CitationRenderer,
) {
  const toc = tic();
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...reactiveDirectives },
  });
  let mdast = myst.parse(content);
  const state = new State();
  mdast = await unified().use(transform, state, { addContainerCaptionNumbers: true }).run(mdast);
  session.log.debug(toc(`Processing: "${fileName}" -- MyST      %s`));
  visit(mdast, 'math', (node: GenericNode) => {
    node.html = renderEquation(node.value, true);
  });
  visit(mdast, 'inlineMath', (node: GenericNode) => {
    node.html = renderEquation(node.value, false);
  });
  session.log.debug(toc(`Processing: "${fileName}" -- math      %s`));
  const references: References = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  const footnotes = selectAll('footnoteDefinition', mdast);
  references.footnotes = Object.fromEntries(
    footnotes.map((n: GenericNode) => [n.identifier, map(n, addKeys)]),
  );
  remove(mdast, 'footnoteDefinition');
  session.log.debug(toc(`Processing: "${fileName}" -- footnotes %s`));
  selectAll('cite', mdast).forEach((node: GenericNode) => {
    const citeLabel = (node.label ?? '').trim();
    if (!citeLabel) return;
    if (node.kind === 't') {
      pushCite(references, citeRenderer, citeLabel);
      node.label = citeLabel;
      node.children = citeRenderer[citeLabel]?.inline() || [];
      return;
    }
    node.children =
      citeLabel?.split(',').map((s) => {
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
  session.log.debug(toc(`Processing: "${fileName}" -- citations %s`));
  // Last step, add unique keys to every node!
  map(mdast, addKeys);
  const frontmatter = getFrontmatter(mdast);
  session.log.debug(toc(`Processing: "${fileName}" -- keys      %s`));
  const data = { frontmatter, mdast, references };
  return data;
}

async function getCitationRenderer(folder: string): Promise<CitationRenderer> {
  const f = fs.readFileSync(path.join('content', folder, 'references.bib')).toString();
  return getCitations(f);
}

async function processFile(session: ISession, opts: Options, file: NextFile) {
  const toc = tic();
  const { fileName, folder, slug } = file;
  session.log.debug(`Reading file "${fileName}"`);
  const f = fs.readFileSync(fileName).toString();
  const citeRenderer = await getCitationRenderer(folder);
  const data = await prepare(session, fileName, f, citeRenderer);
  session.log.info(toc(`📖 Built ${folder}/${slug} in %s.`));
  const p = serverPath(opts);
  fs.writeFileSync(path.join(`${p}/app/content/${slug}.json`), JSON.stringify(data));
}

type NextFile = { fileName: string; folder: string; slug: string };

class DocumentCache {
  session: ISession;

  options: Options;

  processList: Record<string, NextFile>;

  constructor(session: ISession, opts: Options) {
    this.processList = {};
    this.session = session;
    this.options = opts;
  }

  markFileDirty(folder: string, slug: string) {
    const fileName = path.join('content', folder, `${slug}.md`);
    this.processList[fileName] = { fileName, folder, slug };
  }

  async process() {
    await Promise.all(
      Object.entries(this.processList).map(([, file]) =>
        processFile(this.session, this.options, file),
      ),
    );
  }
}

export const readFilesAndProcess = (session: ISession, opts: Options) => {
  const cache = new DocumentCache(session, opts);
  const process = throttle(() => cache.process(), 100);
  return async (eventType: string, filename: string) => {
    session.log.debug(`File modified: "${filename}" (${eventType})`);
    cache.markFileDirty('interactive', 'test');
    process();
  };
};
