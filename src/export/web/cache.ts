import { CitationRenderer, getCitations } from 'citation-js-utils';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { ISession } from '../../session/types';
import { tic } from '../utils/exec';
import { Options, SiteConfig } from './types';
import { parseMyst, RendererData, serverPath, transformMdast, writeFileToFolder } from './utils';
import { LinkLookup, transformLinks } from './transforms';

type NextFile = { filename: string; folder: string; slug: string };

async function processMarkdown(
  cache: DocumentCache,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const mdast = parseMyst(content);
  const data = await transformMdast(
    cache.session.log,
    cache.config,
    filename.from,
    mdast,
    citeRenderer,
  );
  return data;
}

async function processNotebook(
  cache: DocumentCache,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const notebook = JSON.parse(content);
  const cells = notebook.cells
    .map((cell: any) => {
      if (cell.cell_type === 'markdown') return cell.source;
      if (cell.cell_type === 'code') {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        return `\`\`\`python\n${source}\n\`\`\``;
      }
      return null;
    })
    .filter((s: string | null) => s)
    .join('\n\n+++\n\n');
  const mdast = parseMyst(cells);
  const data = await transformMdast(
    cache.session.log,
    cache.config,
    filename.from,
    mdast,
    citeRenderer,
  );
  return data;
}

async function processFile(
  cache: DocumentCache,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
): Promise<{ fromCache: boolean; data: RendererData }> {
  const sha256 = createHash('sha256').update(content).digest('hex');
  if (fs.existsSync(filename.to)) {
    const cachedContent = fs.readFileSync(filename.to).toString();
    const data = JSON.parse(cachedContent) as RendererData;
    const same = data.sha256 === sha256;
    if (same) return { fromCache: true, data };
  }
  const ext = path.extname(filename.from);
  let data: Omit<RendererData, 'sha256'>;
  switch (ext) {
    case '.md':
      data = await processMarkdown(cache, filename, content, citeRenderer);
      break;
    case '.ipynb':
      data = await processNotebook(cache, filename, content, citeRenderer);
      break;
    default:
      throw new Error(`Unrecognized extension ${filename.from}`);
  }
  return { fromCache: false, data: { ...data, sha256 } };
}

async function getCitationRenderer(session: ISession, folder: string): Promise<CitationRenderer> {
  const referenceFilename = path.join('content', folder, 'references.bib');
  if (!fs.existsSync(referenceFilename)) {
    session.log.debug(`Expected references at "${referenceFilename}"`);
    return {};
  }
  const f = fs.readFileSync(referenceFilename).toString();
  return getCitations(f);
}

export class DocumentCache {
  session: ISession;

  options: Options;

  config: SiteConfig | null = null;

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
        return this.processFile(file);
      }),
    );
  }

  $citationRenderers: Record<string, CitationRenderer> = {};

  async getCitationRenderer(folder: string): Promise<CitationRenderer> {
    const renderer = this.$citationRenderers[folder];
    if (renderer) return renderer;
    const newRenderer = await getCitationRenderer(this.session, folder);
    this.$citationRenderers[folder] = newRenderer;
    return newRenderer;
  }

  $getJsonFilename(id: string) {
    return path.join(serverPath(this.options), 'app', 'content', `${id}.json`);
  }

  $processed: Record<string, RendererData> = {};

  async processFile(file: NextFile): Promise<boolean> {
    const toc = tic();
    const { filename, folder, slug } = file;
    const webFolder = path.basename(folder);
    const id = path.join(webFolder, slug);
    this.session.log.debug(`Reading file "${filename}"`);
    const content = fs.readFileSync(filename).toString();
    const citeRenderer = await this.getCitationRenderer(folder);
    const jsonFilename = this.$getJsonFilename(id);
    const filenames = { from: filename, to: jsonFilename };
    const { fromCache, data } = await processFile(this, filenames, content, citeRenderer);
    const changed = this.$processLinks ? transformLinks(data.mdast, this.$links) : false;
    if (changed || !fromCache) {
      writeFileToFolder(jsonFilename, JSON.stringify(data));
      this.session.log.info(toc(`📖 Built ${id} in %s.`));
    }
    this.registerFile(id, data);
    return !fromCache;
  }

  $links: LinkLookup = {};

  registerFile(id: string, data: RendererData) {
    this.$processed[id] = data;
    const { oxa } = data.frontmatter ?? {};
    if (oxa) {
      this.$links[oxa] = `/${id}`;
    }
  }

  /** Let the cache know not to process links & cross references */
  $processLinks = true;

  async processAllLinks() {
    await Promise.all(
      Object.entries(this.$processed).map(async ([id, data]) => {
        const jsonFilename = this.$getJsonFilename(id);
        const toc = tic();
        const changed = transformLinks(data.mdast, this.$links);
        if (changed) {
          writeFileToFolder(jsonFilename, JSON.stringify(data));
          this.session.log.info(toc(`🔗 Built links for ${id} in %s.`));
        }
      }),
    );
  }
}
