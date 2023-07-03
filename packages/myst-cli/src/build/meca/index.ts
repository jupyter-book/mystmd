import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { tic } from 'myst-cli-utils';
import { ExportFormats } from 'myst-frontmatter';
import type { LinkTransformer } from 'myst-transforms';
import { js2xml } from 'xml-js';
import { findCurrentProjectAndLoad } from '../../config.js';
import type { LocalProjectPage } from '../../project/index.js';
import { loadProjectFromDisk, writeTocFromProject } from '../../project/index.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import { KNOWN_IMAGE_EXTENSIONS, createTempFolder, isDirectory } from '../../utils/index.js';
import type { ExportWithOutput, ExportOptions } from '../types.js';
import {
  cleanOutput,
  collectBasicExportOptions,
  collectExportOptions,
  resolveAndLogErrors,
} from '../utils/index.js';
import { runJatsExport } from '../jats/single.js';
import AdmZip from 'adm-zip';

type ManifestItem = {
  href: string;
  itemType: string;
  mediaType: string;
};

function copyFileMaintainPath(session: ISession, file: string, from: string, to: string) {
  // File must be inside "from" folder
  if (!path.resolve(path.relative(from, file)).startsWith(path.resolve(from))) {
    session.log.error(`Cannot include files outside project root in meca bundle: ${file}`);
    return undefined;
  }
  const destination = path.resolve(to, path.relative(from, file));
  const destinationFolder = path.dirname(destination);
  try {
    if (!fs.existsSync(destinationFolder)) fs.mkdirSync(destinationFolder, { recursive: true });
    fs.copyFileSync(file, destination);
    session.log.debug(`File successfully copied: ${file}`);
    return destination;
  } catch {
    session.log.error(`Error copying file: ${file}`);
    return undefined;
  }
}

function copyFileToFolder(session: ISession, file: string, to: string) {
  const destination = path.join(to, path.basename(file));
  if (fs.existsSync(destination)) {
    session.log.error(`File already exists with name: ${path.basename(file)}`);
  }
  const destinationFolder = path.dirname(destination);
  try {
    if (!fs.existsSync(destinationFolder)) fs.mkdirSync(destinationFolder, { recursive: true });
    fs.copyFileSync(file, destination);
    session.log.debug(`File successfully copied: ${file}`);
    return destination;
  } catch {
    session.log.error(`Error copying file: ${file}`);
    return undefined;
  }
}

function mediaTypeFromFile(file: string) {
  // I'm sure there's an actual library to do this.
  const ext = path.extname(file);
  if (!ext) return 'application/octet-stream';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.md') return 'text/markdown';
  if (['.html', '.txt'].includes(ext)) return `text/${ext.substring(1)}`;
  if ((KNOWN_IMAGE_EXTENSIONS as string[]).includes(ext)) return `image/${ext.substring(1)}`;
  if (ext === '.tex') return 'application/x-latex';
  if (ext === 'ipynb') return 'application/x-ipynb+json';
  if (ext === '.bib') return 'application/x-bibtex';
  if (ext === '.yml') return 'text/x-yaml';
  if (ext === '.xml') return 'application/xml';
  return '';
}

function addManifestItem(
  manifestItems: ManifestItem[],
  itemType: string,
  mecaFolder: string,
  file?: string,
  mediaType?: string,
) {
  if (!file) return;
  const hrefPath = path.relative(mecaFolder, file).split(path.sep).join('/');
  const hrefTrail = isDirectory(file) ? '/' : '';
  manifestItems.push({
    href: `${hrefPath}${hrefTrail}`,
    itemType,
    mediaType: mediaType ? mediaType : mediaTypeFromFile(file),
  });
}

function bundleFolder(folder: string) {
  return path.join(folder, 'bundle');
}

