import fs from 'fs';
import yaml from 'js-yaml';
import { basename, extname, join } from 'path';
import chalk from 'chalk';
import { Inventory, Domains } from 'intersphinx';
import { writeFileToFolder, tic, hashAndCopyStaticFile } from 'myst-cli-utils';
import { toText } from 'myst-common';
import type { SiteProject } from 'myst-config';
import type { Export } from 'myst-frontmatter';
import { ExportFormats } from 'myst-frontmatter';
import type { Node } from 'myst-spec';
import type { LinkTransformer } from 'myst-transforms';
import { select } from 'unist-util-select';
import { getSiteManifest, collectExportOptions } from '../build';
import type { ExportWithOutput } from '../build';
import { reloadAllConfigsForCurrentSite } from '../config';
import { selectFile, loadFile } from '../process';
import type { LocalProject } from '../project';
import { filterPages, loadProjectFromDisk } from '../project';
import { castSession } from '../session';
import type { ISession } from '../session/types';
import { watch, selectors } from '../store';
import { ImageExtensions, transformWebp } from '../transforms';
import { combineProjectCitationRenderers } from './citations';
import { loadIntersphinx } from './intersphinx';
import type { PageReferenceStates, TransformFn } from './mdast';
import { postProcessMdast, transformMdast } from './mdast';

const WEB_IMAGE_EXTENSIONS = [
  ImageExtensions.webp,
  ImageExtensions.svg,
  ImageExtensions.gif,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
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
 * Returns the heading title or the caption as text
 */
function getReferenceTitleAsText(targetNode: Node): string | undefined {
  if (targetNode.type === 'heading') {
    return toText(targetNode);
  }
  const caption = select('caption > paragraph', targetNode);
  if (caption) return toText(caption);
}

export async function addProjectReferencesToObjectsInv(
  session: ISession,
  inv: Inventory,
  opts: { projectPath: string },
) {
  const { pages } = await loadProject(session, opts.projectPath);
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
  const pageReferenceStates: PageReferenceStates = pages
    .map((page) => ({
      state: cache.$internalReferences[page.file],
      file: page.file,
      url: selectors.selectFileInfo(session.store.getState(), page.file)?.url ?? null,
    }))
    .filter(({ state }) => !!state);
  return pageReferenceStates;
}

async function resolvePageSource(session: ISession, file: string) {
  const fileHash = hashAndCopyStaticFile(session, file, session.publicPath());
  return { format: extname(file).substring(1), filename: basename(file), url: `/${fileHash}` };
}

async function resolvePageExports(session: ISession, file: string, projectPath: string) {
  const exports = (
    await collectExportOptions(
      session,
      [file],
      [ExportFormats.docx, ExportFormats.pdf, ExportFormats.tex],
      { projectPath },
    )
  )
    .filter((exp) => {
      return ['.docx', '.pdf', '.zip'].includes(extname(exp.output));
    })
    .filter((exp) => {
      return fs.existsSync(exp.output);
    }) as Export[];
  exports.forEach((exp) => {
    const { output } = exp as ExportWithOutput;
    const fileHash = hashAndCopyStaticFile(session, output, session.publicPath());
    exp.filename = basename(output);
    exp.url = `/${fileHash}`;
    delete exp.$file;
    delete exp.$project;
    delete exp.output;
  });
  return exports;
}

export async function writeFile(
  session: ISession,
  {
    file,
    pageSlug,
    projectSlug,
    projectPath,
  }: { file: string; projectSlug: string; pageSlug: string; projectPath: string },
) {
  const toc = tic();
  const selectedFile = selectFile(session, file);
  if (!selectedFile) return;
  const { frontmatter, ...mdastPost } = selectedFile;
  const exports = await Promise.all([
    resolvePageSource(session, file),
    ...(await resolvePageExports(session, file, projectPath)),
  ]);
  const frontmatterWithExports = { ...frontmatter, exports };
  const jsonFilename = join(session.contentPath(), projectSlug, `${pageSlug}.json`);
  writeFileToFolder(
    jsonFilename,
    JSON.stringify({
      frontmatter: frontmatterWithExports,
      ...mdastPost,
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
    projectPath: string;
    projectSlug: string;
    pageSlug: string;
    extraLinkTransformers?: LinkTransformer[];
    extraTransforms?: TransformFn[];
    defaultTemplate?: string;
  },
) {
  const toc = tic();
  await loadFile(session, file);
  await transformMdast(session, {
    file,
    imageWriteFolder: session.staticPath(),
    imageAltOutputFolder: '/_static/',
    imageExtensions: WEB_IMAGE_EXTENSIONS,
    projectPath,
    projectSlug,
    pageSlug,
    watchMode: true,
    extraTransforms: [transformWebp, ...(extraTransforms ?? [])],
  });
  const { pages } = await loadProject(session, projectPath);
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  await postProcessMdast(session, {
    file,
    pageReferenceStates,
    extraLinkTransformers,
  });
  await writeFile(session, { file, pageSlug, projectSlug, projectPath });
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
      ...project.bibliography.map((path) => loadFile(session, path, '.bib')),
      // Load all content (.md and .ipynb)
      ...pages.map((page) => loadFile(session, page.file, undefined, { minifyMaxCharacters })),
      // Load up all the intersphinx references
      loadIntersphinx(session, { projectPath: siteProject.path }) as Promise<any>,
    ]);
  }
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, siteProject.path);

  const usedImageExtensions = imageExtensions ?? WEB_IMAGE_EXTENSIONS;
  const extraTransforms: TransformFn[] = [];
  if (usedImageExtensions.includes(ImageExtensions.webp)) {
    extraTransforms.push(transformWebp);
  }
  if (opts?.extraTransforms) {
    extraTransforms.push(...opts.extraTransforms);
  }
  // Transform all pages
  await Promise.all(
    pages.map((page) =>
      transformMdast(session, {
        file: page.file,
        imageWriteFolder: imageWriteFolder ?? session.staticPath(),
        imageAltOutputFolder,
        imageExtensions: imageExtensions ?? WEB_IMAGE_EXTENSIONS,
        projectPath: project.path,
        projectSlug: siteProject.slug,
        pageSlug: page.slug,
        watchMode,
        extraTransforms,
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
    if (siteProject.slug) {
      await Promise.all(
        pages.map((page) =>
          writeFile(session, {
            file: page.file,
            projectSlug: siteProject.slug as string,
            pageSlug: page.slug,
            projectPath: project.path,
          }),
        ),
      );
    } else {
      log.error(`Cannot write project files without project slug`);
    }
  }
  log.info(toc(`📚 Built ${pages.length} pages for ${siteProject.slug ?? 'project'} in %s.`));
  return project;
}

export async function processSite(session: ISession, opts?: ProcessOptions): Promise<boolean> {
  try {
    reloadAllConfigsForCurrentSite(session);
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    session.log.error(
      `Error finding or reading configuration files, do you need to run ${chalk.bold(
        'myst init',
      )}?`,
    );
    process.exit(1);
  }
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  session.log.debug(`Site Config:\n\n${yaml.dump(siteConfig)}`);
  if (!siteConfig?.projects?.length) return false;
  const projects = await Promise.all(
    siteConfig.projects.map((siteProject) =>
      processProject(session, siteProject, {
        ...opts,
        imageWriteFolder: session.staticPath(),
        imageAltOutputFolder: '/_static/',
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
      project: siteConfig.title,
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
