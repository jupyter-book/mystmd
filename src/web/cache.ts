import { CitationRenderer, getCitations } from 'citation-js-utils';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { createHash } from 'crypto';
import yaml from 'js-yaml';
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
import { FolderConfig, FolderContext, IDocumentCache, Options, SiteConfig } from './types';
import { parseMyst, publicPath, serverPath } from './utils';

import { LinkLookup, RendererData, transformLinks, transformMdast } from './transforms';
import { readConfig } from './webConfig';
import { createWebFileObjectFactory } from './files';
import { writeFileToFolder } from '../utils';
import { DEFAULT_FRONTMATTER, getFrontmatterFromConfig } from './frontmatter';

type NextFile = { filename: string; folder: string; slug: string };

async function processMarkdown(
  cache: IDocumentCache,
  context: FolderContext,
  filename: { from: string; to: string; folder: string },
  content: string,
) {
  const mdast = parseMyst(content);
  const data = await transformMdast(cache, context, filename, mdast);
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
  context: FolderContext,
  filename: { from: string; to: string; folder: string },
  content: string,
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

  let end = children.length;
  if (
    children &&
    children.length > 1 &&
    children?.[children.length - 1].content.content.length === 0
  )
    end = -1;

  const items = await children?.slice(0, end).reduce(async (P, item: TranslatedBlockPair) => {
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
  }, Promise.resolve([] as string[]));

  const mdast = parseMyst(items.join('\n\n+++\n\n'));

  // TODO: typing
  selectAll('output', mdast).forEach((output: GenericNode) => {
    output.data = outputMap[output.id];
  });

  const data = await transformMdast(cache, context, filename, mdast);
  return data;
}

async function processFile(
  cache: IDocumentCache,
  context: FolderContext,
  filename: { from: string; to: string; folder: string; url: string },
  content: string,
): Promise<null | { fromCache: boolean; data: RendererData }> {
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
      data = await processMarkdown(cache, context, filename, content);
      break;
    case '.ipynb':
      data = await processNotebook(cache, context, filename, content);
      break;
    case '.bib':
      // TODO: Clear cache, relink all files in the folder, use transformCitations
      delete (cache as DocumentCache).$citationRenderers[filename.folder];
      cache.session.log.error(
        `"${filename.from}": Please rerun the build with -c. References aren't yet handled.`,
      );
      return null;
    case '.yml':
      delete (cache as DocumentCache).$folderConfig[filename.folder];
      await (cache as DocumentCache).getFolderConfig(filename.folder);
      // TODO: Rebuild all content in folder
      cache.session.log.error(
        `"${filename.from}": Please rerun the build with -c. _config.yml aren't yet handled.`,
      );
      return null;
    default:
      cache.session.log.error(`Unrecognized extension ${filename.from}`);
      return null;
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

async function getFolderConfig(session: ISession, folder: string): Promise<FolderConfig> {
  const folderConfig = path.join(folder, '_config.yml');
  if (!fs.existsSync(folderConfig)) {
    session.log.debug(`Did not find a folder config at "${folderConfig}"`);
    return DEFAULT_FRONTMATTER;
  }
  const config = yaml.load(fs.readFileSync(folderConfig).toString()) as any;
  return getFrontmatterFromConfig(
    session.log,
    folder,
    session.config?.frontmatter ?? { ...DEFAULT_FRONTMATTER },
    config,
  );
}

export function watchConfig(cache: IDocumentCache) {
  return chokidar
    .watch(cache.session.configPath, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 50 },
    })
    .on('all', async () => {
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

  $folderConfig: Record<string, FolderConfig> = {};

  async getFolderConfig(folder: string): Promise<FolderConfig> {
    const config = this.$folderConfig[folder];
    if (config) return config;
    const newConfig = await getFolderConfig(this.session, folder);
    this.$folderConfig[folder] = newConfig;
    return newConfig;
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
    const folderConfig = await this.getFolderConfig(folder);
    const context: FolderContext = { folder, citeRenderer, config: folderConfig };
    const jsonFilename = this.$getJsonFilename(id);
    const filenames = { from: filename, to: jsonFilename, folder, url: webFolder };
    const processResult = await processFile(this, context, filenames, content);
    if (!processResult) return false;
    const { fromCache, data } = processResult;
    const changed = this.$startupPass ? false : transformLinks(data.mdast, this.$links);
    if (changed || !fromCache) {
      writeFileToFolder(jsonFilename, JSON.stringify(data));
      this.session.log.info(toc(`📖 Built ${id} in %s.`));
    }
    this.registerFile(id, data);
    await this.writeConfig();
    return !fromCache;
  }

  async processFile2(
    file: string,
    projectSlug: string,
    pageSlug: string,
  ): Promise<{ id: string; processed: boolean }> {
    const toc = tic();
    const id = path.join(projectSlug, pageSlug);
    this.session.log.debug(`Reading file "${file}"`);
    const content = fs.readFileSync(file).toString();
    const citeRenderer = await this.getCitationRenderer(projectSlug);
    const folderConfig = await this.getFolderConfig(projectSlug);
    const context: FolderContext = { folder: projectSlug, citeRenderer, config: folderConfig };
    const jsonFilename = this.$getJsonFilename(id);
    const filenames = { from: file, to: jsonFilename, folder: projectSlug, url: projectSlug };
    const processResult = await processFile(this, context, filenames, content);
    if (!processResult) return { id, processed: false };
    const { fromCache, data } = processResult;
    const changed = this.$startupPass ? false : transformLinks(data.mdast, this.$links);
    if (changed || !fromCache) {
      writeFileToFolder(jsonFilename, JSON.stringify(data));
      this.session.log.info(toc(`📖 Built ${id} in %s.`));
    }
    this.registerFile(id, data);
    await this.writeConfig();
    return { id, processed: !fromCache };
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
    if (oxa && typeof oxa === 'string') {
      this.$links[oxa] = {
        url: `/${id}`,
        title: data.frontmatter.title || undefined,
        description: data.frontmatter.description || undefined,
        thumbnail: undefined,
      };
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
  }

  async writeConfig() {
    if (this.$startupPass || !this.$configDirty) return;
    const pathname = path.join(serverPath(this.options), 'app', 'config.json');
    this.session.log.info('⚙️  Writing config.json');
    fs.writeFileSync(pathname, JSON.stringify(this.config));
    this.$configDirty = false;
  }
}
