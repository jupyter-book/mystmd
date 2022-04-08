import { CitationRenderer, getCitations } from 'citation-js-utils';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { ISession } from '../../session/types';
import { tic } from '../utils/exec';
import { Options, SiteConfig } from './types';
import { parseMyst, serverPath, transformMdast, writeFileToFolder } from './utils';

type NextFile = { filename: string; folder: string; slug: string };

function isSame(filename: string, hash: string): boolean {
  if (!fs.existsSync(filename)) return false;
  const content = fs.readFileSync(filename).toString();
  return JSON.parse(content).sha256 === hash;
}

async function processMarkdown(
  cache: DocumentCache,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const sha256 = createHash('sha256').update(content).digest('hex');
  if (isSame(filename.to, sha256)) return false;
  const mdast = parseMyst(content);
  const data = await transformMdast(
    cache.session.log,
    cache.config,
    filename.from,
    mdast,
    citeRenderer,
    sha256,
  );
  writeFileToFolder(filename.to, JSON.stringify(data));
  return true;
}

async function processNotebook(
  cache: DocumentCache,
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
  const data = await transformMdast(
    cache.session.log,
    cache.config,
    filename.from,
    mdast,
    citeRenderer,
    sha256,
  );
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

  async processFile(file: NextFile): Promise<boolean> {
    const toc = tic();
    const { filename, folder, slug } = file;
    const webFolder = path.basename(folder);
    this.session.log.debug(`Reading file "${filename}"`);
    const f = fs.readFileSync(filename).toString();
    const citeRenderer = await getCitationRenderer(this.session, folder);
    const jsonFile = path.join(`${serverPath(this.options)}/app/content/${webFolder}/${slug}.json`);
    let built = false;
    if (filename.endsWith('.md')) {
      built = await processMarkdown(this, { from: filename, to: jsonFile }, f, citeRenderer);
    } else if (filename.endsWith('.ipynb')) {
      built = await processNotebook(this, { from: filename, to: jsonFile }, f, citeRenderer);
    }
    if (built) this.session.log.info(toc(`📖 Built ${webFolder}/${slug} in %s.`));
    return built;
  }
}
