import type { CitationRenderer } from 'citation-js-utils';
import { getCitations } from 'citation-js-utils';
import { createHash } from 'crypto';
import fs from 'fs';
import yaml from 'js-yaml';
import { unified } from 'unified';
import { VFile } from 'vfile';
import type { GenericNode } from 'mystjs';
import {
  basicTransformationsPlugin,
  htmlPlugin,
  footnotesPlugin,
  ReferenceState,
  MultiPageReferenceState,
  resolveReferencesTransform,
  mathPlugin,
  codePlugin,
  enumerateTargetsPlugin,
  getFrontmatter,
  keysTransform,
  linksTransform,
  MystTransformer,
  WikiTransformer,
  RRIDTransformer,
  DOITransformer,
} from 'myst-transforms';
import { dirname, extname, join } from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import type { SiteProject } from '@curvenote/blocks';
import { KINDS } from '@curvenote/blocks';
import { getPageFrontmatter } from '../../frontmatter';
import type { Root } from 'mdast';
import { select } from 'unist-util-select';
import { parseMyst } from '../../myst';
import type { ISession } from '../../session/types';
import { loadAllConfigs } from '../../session';
import {
  transformLinkedDOIs,
  transformOutputs,
  transformCitations,
  transformImages,
  transformThumbnail,
  checkLinksTransform,
  importMdastFromJson,
  includeFilesDirective,
} from '../../transforms';
import type {
  PreRendererData,
  References,
  RendererData,
  SingleCitationRenderer,
} from '../../transforms/types';
import { loadProjectFromDisk } from '../../toc';
import { copyActionResource, copyLogo, getSiteManifest } from '../../toc/manifest';
import type { LocalProject, LocalProjectPage } from '../../toc/types';
import {
  writeFileToFolder,
  serverPath,
  staticPath,
  tic,
  addWarningForFile,
  isUrl,
  logMessagesFromVFile,
} from '../../utils';
import { selectors } from '..';
import { processNotebook } from './notebook';
import { watch } from './reducers';
import { warnings } from '../build';
import { selectFileWarnings } from '../build/selectors';
import { Inventory, Domains } from 'intersphinx';
import { OxaTransformer, StaticFileTransformer } from '../../transforms/links';
import type { Node } from 'myst-spec';
import { toText } from 'myst-common';

const LINKS_SELECTOR = 'link,card,linkBlock';

type ISessionWithCache = ISession & {
  $citationRenderers: Record<string, CitationRenderer>; // keyed on path
  $doiRenderers: Record<string, SingleCitationRenderer>; // keyed on doi
  $internalReferences: Record<string, ReferenceState>; // keyed on path
  $externalReferences: Record<string, Inventory>; // keyed on id
  $mdast: Record<string, { pre: PreRendererData; post?: RendererData }>; // keyed on path
};

type PageReferenceStates = {
  state: ReferenceState;
  file: string;
  url: string | null;
}[];

type ProcessOptions = {
  reloadConfigs?: boolean;
  watchMode?: boolean;
  writeToc?: boolean;
  writeFiles?: boolean;
  strict?: boolean;
  checkLinks?: boolean;
};

function castSession(session: ISession): ISessionWithCache {
  const cache = session as unknown as ISessionWithCache;
  if (!cache.$citationRenderers) cache.$citationRenderers = {};
  if (!cache.$doiRenderers) cache.$doiRenderers = {};
  if (!cache.$internalReferences) cache.$internalReferences = {};
  if (!cache.$externalReferences) cache.$externalReferences = {};
  if (!cache.$mdast) cache.$mdast = {};
  return cache;
}

export function changeFile(session: ISession, path: string, eventType: string) {
  session.log.debug(`File modified: "${path}" (${eventType})`);
  const cache = castSession(session);
  session.store.dispatch(watch.actions.markFileChanged({ path }));
  delete cache.$mdast[path];
  delete cache.$citationRenderers[path];
}

