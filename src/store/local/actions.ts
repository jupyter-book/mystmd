import fs from 'fs';
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
import { transformLinkedDOIs } from '../../web/transforms/dois';
import { ensureBlockNesting } from '../../web/transforms/blocks';
import { transformMath } from '../../web/transforms/math';
import { transformOutputs } from '../../web/transforms/outputs';
import { transformCitations } from '../../web/transforms/citations';
import { selectors } from '..';
import { transformEnumerators } from '../../web/transforms/enumerate';
import { transformFootnotes } from '../../web/transforms/footnotes';
import { transformKeys } from '../../web/transforms/keys';
import { transformImages } from '../../web/transforms/images';

type ISessionWithCache = ISession & {
  $citationRenderers: Record<string, CitationRenderer>;
  $mdast: Record<string, { pre: Root; post?: RendererData }>;
};

function castSession(session: ISession): ISessionWithCache {
  const cache = session as unknown as ISessionWithCache;
  if (!cache.$citationRenderers) cache.$citationRenderers = {};
  if (!cache.$mdast) cache.$mdast = {};
  return cache;
}

export function changeFile(session: ISession, path: string, eventType: string) {
  const cache = castSession(session);
  session.store.dispatch(watch.actions.markFileChanged({ path }));
  delete cache.$mdast[path];
  console.log(session.store.getState().local.watch);
}

async function loadCitations(session: ISession, path: string) {
  const toc = tic();
  const cache = castSession(session);
  // TODO: improve this and bring it up to the project creation
  if (!fs.existsSync(path)) {
    session.log.debug(`Expected citations at "${path}"`);
    return {};
  }
  session.log.debug(`Loading citations at "${path}"`);
  const f = fs.readFileSync(path).toString();
  const renderer = await getCitations(f);
  const numCitations = Object.keys(renderer).length;
  const plural = numCitations > 1 ? 's' : '';
  session.log.info(toc(`🏫 Read ${numCitations} citation${plural} from ${path} in %s.`));
  return renderer;
}

function combineRenderers(log: Logger, ...renderers: CitationRenderer[]) {
  const combined: CitationRenderer = {};
  renderers.forEach((renderer) => {
    Object.keys(renderer).forEach((key) => {
      if (combined[key]) {
        log.warn(`Duplicate citations with id: ${key}`);
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
  const renderers = project.citations.map((file) => cache.$citationRenderers[file]);
  cache.$citationRenderers[projectPath] = combineRenderers(session.log, ...renderers);
}

export async function loadFile(session: ISession, path: string) {
  const cache = castSession(session);
  const content = fs.readFileSync(path).toString();
  const sha256 = createHash('sha256').update(content).digest('hex');
  const ext = extname(path);
  switch (ext) {
    case '.md': {
      const mdast = parseMyst(content);
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
  }
  session.store.dispatch(watch.actions.markFileChanged({ path, changed: false }));
  console.log(path, cache.$mdast[path]);
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
  { projectPath, file }: { projectPath: string; file: string },
) {
  const toc = tic();
  const { log } = session;
  const cache = castSession(session);
  const mdastPre = cache.$mdast[file]?.pre;
  if (!mdastPre) throw new Error(`Expected mdast to be processed for ${file}`);
  // TODO: use structuredClone?
  log.debug(`Processiong "${file}"`);
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
  if (!cache.$citationRenderers[file]) {
    cache.$citationRenderers[file] = {};
  }
  transformLinkedDOIs(log, mdast, cache.$citationRenderers[file]);
  ensureBlockNesting(mdast);
  transformMath(log, mdast, frontmatter);
  transformOutputs(mdast);
  // Combine file-specific citation renderers with project renderers from bib files
  const fileCitationRenderer = combineRenderers(
    log,
    cache.$citationRenderers[projectPath],
    cache.$citationRenderers[file],
  );
  transformCitations(log, mdast, fileCitationRenderer, references);
  transformEnumerators(mdast, frontmatter);
  transformFootnotes(mdast, references);
  transformKeys(mdast);
  await transformImages(session, mdast, dirname(file));
  // TODO: Do we need to wait until here to delete authors if hide_authors is true?
  //       or is it ok if it happens above in `getPageFrontmatter`
  const sha256 = ''; // TODO: get this from the store
  const data: RendererData = { sha256, frontmatter, mdast, references };
  cache.$mdast[file].post = data;
  log.debug(toc(`Processed "${file}" in %s`));
  console.log(data);
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
