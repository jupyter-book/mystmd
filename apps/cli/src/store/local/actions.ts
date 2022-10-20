import yaml from 'js-yaml';
import { join } from 'path';
import chalk from 'chalk';
import { Inventory, Domains } from 'intersphinx';
import type { LocalProject, LocalProjectPage, PageReferenceStates } from 'myst-cli';
import {
  castSession,
  combineProjectCitationRenderers,
  loadAllConfigsForCurrentSite,
  loadFile,
  loadIntersphinx,
  loadProjectFromDisk,
  postProcessMdast,
  selectors,
  transformMdast,
  watch,
  selectFile,
} from 'myst-cli';
import { writeFileToFolder, tic } from 'myst-cli-utils';
import { toText } from 'myst-common';
import type { SiteProject } from 'myst-config';
import type { Node } from 'myst-spec';
import { select } from 'unist-util-select';
import type { ISession } from '../../session/types';
import { copyActionResource, copyLogo, getSiteManifest } from '../../site/manifest';

type ProcessOptions = {
  watchMode?: boolean;
  writeToc?: boolean;
  writeFiles?: boolean;
  strict?: boolean;
  checkLinks?: boolean;
};

export function changeFile(session: ISession, path: string, eventType: string) {
  session.log.debug(`File modified: "${path}" (${eventType})`);
  const cache = castSession(session);
  session.store.dispatch(watch.actions.markFileChanged({ path }));
  delete cache.$mdast[path];
  delete cache.$citationRenderers[path];
}

// export async function transformMdast(...) {
//   ...
//   if (frontmatter.oxa) {
//     store.dispatch(
//       watch.actions.updateLinkInfo({
//         path: file,
//         oxa: frontmatter.oxa,
//         url: `/${projectSlug}/${pageSlug}`,
//       }),
//     );
//   }
// }

export async function writeSiteManifest(session: ISession) {
  const configPath = join(session.serverPath(), 'app', 'config.json');
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

export function writeFile(
  session: ISession,
  { file, pageSlug, projectSlug }: { file: string; projectSlug: string; pageSlug: string },
) {
  const toc = tic();
  const mdastPost = selectFile(session, file);
  const jsonFilename = join(
    session.serverPath(),
    'app',
    'content',
    projectSlug,
    `${pageSlug}.json`,
  );
  writeFileToFolder(jsonFilename, JSON.stringify(mdastPost));
  session.log.debug(toc(`Wrote "${file}" in %s`));
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
    imageWriteFolder: session.staticPath(),
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
      loadIntersphinx(session, { projectPath: siteProject.path }) as Promise<any>,
    ]);
  }
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, siteProject.path);
  // Transform all pages
  await Promise.all(
    pages.map((page) =>
      transformMdast(session, {
        file: page.file,
        imageWriteFolder: session.staticPath(),
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
  loadAllConfigsForCurrentSite(session);
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
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
    const filename = join(session.staticPath(), 'objects.inv');
    inv.write(filename);
  }
  return true;
}