async function loadCitations(session: ISession, path: string) {
  const toc = tic();
  let data: string;
  if (isUrl(path)) {
    session.log.debug(`Fetching citations at "${path}"`);
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Error fetching citations from "${path}": ${res.status} ${res.statusText}`);
    }
    data = await res.text();
    session.log.debug(`Fetched citations from "${path}" successfully.`);
  } else {
    session.log.debug(`Loading citations at "${path}"`);
    data = fs.readFileSync(path).toString();
  }
  const renderer = await getCitations(data);
  const numCitations = Object.keys(renderer).length;
  const plural = numCitations > 1 ? 's' : '';
  session.log.info(toc(`🏫 Read ${numCitations} citation${plural} from ${path} in %s.`));
  return renderer;
}

async function loadInterspinx(
  session: ISession,
  opts: { projectPath: string; force?: boolean },
): Promise<Inventory[]> {
  const projectConfig = selectors.selectProjectConfig(session.store.getState(), opts.projectPath);
  const cache = castSession(session);
  // A bit confusing here, references is the frontmatter, but those are `externalReferences`
  if (!projectConfig?.references) return [];
  const references = Object.entries(projectConfig.references)
    .filter(([key, object]) => {
      if (isUrl(object.url)) return true;
      session.log.error(`⚠️  ${key} references is not a valid url: "${object.url}"`);
      return false;
    })
    .map(([key, object]) => {
      if (!cache.$externalReferences[key] || opts.force) {
        cache.$externalReferences[key] = new Inventory({ id: key, path: object.url });
      }
      return cache.$externalReferences[key];
    })
    .filter((exists) => !!exists);
  await Promise.all(
    references.map(async (loader) => {
      if (loader._loaded) return;
      const toc = tic();
      try {
        await loader.load();
      } catch (error) {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
        session.log.error(`Problem fetching references entry: ${loader.id} (${loader.path})`);
        return null;
      }
      session.log.info(
        toc(`🏫 Read ${loader.numEntries} references links for "${loader.id}" in %s.`),
      );
    }),
  );
  return references;
}

function combineCitationRenderers(cache: ISessionWithCache, ...files: string[]) {
  const combined: CitationRenderer = {};
  files.forEach((file) => {
    const renderer = cache.$citationRenderers[file] ?? {};
    Object.keys(renderer).forEach((key) => {
      if (combined[key]) {
        addWarningForFile(cache, file, `Duplicate citation with id: ${key}`);
      }
      combined[key] = renderer[key];
    });
  });
  return combined;
}

export function combineProjectCitationRenderers(session: ISession, projectPath: string) {
  const project = selectors.selectLocalProject(session.store.getState(), projectPath);
  const cache = castSession(session);
  if (!project?.bibliography) return;
  cache.$citationRenderers[projectPath] = combineCitationRenderers(cache, ...project.bibliography);
}

export async function loadFile(
  session: ISession,
  file: string,
  extension?: '.md' | '.ipynb' | '.bib',
) {
  const toc = tic();
  session.store.dispatch(warnings.actions.clearWarnings({ file }));
  const cache = castSession(session);
  let success = true;
  let sha256: string | undefined;
  try {
    const ext = extension || extname(file).toLowerCase();
    switch (ext) {
      case '.md': {
        const content = fs.readFileSync(file).toString();
        sha256 = createHash('sha256').update(content).digest('hex');
        const mdast = parseMyst(content);
        cache.$mdast[file] = { pre: { kind: KINDS.Article, file, mdast } };
        break;
      }
      case '.ipynb': {
        const content = fs.readFileSync(file).toString();
        sha256 = createHash('sha256').update(content).digest('hex');
        const mdast = await processNotebook(cache, file, content);
        cache.$mdast[file] = { pre: { kind: KINDS.Notebook, file, mdast } };
        break;
      }
      case '.bib': {
        const renderer = await loadCitations(session, file);
        cache.$citationRenderers[file] = renderer;
        break;
      }
      default:
        session.log.error(`Unrecognized extension ${file}`);
        session.log.info(
          `"${file}": Please rerun the build with "-c" to ensure the built files are cleared.`,
        );
        success = false;
    }
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    session.log.error(`Error reading file ${file}: ${error}`);
    success = false;
  }
  session.store.dispatch(watch.actions.markFileChanged({ path: file, sha256 }));
  if (success) session.log.debug(toc(`loadFile: loaded ${file} in %s.`));
}

export async function getRawFrontmatterFromFile(session: ISession, file: string) {
  const cache = castSession(session);
  await loadFile(session, file);
  const result = cache.$mdast[file];
  if (!result || !result.pre) return undefined;
  const frontmatter = getFrontmatter(result.pre.mdast);
  return frontmatter.frontmatter;
}

const htmlHandlers = {
  comment(h: any, node: any) {
    // Prevents HTML comments from showing up as text in web
    // TODO: Remove once this is landed in mystjs
    const result = h(node, 'comment');
    (result as GenericNode).value = node.value;
    return result;
  },
};

export async function bibFilesInDir(session: ISession, dir: string, load = true) {
  const bibFiles = await Promise.all(
    fs.readdirSync(dir).map(async (f) => {
      if (extname(f).toLowerCase() === '.bib') {
        const bibFile = join(dir, f);
        if (load) await loadFile(session, bibFile);
        return bibFile;
      }
    }),
  );
  return bibFiles.filter((f): f is string => Boolean(f));
}

export async function transformMdast(
  session: ISession,
  {
    file,
    imageWriteFolder,
    projectPath,
    pageSlug,
    projectSlug,
    imageAltOutputFolder,
    watchMode = false,
  }: {
    file: string;
    imageWriteFolder: string;
    projectPath?: string;
    projectSlug?: string;
    pageSlug?: string;
    imageAltOutputFolder?: string;
    watchMode?: boolean;
  },
) {
  const toc = tic();
  const { store, log } = session;
  const cache = castSession(session);
  if (!cache.$mdast[file]) return;
  const { mdast: mdastPre, kind } = cache.$mdast[file].pre;
  if (!mdastPre) throw new Error(`Expected mdast to be parsed for ${file}`);
  log.debug(`Processing "${file}"`);
  // Use structuredClone in future (available in node 17)
  const mdast = JSON.parse(JSON.stringify(mdastPre)) as Root;
  const frontmatter = getPageFrontmatter(session, mdast, file, projectPath);
  const references: References = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  const state = new ReferenceState({ numbering: frontmatter.numbering, file: vfile });
  cache.$internalReferences[file] = state;
  // Import additional content from mdast or other files
  importMdastFromJson(session, file, mdast);
  includeFilesDirective(session, file, mdast);

  await unified()
    .use(basicTransformationsPlugin)
    .use(htmlPlugin, { htmlHandlers })
    .use(mathPlugin, { macros: frontmatter.math })
    .use(enumerateTargetsPlugin, { state }) // This should be after math
    .run(mdast, vfile);

  // Run the link transformations that can be done without knowledge of other files
  const intersphinx = projectPath ? await loadInterspinx(session, { projectPath }) : [];
  const transformers = [
    new WikiTransformer(),
    new RRIDTransformer(),
    new DOITransformer(), // This also is picked up in the next transform
    new MystTransformer(intersphinx),
  ];
  linksTransform(mdast, vfile, { transformers, selector: LINKS_SELECTOR });

  // Initialize citation renderers for this (non-bib) file
  cache.$citationRenderers[file] = await transformLinkedDOIs(log, mdast, cache.$doiRenderers, file);
  const rendererFiles = [file];
  if (projectPath) {
    rendererFiles.unshift(projectPath);
  } else {
    const localFiles = (await bibFilesInDir(session, dirname(file))) || [];
    rendererFiles.push(...localFiles);
  }
  // Combine file-specific citation renderers with project renderers from bib files
  const fileCitationRenderer = combineCitationRenderers(cache, ...rendererFiles);
  // Kind needs to still be Article here even if jupytext, to handle outputs correctly
  await transformOutputs(session, mdast, kind);
  transformCitations(log, mdast, fileCitationRenderer, references, file);
  await unified()
    .use(codePlugin, { lang: frontmatter?.kernelspec?.language })
    .use(footnotesPlugin, { references }) // Needs to happen nead the end
    .run(mdast, vfile);
  await transformImages(session, mdast, file, imageWriteFolder, {
    altOutputFolder: imageAltOutputFolder,
  });
  // Note, the thumbnail transform must be **after** images, as it may read the images
  await transformThumbnail(session, mdast, file, frontmatter, imageWriteFolder, {
    altOutputFolder: imageAltOutputFolder,
  });
  const sha256 = selectors.selectFileInfo(store.getState(), file).sha256 as string;
  store.dispatch(
    watch.actions.updateFileInfo({
      path: file,
      title: frontmatter.title,
      description: frontmatter.description,
      date: frontmatter.date,
      thumbnail: frontmatter.thumbnail,
      thumbnailOptimized: frontmatter.thumbnailOptimized,
      tags: frontmatter.tags,
      url: `/${projectSlug}/${pageSlug}`,
    }),
  );
  if (frontmatter.oxa) {
    store.dispatch(
      watch.actions.updateLinkInfo({
        path: file,
        oxa: frontmatter.oxa,
        url: `/${projectSlug}/${pageSlug}`,
      }),
    );
  }
  const data: RendererData = {
    kind: frontmatter.kernelspec || frontmatter.jupytext ? KINDS.Notebook : kind,
    file,
    sha256,
    slug: pageSlug,
    frontmatter,
    mdast,
    references,
  };
  cache.$mdast[file].post = data;
  logMessagesFromVFile(session, vfile);
  if (!watchMode) log.info(toc(`📖 Built ${file} in %s.`));
}

export async function postProcessMdast(
  session: ISession,
  {
    file,
    checkLinks,
    pageReferenceStates,
  }: {
    file: string;
    checkLinks?: boolean;
    pageReferenceStates?: PageReferenceStates;
  },
) {
  const toc = tic();
  const { log } = session;
  const cache = castSession(session);
  const mdastPost = selectFile(session, file);
  const fileState = cache.$internalReferences[file];
  const state = pageReferenceStates
    ? new MultiPageReferenceState(pageReferenceStates, file)
    : fileState;
  // NOTE: This is doing things in place, we should potentially make this a different state?
  const transformers = [
    new OxaTransformer(session), // This links any oxa links to their file if they exist
    new StaticFileTransformer(session, file), // Links static files and internally linked files
  ];
  linksTransform(mdastPost.mdast, state.file as VFile, {
    transformers,
    selector: LINKS_SELECTOR,
  });
  resolveReferencesTransform(mdastPost.mdast, state.file as VFile, { state });
  // Ensure there are keys on every node
  keysTransform(mdastPost.mdast);
  logMessagesFromVFile(session, fileState.file);
  log.debug(toc(`Transformed mdast cross references and links for "${file}" in %s`));
  if (checkLinks) await checkLinksTransform(session, file, mdastPost.mdast);
}

export function selectFile(session: ISession, file: string) {
  const cache = castSession(session);
  if (!cache.$mdast[file]) throw new Error(`Expected mdast to be processed for ${file}`);
  const mdastPost = cache.$mdast[file].post;
  if (!mdastPost) throw new Error(`Expected mdast to be processed and transformed for ${file}`);
  return mdastPost;
}

export function writeFile(
  session: ISession,
  { file, pageSlug, projectSlug }: { file: string; projectSlug: string; pageSlug: string },
) {
  const toc = tic();
  const mdastPost = selectFile(session, file);
  const id = join(projectSlug, pageSlug);
  const jsonFilename = join(serverPath(session), 'app', 'content', `${id}.json`);
  writeFileToFolder(jsonFilename, JSON.stringify(mdastPost));
  session.log.debug(toc(`Wrote "${file}" in %s`));
}

export async function writeSiteManifest(session: ISession) {
  const configPath = join(serverPath(session), 'app', 'config.json');
  session.log.info('⚙️  Writing site config.json');
  const siteManifest = getSiteManifest(session);
  writeFileToFolder(configPath, JSON.stringify(siteManifest));
}

/**
 * Returns the heading title or the caption as text
 */
function getReferenceTitleAsText(targetNode: Node): string | undefined {
  if (targetNode.type === 'heading') {
    return toText(targetNode);
  }
  const caption = select('caption > paragraph', targetNode);
  if (caption) return toText(caption);
}

export function addProjectReferencesToObjectsInv(
  session: ISession,
  inv: Inventory,
  opts: { projectPath: string },
) {
  const { pages } = loadProject(session, opts.projectPath);
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  pageReferenceStates.forEach((page) => {
    const { title } = selectors.selectFileInfo(session.store.getState(), page.file);
    inv.setEntry({
      type: Domains.stdDoc,
      name: (page.url as string).replace(/^\//, ''),
      location: page.url as string,
      display: title ?? '',
    });
    Object.entries(page.state.targets).forEach(([name, target]) => {
      if ((target.node as any).implicit) {
        // Don't include implicit references
        return;
      }
      inv.setEntry({
        type: Domains.stdLabel,
        name,
        location: `${page.url}#${(target.node as any).html_id ?? target.node.identifier}`,
        display: getReferenceTitleAsText(target.node),
      });
    });
  });
  return inv;
}