async function copyFilesFromConfig(
  session: ISession,
  projectPath: string,
  mecaFolder: string,
  manifestItems: ManifestItem[],
) {
  const projConfig = selectors.selectLocalProjectConfig(session.store.getState(), projectPath);
  const entries: { itemType: string; entry: string }[] = [
    ...(projConfig.requirements ?? []).map((entry: string) => {
      return { itemType: 'article-source-environment', entry };
    }),
    ...(projConfig.resources ?? []).map((entry: string) => {
      return { itemType: 'article-source', entry };
    }),
  ];
  if (entries.length) {
    await Promise.all(
      entries.map(async ({ itemType, entry }) => {
        const resolvedEntry = [...projectPath.split(path.sep), entry].join('/');
        const matches = await glob(resolvedEntry);
        matches.forEach((match) => {
          const destination = copyFileMaintainPath(
            session,
            match,
            projectPath,
            bundleFolder(mecaFolder),
          );
          addManifestItem(manifestItems, itemType, mecaFolder, destination);
        });
      }),
    );
  }
}

function writeMecaManifest(manifestItems: ManifestItem[], mecaFolder: string) {
  const element = {
    type: 'element',
    elements: [
      {
        type: 'doctype',
        doctype: 'manifest PUBLIC "-//MECA//DTD Manifest v1.0//en" "MECA_manifest.dtd"',
      },
      {
        type: 'element',
        name: 'manifest',
        attributes: {
          'manifest-version': '1',
          xmlns: 'https://manuscriptexchange.org/schema/manifest',
          'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        },
        elements: manifestItems.map(({ href, itemType, mediaType }) => {
          return {
            type: 'element',
            name: 'item',
            attributes: { 'item-type': itemType },
            elements: [
              {
                type: 'element',
                name: 'instance',
                attributes: { 'xlink:href': href, 'media-type': mediaType },
              },
            ],
          };
        }),
      },
    ],
    declaration: { attributes: { version: '1.0', encoding: 'UTF-8' } },
  };
  const jats = js2xml(element, {
    compact: false,
    spaces: 2,
  });
  fs.writeFileSync(path.join(mecaFolder, 'manifest.xml'), jats);
}

/**
 * Meca export collects into a folder and zips: JATS (and dependent files), pdf/docx exports,
 * source markdown/ipynb/etc (and dependent files), table of contents, config yaml file,
 * and any resources/requirements defined in the config file. It also
 * writes an xml manifest file describing all the contents.
 */
export async function runMecaExport(
  session: ISession,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const toc = tic();
  const { output, article } = exportOptions;
  if (clean) cleanOutput(session, output);
  const mecaFolder = createTempFolder(session);
  const manifestItems: ManifestItem[] = [];
  const jatsExports = await collectExportOptions(
    session,
    article ? [article] : [],
    [ExportFormats.xml],
    {
      projectPath,
    },
  );
  if (jatsExports.length === 0 && article) {
    // If no JATS export is defined but MECA specifies an article, build JATS implicitly from that article
    const jatsOutput = path.join(mecaFolder, 'article.xml');
    await runJatsExport(
      session,
      { ...exportOptions, output: jatsOutput },
      projectPath,
      clean,
      extraLinkTransformers,
    );
    addManifestItem(manifestItems, 'article-metadata', mecaFolder, jatsOutput);
    const jatsFiles = path.join(mecaFolder, 'files');
    if (fs.existsSync(jatsFiles)) {
      fs.readdirSync(jatsFiles).forEach((file) => {
        addManifestItem(
          manifestItems,
          'article-supporting-file',
          mecaFolder,
          path.join(mecaFolder, 'files', file),
        );
      });
    }
  } else if (jatsExports.length === 0) {
    session.log.warn(`No JATS export found for inclusion with MECA bundle`);
  } else if (jatsExports.length > 1) {
    session.log.warn(
      `Multiple JATS exports found for inclusion with MECA bundle\nConventionally, MECA should only have one JATS article`,
    );
  }
  // Copy any existing JATS exports (and dependent files)
  jatsExports.forEach(({ output: jatsOutput }) => {
    if (!fs.existsSync(jatsOutput)) {
      session.log.warn(
        `Other exports must be built prior to building MECA bundle\nTo resolve this, run: myst build --all`,
      );
    }
    const jatsDestination = copyFileToFolder(session, jatsOutput, mecaFolder);
    if (jatsDestination) {
      addManifestItem(manifestItems, 'article-metadata', mecaFolder, jatsDestination);
    }
    const jatsFiles = path.join(path.dirname(jatsOutput), 'files');
    if (fs.existsSync(jatsFiles)) {
      fs.readdirSync(jatsFiles).forEach((file) => {
        const sourceFile = path.join(jatsFiles, file);
        const fileDestination = copyFileToFolder(
          session,
          sourceFile,
          path.join(mecaFolder, 'files'),
        );
        addManifestItem(manifestItems, 'article-supporting-file', mecaFolder, fileDestination);
      });
    }
  });
  // Copy any existing pdf/docx exports
  const manuscriptExports = await collectExportOptions(
    session,
    article ? [article] : [],
    [ExportFormats.docx, ExportFormats.pdf],
    {
      projectPath,
    },
  );
  manuscriptExports.forEach(({ output: manuscriptOutput }) => {
    if (!fs.existsSync(manuscriptOutput)) {
      session.log.warn(
        `Other exports must be built prior to building MECA bundle\nTo resolve this, run: myst build --all`,
      );
    }
    const destination = copyFileToFolder(session, manuscriptOutput, mecaFolder);
    addManifestItem(manifestItems, 'manuscript', mecaFolder, destination);
  });
  const project = projectPath
    ? selectors.selectLocalProject(session.store.getState(), projectPath)
    : undefined;
  const bundle = bundleFolder(mecaFolder);
  if (projectPath && project) {
    // Copy myst.yml
    copyFileMaintainPath(
      session,
      selectors.selectLocalConfigFile(session.store.getState(), projectPath),
      projectPath,
      bundle,
    );
    // Copy requirements and resources
    await copyFilesFromConfig(session, projectPath, mecaFolder, manifestItems);
    // Copy table of contents or write one if it does not exist
    if (fs.existsSync(path.join(projectPath, '_toc.yml'))) {
      copyFileToFolder(session, path.join(projectPath, '_toc.yml'), bundle);
    } else {
      writeTocFromProject(project, bundle);
    }
    addManifestItem(manifestItems, 'article-source', mecaFolder, path.join(bundle, '_toc.yml'));
    // Write all source markdown/ipynb/etc files
    const projectPages = [
      { page: project.file, itemType: 'article-source' },
      ...project.pages
        .filter((page): page is LocalProjectPage => {
          return !!(page as any).file;
        })
        .map((page) => {
          return { page: page.file, itemType: 'article-source' };
        }),
      ...project.bibliography.map((bib) => {
        return { page: bib, itemType: 'article-source' };
      }),
    ];
    projectPages.forEach(({ page, itemType }) => {
      const pageDest = copyFileMaintainPath(session, page, projectPath, bundle);
      addManifestItem(manifestItems, itemType, mecaFolder, pageDest);
    });
    // TODO: write supporting files images, etc....
  } else if (article) {
    const articleDest = copyFileToFolder(session, article, bundle);
    addManifestItem(manifestItems, 'article-source', mecaFolder, articleDest);
  }
  if (fs.existsSync(bundle)) {
    addManifestItem(
      manifestItems,
      'article-source-directory',
      mecaFolder,
      path.join(bundle, ''),
      'application/x-directory',
    );
  }
  writeMecaManifest(manifestItems, mecaFolder);
  const zip = new AdmZip();
  zip.addLocalFolder(mecaFolder);
  zip.writeZip(output);
  session.log.info(toc(`🤐 MECA output copied and zipped to ${output} in %s`));
}

export async function localProjectToMeca(
  session: ISession,
  file: string,
  opts: ExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
) {
  let { projectPath } = opts;
  if (!projectPath) projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await collectBasicExportOptions(session, file, 'zip', [ExportFormats.meca], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runMecaExport(session, exportOptions, projectPath, opts.clean, extraLinkTransformers);
    }),
    opts.throwOnFailure,
  );
}
