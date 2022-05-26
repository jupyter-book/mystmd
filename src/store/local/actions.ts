import fs from 'fs';
import yaml from 'js-yaml';
import { extname, join, dirname } from 'path';
import { convertHtmlToMdast, GenericNode, selectAll } from 'mystjs';
import { CitationRenderer, getCitations } from 'citation-js-utils';
import { createHash } from 'crypto';
import { ISession } from '../../session/types';
import { References, RendererData, Root } from '../../web/transforms/types';
import { watch } from './reducers';
import { parseMyst, serverPath } from '../../web/utils';
import { tic } from '../../export/utils/exec';
import { Logger } from '../../logging';
import { transformRoot } from '../../web/transforms/root';
import { getPageFrontmatter } from '../../web/frontmatter';
import { writeFileToFolder } from '../../utils';
import { SingleCitationRenderer, transformLinkedDOIs } from '../../web/transforms/dois';
import { ensureBlockNesting } from '../../web/transforms/blocks';
import { transformMath } from '../../web/transforms/math';
import { transformOutputs } from '../../web/transforms/outputs';
import { transformCitations } from '../../web/transforms/citations';
import { selectors } from '..';
import { transformEnumerators } from '../../web/transforms/enumerate';
import { transformFootnotes } from '../../web/transforms/footnotes';
import { transformKeys } from '../../web/transforms/keys';
import { transformImages } from '../../web/transforms/images';
import { processNotebook } from './notebook';
import { copyLogo, getSiteManifest, loadProjectFromDisk } from '../../toc';
import { LocalProjectPage, SiteProject } from '../../types';
import { selectFileInfo } from './selectors';

type ISessionWithCache = ISession & {
  $citationRenderers: Record<string, CitationRenderer>; // keyed on path
  $doiRenderers: Record<string, SingleCitationRenderer>; // keyed on doi
  $mdast: Record<string, { pre: Root; post?: RendererData }>; // keyed on path
};

function castSession(session: ISession): ISessionWithCache {
  const cache = session as unknown as ISessionWithCache;
  if (!cache.$citationRenderers) cache.$citationRenderers = {};
  if (!cache.$doiRenderers) cache.$doiRenderers = {};
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
  session.log.debug(`Loading citations at "${path}"`);
  const f = fs.readFileSync(path).toString();
  const renderer = await getCitations(f);
  const numCitations = Object.keys(renderer).length;
  const plural = numCitations > 1 ? 's' : '';
  session.log.info(toc(`🏫 Read ${numCitations} citation${plural} from ${path} in %s.`));
  return renderer;
}

function combineRenderers(cache: ISessionWithCache, ...files: string[]) {
  const combined: CitationRenderer = {};
  files.forEach((file) => {
    const renderer = cache.$citationRenderers[file];
    Object.keys(renderer).forEach((key) => {
      if (combined[key]) {
        cache.log.warn(`Duplicate citations in ${file} with id: ${key}`);
      }
      combined[key] = renderer[key];
    });
  });
  return combined;
}

export function combineProjectCitationRenderers(session: ISession, projectPath: string) {
  const project = selectors.selectLocalProject(session.store.getState(), projectPath);
  const cache = castSession(session);
  if (!project?.citations) return;
  cache.$citationRenderers[projectPath] = combineRenderers(cache, ...project.citations);
}

export async function loadFile(session: ISession, path: string) {
  const toc = tic();
  const cache = castSession(session);
  const content = fs.readFileSync(path).toString();
  const sha256 = createHash('sha256').update(content).digest('hex');
  const ext = extname(path);
  let success = true;
  switch (ext) {
    case '.md': {
      const mdast = parseMyst(content);
      cache.$mdast[path] = { pre: mdast };
      break;
    }
    case '.ipynb': {
      const mdast = await processNotebook(cache, path, content);
      cache.$mdast[path] = { pre: mdast };
      break;
    }
    case '.bib': {
      const renderer = await loadCitations(session, path);
      cache.$citationRenderers[path] = renderer;
      break;
    }
    default:
      session.log.error(`Unrecognized extension ${path}`);
      session.log.info(
        `"${path}": Please rerun the build with "-c" to ensure the built files are cleared.`,
      );
      success = false;
  }
  session.store.dispatch(watch.actions.markFileChanged({ path, sha256 }));
  if (success) session.log.debug(toc(`loadFile: loaded ${path} in %s.`));
}

/**
 * This is the {mdast} directive, that loads from disk
 * For example, tables that can't be represented in markdown.
 */
function importMdastFromJson(log: Logger, filename: string, mdast: Root) {
  const mdastNodes = selectAll('mdast', mdast) as GenericNode[];
  const loadedData: Record<string, GenericNode> = {};
  const dir = dirname(filename);
  mdastNodes.forEach((node) => {
    const [mdastFilename, id] = node.id.split('#');
    let data = loadedData[mdastFilename];
    if (!data) {
      data = JSON.parse(fs.readFileSync(join(dir, mdastFilename)).toString());
      loadedData[mdastFilename] = data;
    }
    if (!data[id]) {
      log.error(`Mdast Node import: Could not find ${id} in ${mdastFilename}`);
      return;
    }
    // Clear the current object
    Object.keys(node).forEach((k) => {
      delete node[k];
    });
    // Replace with the import
    Object.assign(node, data[id]);
  });
}