export function loadProject(session: ISession, projectPath: string, writeToc = false) {
  const project = loadProjectFromDisk(session, projectPath, {
    writeToc,
  });
  // Load the citations first, or else they are loaded in each call below
  const pages = [
    { file: project.file, slug: project.index },
    ...project.pages.filter((page): page is LocalProjectPage => 'file' in page),
  ];
  return { project, pages };
}

export function selectPageReferenceStates(session: ISession, pages: { file: string }[]) {
  const cache = castSession(session);
  const pageReferenceStates: PageReferenceStates = pages
    .map((page) => ({
      state: cache.$internalReferences[page.file],
      file: page.file,
      url: selectors.selectFileInfo(session.store.getState(), page.file)?.url ?? null,
    }))
    .filter(({ state }) => !!state);
  return pageReferenceStates;
}

export async function fastProcessFile(
  session: ISession,
  {
    file,
    pageSlug,
    projectPath,
    projectSlug,
  }: { file: string; projectPath: string; projectSlug: string; pageSlug: string },
) {
  const toc = tic();
  await loadFile(session, file);
  await transformMdast(session, {
    file,
    imageWriteFolder: staticPath(session),
    imageAltOutputFolder: '/_static/',
    projectPath,
    projectSlug,
    pageSlug,
    watchMode: true,
  });
  const { pages } = loadProject(session, projectPath);
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  await postProcessMdast(session, { file, pageReferenceStates });
  writeFile(session, { file, pageSlug, projectSlug });
  session.log.info(toc(`📖 Built ${file} in %s.`));
  await writeSiteManifest(session);
}

