import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { getCitations, CitationRenderer } from 'citation-js-utils';
import { ISession } from '../../session/types';
import { tic } from '../utils/exec';
import { parseMyst, serverPath, transformMdast, writeFileToFolder } from './utils';
import { Options } from './types';
import { getFileName, SiteConfig, SiteFolder, watchConfig, writeConfig } from './webConfig';

function isSame(filename: string, hash: string): boolean {
  if (!fs.existsSync(filename)) return false;
  const content = fs.readFileSync(filename).toString();
  return JSON.parse(content).sha256 === hash;
}

async function processMarkdown(
  session: ISession,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const sha256 = createHash('sha256').update(content).digest('hex');
  if (isSame(filename.to, sha256)) return false;
  const mdast = parseMyst(content);
  const data = await transformMdast(session.log, filename.from, mdast, citeRenderer, sha256);
  writeFileToFolder(filename.to, JSON.stringify(data));
  return true;
}

async function processNotebook(
  session: ISession,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const sha256 = createHash('sha256').update(content).digest('hex');
  if (isSame(filename.to, sha256)) return false;
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
  const data = await transformMdast(session.log, filename.from, mdast, citeRenderer, sha256);
  writeFileToFolder(filename.to, JSON.stringify(data));
  return true;
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

async function processFile(session: ISession, opts: Options, file: NextFile): Promise<boolean> {
  const toc = tic();
  const { filename, folder, slug } = file;
  const webFolder = path.basename(folder);
  session.log.debug(`Reading file "${filename}"`);
  const f = fs.readFileSync(filename).toString();
  const citeRenderer = await getCitationRenderer(session, folder);
  const jsonFile = path.join(`${serverPath(opts)}/app/content/${webFolder}/${slug}.json`);
  let built = false;
  if (filename.endsWith('.md')) {
    built = await processMarkdown(session, { from: filename, to: jsonFile }, f, citeRenderer);
  } else if (filename.endsWith('.ipynb')) {
    built = await processNotebook(session, { from: filename, to: jsonFile }, f, citeRenderer);
  }
  if (built) session.log.info(toc(`📖 Built ${webFolder}/${slug} in %s.`));
  return built;
}

async function processFolder(
  session: ISession,
  opts: Options,
  section: SiteConfig['site']['sections'][0],
  folder: SiteFolder,
): Promise<{ id: string; processed: boolean }[]> {
  const pages = [{ slug: folder.index }, ...folder.pages];
  const slugs = pages.filter(({ slug }) => slug) as { slug: string }[];
  const files = await Promise.all(
    slugs.map(async ({ slug }) => {
      const { filename } = getFileName(section.path, slug);
      const processed = await processFile(session, opts, {
        folder: section.folder,
        slug,
        filename,
      });
      return { id: `${section.folder}/${slug}`, processed };
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
    (config?.site.sections ?? []).map((sec) => {
      const folder = config?.folders[sec.folder];
      if (!folder) return null;
      return processFolder(session, opts, sec, folder);
    }),
  );
  return folders.flat().filter((f) => f) as { id: string; processed: boolean }[];
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
