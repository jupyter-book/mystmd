import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { glob } from 'glob';
import mime from 'mime-types';
import { copyFileMaintainPath, copyFileToFolder, isDirectory, tic } from 'myst-cli-utils';
import { RuleId, fileError, fileWarn } from 'myst-common';
import { ExportFormats } from 'myst-frontmatter';
import { selectAll } from 'unist-util-select';
import { VFile } from 'vfile';
import { createManifestXml, type ManifestItem } from 'meca';
import { runJatsExport } from '../jats/single.js';
import { loadFile } from '../../process/file.js';
import { writeTOCToConfigFile } from '../../project/toTOC.js';
import type { LocalProjectPage } from '../../project/types.js';
import type { ISession } from '../../session/types.js';
import { castSession } from '../../session/cache.js';
import { selectors } from '../../store/index.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import type { ExportWithOutput, ExportFnOptions } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { collectExportOptions } from '../utils/collectExportOptions.js';

function mediaTypeFromFile(file: string) {
  const mediaType = mime.lookup(file);
  if (mediaType) return mediaType;
  const ext = path.extname(file);
  // A couple common extras not included with 'mime-types'
  if (ext === '.ipynb') return 'application/x-ipynb+json';
  if (ext === '.bib') return 'application/x-bibtex';
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
  errorLogFn: (m: string) => void,
) {
  const projConfig = selectors.selectLocalProjectConfig(session.store.getState(), projectPath);
  const entries: { itemType: string; entry: string }[] = [
    ...(projConfig?.requirements ?? []).map((entry: string) => {
      return { itemType: 'article-source-environment', entry };
    }),
    ...(projConfig?.resources ?? []).map((entry: string) => {
      return { itemType: 'article-source', entry };
    }),
  ];
  if (entries.length) {
    await Promise.all(
      entries.map(async ({ itemType, entry }) => {
        const resolvedEntry = [...projectPath.split(path.sep), entry].join('/');
        const matches = await glob(resolvedEntry);
        matches
          .map((match) => match.split('/').join(path.sep))
          .filter((match) => !isDirectory(match))
          .forEach((match) => {
            const destination = copyFileMaintainPath(
              session,
              match,
              projectPath,
              bundleFolder(mecaFolder),
              errorLogFn,
            );
            addManifestItem(manifestItems, itemType, mecaFolder, destination);
          });
      }),
    );
  }
}

/**
 * Copy files referenced from image, link, and include nodes, as well as thumbnail
 */
async function copyDependentFiles(
  session: ISession,
  sourceFile: string,
  projectPath: string,
  mecaFolder: string,
  manifestItems: ManifestItem[],
  errorLogFn: (m: string) => void,
) {
  const cache = castSession(session);
  if (!cache.$getMdast(sourceFile)) {
    await loadFile(session, sourceFile, projectPath);
  }
  const pre = cache.$getMdast(sourceFile)?.pre;
  if (!pre) return;
  const { mdast, frontmatter } = pre;
  const urlNodes = selectAll('image,link', mdast);
  const fileNodes = selectAll('include', mdast);
  const filesToCopy = [
    ...urlNodes.map((node) => (node as any).url),
    ...fileNodes.map((node) => (node as any).file),
    frontmatter?.thumbnail,
  ]
    .filter((file) => !!file)
    .map((file) => path.resolve(path.dirname(sourceFile), file))
    .filter((file) => fs.existsSync(file));
  filesToCopy.forEach((file) => {
    const dependency = copyFileMaintainPath(
      session,
      file,
      projectPath,
      bundleFolder(mecaFolder),
      errorLogFn,
    );
    addManifestItem(manifestItems, 'article-source', mecaFolder, dependency);
  });
}

function writeMecaManifest(manifestItems: ManifestItem[], mecaFolder: string) {
  const manifest = createManifestXml(manifestItems);
  fs.writeFileSync(path.join(mecaFolder, 'manifest.xml'), manifest);
}

/**
 * Meca export collects into a folder and zips: JATS (and dependent files), pdf/docx exports,
 * source markdown/ipynb/etc (and dependent files), table of contents, config yaml file,
 * and any resources/requirements defined in the config file. It also
 * writes an xml manifest file describing all the contents.
 */