export async function processProject(
  session: ISession,
  siteProject: SiteProject,
  opts?: ProcessOptions,
): Promise<LocalProject> {
  const toc = tic();
  const { log } = session;
  const { watchMode, writeToc, writeFiles = true } = opts || {};
  if (!siteProject.path) {
    log.error(`No local path for site project: ${siteProject.slug}`);
    if (siteProject.remote) log.error(`Remote path not supported: ${siteProject.slug}`);
    throw Error('Unable to process project');
  }
  const { project, pages } = loadProject(session, siteProject.path, writeFiles && writeToc);
  if (!watchMode) {
    await Promise.all([
      // Load all citations (.bib)
      ...project.bibliography.map((path) => loadFile(session, path, '.bib')),
      // Load all content (.md and .ipynb)
      ...pages.map((page) => loadFile(session, page.file)),
      // Load up all the intersphinx references
      loadInterspinx(session, { projectPath: siteProject.path }) as Promise<any>,
    ]);
  }
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, siteProject.path);
  // Transform all pages
  await Promise.all(
    pages.map((page) =>
      transformMdast(session, {
        file: page.file,
        imageWriteFolder: staticPath(session),
        imageAltOutputFolder: '/_static/',
        projectPath: project.path,
        projectSlug: siteProject.slug,
        pageSlug: page.slug,
        watchMode,
      }),
    ),
  );
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  // Handle all cross references
  await Promise.all(
    pages.map((page) =>
      postProcessMdast(session, {
        file: page.file,
        checkLinks: opts?.checkLinks || opts?.strict,
        pageReferenceStates,
      }),
    ),
  );
  // Write all pages
  if (writeFiles) {
    pages.map((page) =>
      writeFile(session, {
        file: page.file,
        projectSlug: siteProject.slug,
        pageSlug: page.slug,
      }),
    );
  }
  log.info(toc(`📚 Built ${pages.length} pages for ${siteProject.slug} in %s.`));
  return project;
}