const htmlHandlers = {
  comment(h: any, node: any) {
    // Prevents HTML comments from showing up as text in curvespace
    // TODO: Remove once this is landed in mystjs
    const result = h(node, 'comment');
    (result as GenericNode).value = node.value;
    return result;
  },
};

export async function transformMdast(
  session: ISession,
  {
    projectPath,
    file,
    watchMode = false,
  }: { projectPath: string; file: string; watchMode?: boolean },
) {
  const toc = tic();
  const { store, log } = session;
  const cache = castSession(session);
  const mdastPre = cache.$mdast[file]?.pre;
  if (!mdastPre) throw new Error(`Expected mdast to be processed for ${file}`);
  log.debug(`Processing "${file}"`);
  // Use structuredClone in future (available in node 17)
  let mdast = JSON.parse(JSON.stringify(mdastPre)) as Root;
  const frontmatter = getPageFrontmatter(session, projectPath, mdast);
  const references: References = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  importMdastFromJson(session.log, file, mdast); // This must be first!
  mdast = await transformRoot(mdast);
  convertHtmlToMdast(mdast, { htmlHandlers });
  // Initialize citation renderers for this (non-bib) file
  cache.$citationRenderers[file] = await transformLinkedDOIs(log, mdast, cache.$doiRenderers, file);
  ensureBlockNesting(mdast);
  transformMath(log, mdast, frontmatter);
  transformOutputs(mdast);
  // Combine file-specific citation renderers with project renderers from bib files
  const fileCitationRenderer = combineRenderers(cache, projectPath, file);
  transformCitations(log, mdast, fileCitationRenderer, references);
  transformEnumerators(mdast, frontmatter);
  transformFootnotes(mdast, references); // Needs to happen nead the end
  transformKeys(mdast);
  await transformImages(session, mdast, dirname(file));
  const sha256 = selectFileInfo(store.getState(), file).sha256 as string;
  store.dispatch(watch.actions.updateFileInfo({ path: file, title: frontmatter.title }));
  const data: RendererData = { sha256, frontmatter, mdast, references };
  cache.$mdast[file].post = data;
  if (!watchMode) log.info(toc(`📖 Built ${file} in %s.`));
}

export async function writeFile(
  session: ISession,
  { file, pageSlug, projectSlug }: { file: string; projectSlug: string; pageSlug: string },
) {
  const toc = tic();
  const { log } = session;
  const cache = castSession(session);
  const mdastPost = cache.$mdast[file]?.post;
  if (!mdastPost) throw new Error(`Expected mdast to be processed and transformed for ${file}`);
  const id = join(projectSlug, pageSlug);
  const jsonFilename = join(serverPath(session), 'app', 'content', `${id}.json`);
  writeFileToFolder(jsonFilename, JSON.stringify(mdastPost));
  log.debug(toc(`Wrote "${file}" in %s`));
}

export async function writeSiteManifest(session: ISession) {
  const configPath = join(serverPath(session), 'app', 'config.json');
  session.log.info('⚙️  Writing site config.json');
  const siteManifest = getSiteManifest(session);
  writeFileToFolder(configPath, JSON.stringify(siteManifest));
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
  await transformMdast(session, { file, projectPath, watchMode: true });
  await writeFile(session, { file, pageSlug, projectSlug });
  session.log.info(toc(`📖 Built ${file} in %s.`));
  await writeSiteManifest(session);
}

export async function processProject(
  session: ISession,
  siteProject: SiteProject,
  watchMode = false,
) {
  const toc = tic();
  const { log } = session;
  const project = loadProjectFromDisk(session, siteProject.path);
  // Load the citations first, or else they are loaded in each call below
  const pages = [
    { file: project.file, slug: project.index },
    ...project.pages.filter((page): page is LocalProjectPage => 'file' in page),
  ];
  if (!watchMode) {
    await Promise.all([
      // Load all citations (.bib)
      ...project.citations.map((path) => loadFile(session, path)),
      // Load all content (.md and .ipynb)
      ...pages.map((page) => loadFile(session, page.file)),
    ]);
  }
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, siteProject.path);
  // Transform all pages
  await Promise.all(
    pages.map((page) =>
      transformMdast(session, { projectPath: project.path, file: page.file, watchMode }),
    ),
  );
  // Write all pages
  await Promise.all(
    pages.map((page) =>
      writeFile(session, {
        file: page.file,
        projectSlug: siteProject.slug,
        pageSlug: page.slug,
      }),
    ),
  );
  log.info(toc(`📚 Built ${pages.length} pages for ${siteProject.slug} in %s.`));
}

export async function processSite(session: ISession, watchMode = false): Promise<boolean> {
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);
  if (!siteConfig?.projects.length) return false;
  await Promise.all(
    siteConfig.projects.map((siteProject) => processProject(session, siteProject, watchMode)),
  );
  await writeSiteManifest(session);
  copyLogo(session, siteConfig.logo);
  return true;
}