export async function runMecaExport(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
) {
  const toc = tic();
  const { output, articles } = exportOptions;
  const { projectPath, clean, extraLinkTransformers } = opts ?? {};
  // At this point, export options are resolved to contain zero or one articles
  const articleFile = articles?.[0]?.file;
  const vfile = new VFile();
  vfile.path = output;
  const fileCopyErrorLogFn = (m: string) => {
    fileError(vfile, m, { ruleId: RuleId.mecaFilesCopied });
  };
  if (clean) cleanOutput(session, output);
  const mecaFolder = createTempFolder(session);
  const manifestItems: ManifestItem[] = [];
  const jatsExports = await collectExportOptions(
    session,
    articleFile ? [articleFile] : [],
    [ExportFormats.xml],
    {
      projectPath,
    },
  );
  if (jatsExports.length === 0 && articleFile) {
    // If no JATS export is defined but MECA specifies an article, build JATS implicitly from that article
    const jatsOutput = path.join(mecaFolder, 'article.xml');
    await runJatsExport(
      session,
      sourceFile,
      { ...exportOptions, output: jatsOutput },
      { projectPath, clean, extraLinkTransformers },
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
    fileWarn(vfile, `No JATS export found for inclusion with MECA bundle`, {
      ruleId: RuleId.mecaIncludesJats,
    });
  } else if (jatsExports.length > 1) {
    fileWarn(
      vfile,
      `Multiple JATS exports found for inclusion with MECA bundle\nConventionally, MECA should only have one JATS article`,
      {
        ruleId: RuleId.mecaIncludesJats,
      },
    );
  }
  // Copy any existing JATS exports (and dependent files)
  jatsExports.forEach(({ output: jatsOutput }) => {
    if (!fs.existsSync(jatsOutput)) {
      fileWarn(
        vfile,
        `Other exports must be built prior to building MECA bundle\nTo resolve this, run: myst build --all`,
        {
          ruleId: RuleId.mecaExportsBuilt,
        },
      );
    }
    const jatsDest = copyFileToFolder(session, jatsOutput, mecaFolder, fileCopyErrorLogFn);
    if (jatsDest) {
      addManifestItem(manifestItems, 'article-metadata', mecaFolder, jatsDest);
    }
    const jatsFiles = path.join(path.dirname(jatsOutput), 'files');
    if (fs.existsSync(jatsFiles)) {
      fs.readdirSync(jatsFiles).forEach((file) => {
        const src = path.join(jatsFiles, file);
        const fileDest = copyFileToFolder(
          session,
          src,
          path.join(mecaFolder, 'files'),
          fileCopyErrorLogFn,
        );
        addManifestItem(manifestItems, 'article-supporting-file', mecaFolder, fileDest);
      });
    }
  });
  // Copy any existing pdf/docx/tex-zip exports
  const manuscriptExports = (
    await collectExportOptions(
      session,
      articleFile ? [articleFile] : [],
      [ExportFormats.docx, ExportFormats.pdf, ExportFormats.tex],
      {
        projectPath,
      },
    )
  ).filter((exp) => {
    // Do not copy unzipped tex exports
    return exp.format !== ExportFormats.tex || path.extname(exp.output) === '.zip';
  });
  manuscriptExports.forEach(({ output: manuscriptOutput }) => {
    if (!fs.existsSync(manuscriptOutput)) {
      fileWarn(
        vfile,
        `Other exports must be built prior to building MECA bundle\nTo resolve this, run: myst build --all`,
        {
          ruleId: RuleId.mecaExportsBuilt,
        },
      );
    }
    const manuscriptDest = copyFileToFolder(
      session,
      manuscriptOutput,
      mecaFolder,
      fileCopyErrorLogFn,
    );
    addManifestItem(manifestItems, 'manuscript', mecaFolder, manuscriptDest);
  });
  const project = projectPath
    ? selectors.selectLocalProject(session.store.getState(), projectPath)
    : undefined;
  const bundle = bundleFolder(mecaFolder);
  if (projectPath && project) {
    // Copy myst.yml
    const configFile = selectors.selectLocalConfigFile(session.store.getState(), projectPath);
    if (configFile) {
      const configDest = copyFileMaintainPath(
        session,
        configFile,
        projectPath,
        bundle,
        fileCopyErrorLogFn,
      );
      // Ensure that an explicit TOC is present
      if (configDest) {
        await writeTOCToConfigFile(project, configFile, configDest);
      }

      addManifestItem(manifestItems, 'article-source', mecaFolder, configDest);
      // Copy requirements and resources
      await copyFilesFromConfig(
        session,
        projectPath,
        mecaFolder,
        manifestItems,
        fileCopyErrorLogFn,
      );
    }
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
    await Promise.all(
      projectPages.map(async ({ page, itemType }) => {
        const pageDest = copyFileMaintainPath(
          session,
          page,
          projectPath,
          bundle,
          fileCopyErrorLogFn,
        );
        addManifestItem(manifestItems, itemType, mecaFolder, pageDest);
        await copyDependentFiles(
          session,
          page,
          projectPath,
          mecaFolder,
          manifestItems,
          fileCopyErrorLogFn,
        );
      }),
    );
  } else if (articleFile) {
    const articleDest = copyFileToFolder(session, articleFile, bundle, fileCopyErrorLogFn);
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
  logMessagesFromVFile(session, vfile);
  session.log.info(toc(`🤐 MECA output copied and zipped to ${output} in %s`));
  return { tempFolders: [] };
}