export async function processSite(session: ISession, opts?: ProcessOptions): Promise<boolean> {
  if (opts?.reloadConfigs) loadAllConfigs(session);
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);
  if (!siteConfig?.projects?.length) return false;
  const projects = await Promise.all(
    siteConfig.projects.map((siteProject) => processProject(session, siteProject, opts)),
  );
  if (opts?.strict) {
    const hasWarnings = projects
      .map((project) => {
        return project.pages
          .map((page) => {
            if (!('slug' in page)) return [0, 0];
            const buildWarnings = selectFileWarnings(session.store.getState(), page.file);
            if (!buildWarnings || buildWarnings.length === 0) return [0, 0];
            const resp = buildWarnings
              .map(({ message, kind }) => chalk[kind === 'error' ? 'red' : 'yellow'](message))
              .join('\n  - ');
            session.log.info(`\n${page.file}\n  - ${resp}\n`);
            return [
              buildWarnings.filter(({ kind }) => kind === 'error').length,
              buildWarnings.filter(({ kind }) => kind === 'warn').length,
            ];
          })
          .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      })
      .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
    if (hasWarnings[0] > 0) {
      const pluralE = hasWarnings[0] > 1 ? 's' : '';
      const pluralW = hasWarnings[1] > 1 ? 's' : '';
      throw new Error(
        `Site has ${hasWarnings[0]} error${pluralE} and ${hasWarnings[1]} warning${pluralW}, stopping build.`,
      );
    }
  }
  if (opts?.writeFiles ?? true) {
    await writeSiteManifest(session);
    // Copy all assets
    copyLogo(session, siteConfig.logo);
    siteConfig.actions?.forEach((action) => {
      copyActionResource(session, action);
    });
    // Write the objects.inv
    const inv = new Inventory({
      project: siteConfig.title,
      // TODO: allow a version on the project?!
      version: String((siteConfig as any)?.version ?? '1'),
    });
    siteConfig.projects.forEach((project) => {
      addProjectReferencesToObjectsInv(session, inv, { projectPath: project.path as string });
    });
    const filename = join(staticPath(session), 'objects.inv');
    inv.write(filename);
  }
  return true;
}
