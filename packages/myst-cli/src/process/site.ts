import yaml from 'js-yaml';
import { basename, extname, join } from 'node:path';
import chalk from 'chalk';
import { Inventory, Domains } from 'intersphinx';
import { writeFileToFolder, tic, hashAndCopyStaticFile } from 'myst-cli-utils';
import { RuleId, toText, plural } from 'myst-common';
import type { SiteProject } from 'myst-config';
import type { Node } from 'myst-spec';
import type { LinkTransformer, ReferenceState } from 'myst-transforms';
import { select } from 'unist-util-select';
import { reloadAllConfigsForCurrentSite } from '../config.js';
import { getSiteManifest, resolvePageExports } from '../build/site/manifest.js';
import { filterPages, loadProjectFromDisk } from '../project/load.js';
import type { LocalProject } from '../project/types.js';
import { castSession } from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { watch } from '../store/reducers.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { ImageExtensions } from '../utils/resolveExtension.js';
import { combineProjectCitationRenderers } from './citations.js';
import { loadFile, selectFile } from './file.js';
import { loadIntersphinx } from './intersphinx.js';
import type { TransformFn } from './mdast.js';
import { finalizeMdast, postProcessMdast, transformMdast } from './mdast.js';

const WEB_IMAGE_EXTENSIONS = [
  ImageExtensions.webp,
  ImageExtensions.svg,
  ImageExtensions.gif,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
  ImageExtensions.mp4,
];

type ProcessOptions = {
  watchMode?: boolean;
  writeToc?: boolean;
  writeFiles?: boolean;
  strict?: boolean;
  checkLinks?: boolean;
  imageWriteFolder?: string;
  imageAltOutputFolder?: string;
  imageExtensions?: ImageExtensions[];
  extraLinkTransformers?: LinkTransformer[];
  extraTransforms?: TransformFn[];
  defaultTemplate?: string;
  reloadProject?: boolean;
  minifyMaxCharacters?: number;
};

/**
 * Trigger a file-changed notification, and clear the file from the cache
 *
 * @param session session with logging
 * @param path path to the changed file
 * @param eventType event corresponding to the change
 */
export function changeFile(session: ISession, path: string, eventType: string) {
  session.log.debug(`File modified: "${path}" (${eventType})`);
  const cache = castSession(session);
  session.store.dispatch(watch.actions.markFileChanged({ path }));
  delete cache.$mdast[path];
  delete cache.$citationRenderers[path];
}

export async function writeSiteManifest(session: ISession, opts?: ProcessOptions) {
  const configPath = join(session.sitePath(), 'config.json');
  session.log.debug('Writing site config.json');
  const siteManifest = await getSiteManifest(session, opts);
  writeFileToFolder(configPath, JSON.stringify(siteManifest));
}

/**
 * Return the heading title or the caption as text
 *
 * @param targetNode reference target of interest
 */
function getReferenceTitleAsText(targetNode: Node): string | undefined {
  if (targetNode.type === 'heading') {
    return toText(targetNode);
  }
  const caption = select('caption > paragraph', targetNode);
  if (caption) return toText(caption);
}

/**
 * Update an object inventory with references from the current session
 *
 * @param session session with logging
 * @param inv intersphinx inventory to update
 * @param opts configuration options
 */
