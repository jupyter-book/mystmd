import { CitationRenderer, getCitations } from 'citation-js-utils';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import {
  parseNotebook,
  TranslatedBlockPair,
  minifyCellOutput,
  MinifiedOutput,
} from '@curvenote/nbtx';
import { nanoid } from 'nanoid';
import { CellOutput, ContentFormatTypes, KINDS } from '@curvenote/blocks';
import { GenericNode, selectAll } from 'mystjs';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { IDocumentCache, Options, SiteConfig } from './types';
import { parseMyst, publicPath, RendererData, serverPath, transformMdast } from './utils';

import { LinkLookup, transformLinks } from './transforms';
import { copyImages, readConfig } from './webConfig';
import { createWebFileObjectFactory } from './files';
import { writeFileToFolder } from '../utils';

type NextFile = { filename: string; folder: string; slug: string };

async function processMarkdown(
  cache: IDocumentCache,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const mdast = parseMyst(content);
  const data = await transformMdast(cache, filename.from, mdast, citeRenderer);
  return data;
}

function asString(source?: string | string[]): string {
  return (Array.isArray(source) ? source.join('') : source) || '';
}

function createOutputDirective(): { myst: string; id: string } {
  const id = nanoid();
  return { myst: `\`\`\`{output}\n:id: ${id}\n\`\`\``, id };
}

async function processNotebook(
  cache: IDocumentCache,
  filename: { from: string; to: string },
  content: string,
  citeRenderer: CitationRenderer,
) {
  const { log } = cache.session;
  const { notebook, children } = parseNotebook(JSON.parse(content));
  // notebook will be empty, use generateNotebookChildren, generateNotebookOrder here if we want to populate those

  const language = notebook.language ?? notebook.metadata?.kernelspec.language ?? 'python';
  log.debug(`Processing Notebook: "${filename.from}"`);

  const fileFactory = createWebFileObjectFactory(log, publicPath(cache.options), '_static', {
    useHash: true,
  });

  const outputMap: Record<string, MinifiedOutput[]> = {};

  const items = (
    await children?.reduce(async (P, item: TranslatedBlockPair) => {
      const acc = await P;
      if (item.content.kind === KINDS.Content) {
        if (item.content.format === ContentFormatTypes.md)
          return acc.concat(asString(item.content.content));
        if (item.content.format === ContentFormatTypes.txt)
          return acc.concat(`\`\`\`\n${asString(item.content.content)}\n\`\`\``);
      }
      if (item.content.kind === KINDS.Code) {
        const code = `\`\`\`${language}\n${asString(item.content.content)}\n\`\`\``;
        if (item.output && item.output.original) {
          const minified: MinifiedOutput[] = await minifyCellOutput(
            fileFactory,
            item.output.original as CellOutput[],
            { basepath: '' }, // fileFactory takes care of this
          );

          const { myst, id } = createOutputDirective();
          outputMap[id] = minified;

          return acc.concat(code).concat([myst]);
        }
        return acc.concat(code);
      }
      return acc;
    }, Promise.resolve([] as string[]))
  ).join('\n\n+++\n\n');

  const mdast = parseMyst(items);

  // TODO: typing
  selectAll('output', mdast).forEach((output: GenericNode) => {
    output.data = outputMap[output.id];
  });

  const data = await transformMdast(cache, filename.from, mdast, citeRenderer);
  return data;
}

async function processFile(
  cache: IDocumentCache,
  filename: { from: string; to: string; folder: string; url: string },
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
    case '.bib':
      // TODO: Clear cache, relink all files in the folder, use transformCitations
      // TODO: delete cache.$citationRenderers[filename.folder]
      throw new Error(
        `Please rerun the build/start with -C. References aren't yet handled for "${filename.folder}"`,
      );
    default:
      throw new Error(`Unrecognized extension ${filename.from}`);
  }
  return { fromCache: false, data: { ...data, sha256 } };
}

async function getCitationRenderer(session: ISession, folder: string): Promise<CitationRenderer> {
  const referenceFilename = path.join(folder, 'references.bib');
  if (!fs.existsSync(referenceFilename)) {
    session.log.debug(`Expected references at "${referenceFilename}"`);
    return {};
  }
  const f = fs.readFileSync(referenceFilename).toString();
  return getCitations(f);
}

export function watchConfig(cache: IDocumentCache) {
  return fs.watchFile(cache.session.configPath, async () => {
    await cache.readConfig();
    await cache.writeConfig();
  });
}

export class DocumentCache implements IDocumentCache {
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
    const filename = path.join(folder, file);
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
    const filenames = { from: filename, to: jsonFilename, folder, url: webFolder };
    const { fromCache, data } = await processFile(this, filenames, content, citeRenderer);
    const changed = this.$startupPass ? false : transformLinks(data.mdast, this.$links);
    if (changed || !fromCache) {
      writeFileToFolder(jsonFilename, JSON.stringify(data));
      this.session.log.info(toc(`📖 Built ${id} in %s.`));
    }
    this.registerFile(id, data);
    await this.writeConfig();
    return !fromCache;
  }

  $links: LinkLookup = {};

  registerFile(id: string, data: RendererData) {
    const [folder, slug] = id.split('/');
    // Update the title in the config
    const page = this.config?.folders[folder]?.pages.find((p) => p.slug === slug);
    const title = data.frontmatter.title || slug;
    if (page && page.title !== title) {
      this.$configDirty = true;
      page.title = title;
    }
    this.$processed[id] = data;
    const { oxa } = data.frontmatter ?? {};
    if (oxa) {
      this.$links[oxa] = `/${id}`;
    }
  }

  /** Let the cache know not to process links, cross references, or config */
  $startupPass = false;

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

  $configDirty = false;

  async readConfig() {
    try {
      const config = await readConfig(this.session, this.options);
      this.$configDirty = true;
      // Update the config titles from any processed files.
      Object.entries(config.folders).forEach(([folder, { pages }]) => {
        pages.forEach((page) => {
          page.title = this.$processed[`${folder}/${page.slug}`]?.frontmatter.title || page.title;
        });
      });
      this.config = config;
    } catch (error) {
      this.session.log.error(`Error reading config:\n\n${(error as Error).message}`);
    }
    if (this.config) {
      await copyImages(this.session, this.options, this.config);
    }
  }

  async writeConfig() {
    if (this.$startupPass || !this.$configDirty) return;
    const pathname = path.join(serverPath(this.options), 'app', 'config.json');
    this.session.log.info('⚙️  Writing config.json');
    fs.writeFileSync(pathname, JSON.stringify(this.config));
    this.$configDirty = false;
  }
}
