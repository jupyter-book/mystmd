import { createId } from '@curvenote/schema';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import {
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
import { getCitations, CitationRenderer, InlineCite } from 'citation-js-utils';
import { renderEquation } from './math.server';
import { ISession } from '../../session/types';
import { tic } from '../utils/exec';
import { parseMyst, serverPath, writeFileToFolder } from './utils';
import { Options } from './types';
import { SiteConfig, SiteFolder, watchConfig, writeConfig } from './webConfig';

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

function isSame(filename: string, hash: string): boolean {
  if (!fs.existsSync(filename)) return false;
  const content = fs.readFileSync(filename).toString();
  return JSON.parse(content).sha256 === hash;
}

async function prepare(
  session: ISession,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const sha256 = createHash('sha256').update(content).digest('hex');
  if (isSame(filename.to, sha256)) return false;
  const toc = tic();
  let mdast = parseMyst(content);
  const state = new State();
  mdast = await unified().use(transform, state, { addContainerCaptionNumbers: true }).run(mdast);
  session.log.debug(toc(`Processing: "${filename.from}" -- MyST      %s`));
  visit(mdast, 'math', (node: GenericNode) => {
    node.html = renderEquation(node.value, true);
  });
  visit(mdast, 'inlineMath', (node: GenericNode) => {
    node.html = renderEquation(node.value, false);
  });
  session.log.debug(toc(`Processing: "${filename.from}" -- math      %s`));
  const references: References = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  const footnotes = selectAll('footnoteDefinition', mdast);
  references.footnotes = Object.fromEntries(
    footnotes.map((n: GenericNode) => [n.identifier, map(n, addKeys)]),
  );
  remove(mdast, 'footnoteDefinition');
  session.log.debug(toc(`Processing: "${filename.from}" -- footnotes %s`));
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
  session.log.debug(toc(`Processing: "${filename.from}" -- citations %s`));
  // Last step, add unique keys to every node!
  map(mdast, addKeys);
  const frontmatter = getFrontmatter(mdast);
  session.log.debug(toc(`Processing: "${filename.from}" -- keys      %s`));
  const data = { sha256, frontmatter, mdast, references };
  writeFileToFolder(filename.to, JSON.stringify(data));
  return true;
}

async function getCitationRenderer(folder: string): Promise<CitationRenderer> {
  const f = fs.readFileSync(path.join('content', folder, 'references.bib')).toString();
  return getCitations(f);
}

async function processFile(session: ISession, opts: Options, file: NextFile): Promise<boolean> {
  const toc = tic();
  const { filename, folder, slug } = file;
  const webFolder = path.basename(folder);
  session.log.debug(`Reading file "${filename}"`);
  const f = fs.readFileSync(filename).toString();
  const citeRenderer = await getCitationRenderer(folder);
  const jsonFile = path.join(`${serverPath(opts)}/app/content/${webFolder}/${slug}.json`);
  const built = await prepare(session, { from: filename, to: jsonFile }, f, citeRenderer);
  if (built) session.log.info(toc(`📖 Built ${webFolder}/${slug} in %s.`));
  return built;
}

async function processFolder(
  session: ISession,
  opts: Options,
  folder: string,
  pages: SiteFolder['pages'],
): Promise<{ id: string; processed: boolean }[]> {
  const files = await Promise.all(
    pages
      .filter(({ slug }) => slug)
      .map(async ({ slug }) => {
        const processed = await processFile(session, opts, {
          folder,
          slug: slug as string,
          filename: path.join('content', folder, `${slug}.md`),
        });
        return { id: `${folder}/${slug}`, processed };
      }),
  );
  return files;
}

async function processConfig(
  session: ISession,
  opts: Options,
  config: SiteConfig | null,
): Promise<{ id: string; processed: boolean }[]> {
  const folders = await Promise.all(
    Object.entries(config?.folders ?? {}).map(([folder, p]) =>
      processFolder(session, opts, folder, p.pages),
    ),
  );
  return folders.flat();
}

type NextFile = { filename: string; folder: string; slug: string };

class DocumentCache {
  session: ISession;

  options: Options;

  processList: Record<string, NextFile>;

  constructor(session: ISession, opts: Options) {
    this.processList = {};
    this.session = session;
    this.options = opts;
  }

  markFileDirty(folder: string, file: string) {
    const filename = path.join('content', folder, file);
    const slug = file.split('.').slice(0, -1).join('.');
    this.processList[filename] = { filename, folder, slug };
  }

  async process() {
    await Promise.all(
      Object.entries(this.processList).map(([key, file]) => {
        delete this.processList[key];
        return processFile(this.session, this.options, file);
      }),
    );
  }
}

export async function watchContent(session: ISession, opts: Options) {
  const cache = new DocumentCache(session, opts);

  if (opts.force) {
    fs.rmdirSync(path.join(serverPath(opts), 'app', 'content'), { recursive: true });
  }

  const config = writeConfig(session, opts);

  const processor = async (eventType: string, filename: string) => {
    session.log.debug(`File modified: "${filename}" (${eventType})`);
    const base = path.basename(filename);
    if (base === '_toc.yml') {
      writeConfig(session, opts, false);
      return;
    }
    cache.markFileDirty(path.dirname(filename), base);
    await cache.process();
  };

  const toc = tic();
  // Process all existing files
  const pages = await processConfig(session, opts, config);
  const touched = pages.filter(({ processed }) => processed).length;
  session.log.info(toc(`📚 Built ${touched} / ${pages.length} pages in %s.`));
  // Watch the full content folder
  fs.watch('content', { recursive: true }, processor);
  // Watch the curvenote.yml
  watchConfig(session, opts);
}