export async function addProjectReferencesToObjectsInv(
  session: ISession,
  inv: Inventory,
  opts: { projectPath: string },
) {
  const { pages } = await loadProject(session, opts.projectPath);
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  pageReferenceStates.forEach((state) => {
    inv.setEntry({
      type: Domains.stdDoc,
      name: (state.url as string).replace(/^\//, ''),
      location: state.url as string,
      display: state.title ?? '',
    });
    Object.entries(state.targets).forEach(([name, target]) => {
      if ((target.node as any).implicit) {
        // Don't include implicit references
        return;
      }
      inv.setEntry({
        type: Domains.stdLabel,
        name,
        location: `${state.url}#${(target.node as any).html_id ?? target.node.identifier}`,
        display: getReferenceTitleAsText(target.node),
      });
    });
  });
  return inv;
}

export async function loadProject(
  session: ISession,
  projectPath: string,
  opts?: { writeToc?: boolean; reloadProject?: boolean },
) {
  const project = await loadProjectFromDisk(session, projectPath, {
    warnOnNoConfig: true,
    ...opts,
  });
  // Load the citations first, or else they are loaded in each call below
  const pages = filterPages(project);
  return { project, pages };
}

export function selectPageReferenceStates(session: ISession, pages: { file: string }[]) {
  const cache = castSession(session);
  const pageReferenceStates: ReferenceState[] = pages
    .map((page) => {
      const state = cache.$internalReferences[page.file];
      if (state) {
        const selectedFile = selectors.selectFileInfo(session.store.getState(), page.file);
        if (selectedFile?.url) state.url = selectedFile.url;
        if (selectedFile?.title) state.title = selectedFile.title;
        if (selectedFile?.dataUrl) state.dataUrl = selectedFile.dataUrl;
        return state;
      }
      return undefined;
    })
    .filter((state): state is ReferenceState => !!state);
  return pageReferenceStates;
}

async function resolvePageSource(session: ISession, file: string) {
  const fileHash = hashAndCopyStaticFile(session, file, session.publicPath(), (m: string) => {
    addWarningForFile(session, file, m, 'error', {
      ruleId: RuleId.sourceFileCopied,
    });
  });
  return { format: extname(file).substring(1), filename: basename(file), url: `/${fileHash}` };
}

export async function writeFile(
  session: ISession,
  { file, pageSlug, projectSlug }: { file: string; pageSlug: string; projectSlug?: string },
) {
  const toc = tic();
  const selectedFile = selectFile(session, file);
  if (!selectedFile) return;
  const { frontmatter, mdast, kind, sha256, slug, references, dependencies, location } =
    selectedFile;
  const exports = await Promise.all([
    resolvePageSource(session, file),
    ...(await resolvePageExports(session, file)),
  ]);
  const frontmatterWithExports = { ...frontmatter, exports };
  const jsonFilenameParts = [session.contentPath()];
  if (projectSlug) jsonFilenameParts.push(projectSlug);
  jsonFilenameParts.push(`${pageSlug}.json`);
  writeFileToFolder(
    join(...jsonFilenameParts),
    JSON.stringify({
      kind,
      sha256,
      slug,
      location,
      dependencies,
      frontmatter: frontmatterWithExports,
      mdast,
      references,
    }),
  );
  session.log.debug(toc(`Wrote "${file}" in %s`));
}

export async function fastProcessFile(
  session: ISession,
  {
    file,
    pageSlug,
    projectPath,
    projectSlug,
    extraLinkTransformers,
    extraTransforms,
    defaultTemplate,
  }: {
    file: string;
    pageSlug: string;
    projectPath: string;
    projectSlug?: string;
    extraLinkTransformers?: LinkTransformer[];
    extraTransforms?: TransformFn[];
    defaultTemplate?: string;
  },
) {
  const toc = tic();
  await loadFile(session, file, projectPath);
  const { project, pages } = await loadProject(session, projectPath);
  await transformMdast(session, {
    file,
    imageExtensions: WEB_IMAGE_EXTENSIONS,
    projectPath,
    projectSlug,
    pageSlug,
    watchMode: true,
    extraTransforms,
    index: project.index,
  });
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  await postProcessMdast(session, {
    file,
    pageReferenceStates,
    extraLinkTransformers,
  });
  const { mdast, frontmatter } = castSession(session).$getMdast(file)?.post ?? {};
  if (mdast && frontmatter) {
    await finalizeMdast(session, mdast, frontmatter, file, {
      imageWriteFolder: session.publicPath(),
      imageAltOutputFolder: '/',
      imageExtensions: WEB_IMAGE_EXTENSIONS,
      optimizeWebp: true,
      processThumbnail: true,
    });
  }
  await writeFile(session, { file, pageSlug, projectSlug });
  session.log.info(toc(`📖 Built ${file} in %s.`));
  await writeSiteManifest(session, { defaultTemplate });
}

export async function processProject(
  session: ISession,
  siteProject: Partial<SiteProject>,
  opts?: ProcessOptions,
): Promise<LocalProject> {
  const toc = tic();
  const { log } = session;
  const {
    imageWriteFolder,
    imageAltOutputFolder,
    imageExtensions,
    extraLinkTransformers,
    watchMode,
    writeToc,
    writeFiles = true,
    reloadProject,
    minifyMaxCharacters,
  } = opts || {};
  if (!siteProject.path) {
    const slugSuffix = siteProject.slug ? `: ${siteProject.slug}` : '';
    log.error(`No local path for site project${slugSuffix}`);
    if (siteProject.remote) log.error(`Remote path not supported${slugSuffix}`);
    throw Error('Unable to process project');
  }
  const { project, pages } = await loadProject(session, siteProject.path, {
    writeToc: writeFiles && writeToc,
    reloadProject,
  });
  if (!watchMode) {
    await Promise.all([
      // Load all citations (.bib)
      ...project.bibliography.map((path) => loadFile(session, path, siteProject.path, '.bib')),
      // Load all content (.md and .ipynb)
      ...pages.map((page) =>
        loadFile(session, page.file, siteProject.path, undefined),
      ),
      // Load up all the intersphinx references
      loadIntersphinx(session, { projectPath: siteProject.path }) as Promise<any>,
    ]);
  }
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, siteProject.path);

  const usedImageExtensions = imageExtensions ?? WEB_IMAGE_EXTENSIONS;
  // Transform all pages
  await Promise.all(
    pages.map((page) =>
      transformMdast(session, {
        file: page.file,
        imageExtensions: usedImageExtensions,
        projectPath: project.path,
        projectSlug: siteProject.slug,
        pageSlug: page.slug,
        watchMode,
        extraTransforms: opts?.extraTransforms,
        index: project.index,
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
        extraLinkTransformers,
      }),
    ),
  );
  // Write all pages
  if (writeFiles) {
    await Promise.all(
      pages.map(async (page) => {
        const { mdast, frontmatter } = castSession(session).$getMdast(page.file)?.post ?? {};
        if (mdast && frontmatter) {
          await finalizeMdast(session, mdast, frontmatter, page.file, {
            imageWriteFolder: imageWriteFolder ?? session.publicPath(),
            imageAltOutputFolder,
            imageExtensions: usedImageExtensions,
            optimizeWebp: true,
            processThumbnail: true,
          });
        }
        return writeFile(session, {
          file: page.file,
          projectSlug: siteProject.slug as string,
          pageSlug: page.slug,
        });
      }),
    );
  }
  log.info(
    toc(`📚 Built ${plural('%s page(s)', pages)} for ${siteProject.slug ?? 'project'} in %s.`),
  );
  return project;
}

