import path from 'path';
import type { Root } from 'mdast';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import type { References } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { ExportFormats } from 'myst-frontmatter';
import mystToJats from 'myst-to-jats';
import type { LatexResult } from 'myst-to-tex';
import type { LinkTransformer } from 'myst-transforms';
import { unified } from 'unified';
import { findCurrentProjectAndLoad } from '../../config';
import { getExportListFromRawFrontmatter, getRawFrontmatterFromFile } from '../../frontmatter';
import { loadProjectFromDisk } from '../../project';
import type { ISession } from '../../session/types';
import { KNOWN_IMAGE_EXTENSIONS, logMessagesFromVFile } from '../../utils';
import type { ExportWithOutput, ExportOptions } from '../types';
import {
  cleanOutput,
  getDefaultExportFilename,
  getDefaultExportFolder,
  getSingleFileContent,
  resolveAndLogErrors,
} from '../utils';

export function mdastToJats(
  session: ISession,
  mdast: Root,
  references: References,
  frontmatter: PageFrontmatter,
) {
  const pipe = unified().use(mystToJats, {
    frontmatter,
    // bibliograpy: citationRenderer - from references?
    fullArticle: true,
    spaces: 2,
  });
  const result = pipe.runSync(mdast as any);
  const jats = pipe.stringify(result);
  logMessagesFromVFile(session, jats);
  return jats.result as LatexResult;
}

export async function runJatsExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const { output } = exportOptions;
  if (clean) cleanOutput(session, output);
  const { mdast, frontmatter, references } = await getSingleFileContent(
    session,
    file,
    path.join(path.dirname(output), 'files'),
    {
      projectPath,
      imageAltOutputFolder: 'files/',
      imageExtensions: KNOWN_IMAGE_EXTENSIONS,
      extraLinkTransformers,
    },
  );
  const toc = tic();
  const result = mdastToJats(session, mdast, references, frontmatter);
  session.log.info(toc(`📑 Exported JATS in %s, copying to ${output}`));
  writeFileToFolder(output, result.value);
}

export async function collectJatsExportOptions(
  session: ISession,
  file: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  const { filename } = opts;
  const rawFrontmatter = await getRawFrontmatterFromFile(session, file);
  let exportOptions = getExportListFromRawFrontmatter(session, formats, rawFrontmatter, file);
  // If no export options are provided in frontmatter, instantiate default options
  if (exportOptions.length === 0 && formats.length && opts.force) {
    exportOptions = [{ format: formats[0] }];
  }
  // If any arguments are provided on the CLI, only do a single export using the first available frontmatter tex options
  if (filename) {
    exportOptions = exportOptions.slice(0, 1);
  }
  const resolvedExportOptions: ExportWithOutput[] = exportOptions
    .map((exp): ExportWithOutput | undefined => {
      let output: string;
      const basename = getDefaultExportFilename(session, file, projectPath);
      if (filename) {
        output = filename;
      } else if (exp.output) {
        // output path from file frontmatter needs resolution relative to working directory
        output = path.resolve(path.dirname(file), exp.output);
      } else {
        output = getDefaultExportFolder(session, file, projectPath);
      }
      if (!path.extname(output)) {
        output = path.join(output, `${basename}.${extension}`);
      }
      if (!output.endsWith(`.${extension}`)) {
        session.log.error(`The filename must end with '.${extension}': "${output}"`);
        return undefined;
      }
      return { ...exp, output };
    })
    .filter((exp): exp is ExportWithOutput => Boolean(exp))
    .map((exp, ind, arr) => {
      // Make identical export output values unique
      const nMatch = (a: ExportWithOutput[]) => a.filter((e) => e.output === exp.output).length;
      if (nMatch(arr) === 1) return { ...exp };
      const { dir, name, ext } = path.parse(exp.output);
      return {
        ...exp,
        output: path.join(dir, `${name}_${nMatch(arr.slice(0, ind))}${ext}`),
      };
    });
  return resolvedExportOptions;
}

export async function localArticleToJats(
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
    await collectJatsExportOptions(session, file, 'xml', [ExportFormats.xml], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runJatsExport(
        session,
        file,
        exportOptions,
        projectPath,
        opts.clean,
        extraLinkTransformers,
      );
    }),
    opts.throwOnFailure,
  );
}
