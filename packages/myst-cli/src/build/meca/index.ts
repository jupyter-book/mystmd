import fs from 'node:fs';
import path from 'node:path';
import { hashAndCopyStaticFile, tic } from 'myst-cli-utils';
import { ExportFormats } from 'myst-frontmatter';
import type { LinkTransformer } from 'myst-transforms';
import { js2xml } from 'xml-js';
import { findCurrentProjectAndLoad } from '../../config.js';
import { loadProjectFromDisk } from '../../project/index.js';
import type { ISession } from '../../session/types.js';
import { createTempFolder, isDirectory } from '../../utils/index.js';
import type { ExportWithOutput, ExportOptions } from '../types.js';
import { cleanOutput, collectBasicExportOptions, resolveAndLogErrors } from '../utils/index.js';
import { runJatsExport } from '../jats/single.js';
import AdmZip from 'adm-zip';
import { selectors } from '../../store/index.js';

function copyFilesFromConfig(
  session: ISession,
  projectPath: string,
  folder: string,
  category: 'resources' | 'requirements',
) {
  const projConfig = selectors.selectLocalProjectConfig(session.store.getState(), projectPath);
  const entries = projConfig[category];
  if (entries) {
    const categoryFolder = path.join(folder, category);
    const filesToCopy: string[] = [];
    entries.forEach((entry: string) => {
      let entryParts = entry.split('/');
      if (entryParts[entryParts.length] === '*') {
        entryParts = entryParts.slice(0, entryParts.length - 1);
      }
      const resolvedEntry = path.join(projectPath, ...entryParts);
      if (isDirectory(resolvedEntry)) {
        fs.readdirSync(resolvedEntry).forEach((file) => {
          const resolvedSubEntry = path.join(resolvedEntry, file);
          if (!isDirectory(resolvedSubEntry)) filesToCopy.push(resolvedSubEntry);
        });
      } else if (fs.existsSync(resolvedEntry)) {
        filesToCopy.push(resolvedEntry);
      }
    });
    if (filesToCopy.length) {
      fs.mkdirSync(categoryFolder);
      filesToCopy.forEach((file: string) => {
        hashAndCopyStaticFile(session, file, categoryFolder);
      });
    }
  }
}

function writeMecaManifest(mecaFolder: string) {
  const folders = ['files', 'requirements', 'resources'];
  const files: string[] = [];
  folders.forEach((folder) => {
    const fullFolder = path.join(mecaFolder, folder);
    if (fs.existsSync(fullFolder)) {
      files.push(...fs.readdirSync(fullFolder).map((file) => `${folder}/${file}`));
    }
  });
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
          version: '1',
          xmlns: 'https://manuscriptexchange.org/schema/manifest',
          'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        },
        elements: ['article.xml', ...files].map((file) => {
          return {
            type: 'element',
            name: 'item',
            elements: [{ type: 'element', name: 'instance', attributes: { href: file } }],
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

export async function runMecaExport(
  session: ISession,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const toc = tic();
  const { output } = exportOptions;
  if (clean) cleanOutput(session, output);
  const mecaFolder = createTempFolder(session);
  const jatsOutput = path.join(mecaFolder, 'article.xml');
  await runJatsExport(
    session,
    { ...exportOptions, output: jatsOutput },
    projectPath,
    clean,
    extraLinkTransformers,
  );
  if (projectPath) {
    copyFilesFromConfig(session, projectPath, mecaFolder, 'requirements');
    copyFilesFromConfig(session, projectPath, mecaFolder, 'resources');
  }
  writeMecaManifest(mecaFolder);
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