export async function processSite(session: ISession, opts?: ProcessOptions): Promise<boolean> {
  try {
    reloadAllConfigsForCurrentSite(session);
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    const prefix = (error as Error)?.message
      ? (error as Error).message
      : 'Error finding or reading configuration files.';
    session.log.error(`${prefix}\nDo you need to run ${chalk.bold('myst init')}?`);
    process.exit(1);
  }
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);
  if (!siteConfig?.projects?.length) return false;
  const projects = await Promise.all(
    siteConfig.projects.map((siteProject) =>
      processProject(session, siteProject, {
        ...opts,
        imageWriteFolder: session.publicPath(),
        imageAltOutputFolder: '/',
      }),
    ),
  );
  if (opts?.strict) {
    const hasWarnings = projects
      .map((project) => {
        return project.pages
          .map((page) => {
            if (!('slug' in page)) return [0, 0];
            const buildWarnings = selectors.selectFileWarnings(session.store.getState(), page.file);
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
    await writeSiteManifest(session, opts);
    // Write the objects.inv
    const inv = new Inventory({
      project: siteConfig?.title,
      // TODO: allow a version on the project?!
      version: String((siteConfig as any)?.version ?? '1'),
    });
    await Promise.all(
      siteConfig.projects.map(async (project) => {
        if (!project.path) return;
        await addProjectReferencesToObjectsInv(session, inv, {
          projectPath: project.path,
        });
      }),
    );
    const filename = join(session.sitePath(), 'objects.inv');
    inv.write(filename);
  }
  return true;
}
