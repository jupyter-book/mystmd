import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import type { TemplateImports } from 'jtex';
import { renderTex, mergeTemplateImports } from 'jtex';
import type { Root } from 'mdast';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import type { References } from 'myst-common';
import { extractPart, TemplateKind } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { ExportFormats } from 'myst-frontmatter';
import type { TemplatePartDefinition, TemplateYml } from 'myst-templates';
import MystTemplate from 'myst-templates';
import mystToTex from 'myst-to-tex';
import type { LatexResult } from 'myst-to-tex';
import type { LinkTransformer } from 'myst-transforms';
import { unified } from 'unified';
import { findCurrentProjectAndLoad } from '../../config';
import { getExportListFromRawFrontmatter, getRawFrontmatterFromFile } from '../../frontmatter';
import { loadProjectFromDisk } from '../../project';
import { castSession } from '../../session';
import type { ISession } from '../../session/types';
import { createTempFolder, logMessagesFromVFile } from '../../utils';
import type { ExportWithOutput, ExportOptions } from '../types';
import {
  cleanOutput,
  getDefaultExportFilename,
  getDefaultExportFolder,
  getSingleFileContent,
  resolveAndLogErrors,
} from '../utils';

export const DEFAULT_BIB_FILENAME = 'main.bib';
const TEX_IMAGE_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export function mdastToTex(
  session: ISession,
  mdast: Root,
  references: References,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml | null,
) {
  const pipe = unified().use(mystToTex, {
    math: frontmatter?.math,
    citestyle: templateYml?.style?.citation,
    bibliography: templateYml?.style?.bibliography,
    references,
  });
  const result = pipe.runSync(mdast as any);
  const tex = pipe.stringify(result);
  logMessagesFromVFile(session, tex);
  return tex.result as LatexResult;
}

export function extractTexPart(
  session: ISession,
  mdast: Root,
  references: References,
  partDefinition: TemplatePartDefinition,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml,
): LatexResult | undefined {
  const part = extractPart(mdast, partDefinition.id);
  if (!part) return undefined;
  const partContent = mdastToTex(session, part, references, frontmatter, templateYml);
  return partContent;
}

export async function localArticleToTexRaw(
  session: ISession,
  file: string,
  output: string,
  projectPath?: string,
  extraLinkTransformers?: LinkTransformer[],
) {
  const { mdast, frontmatter, references } = await getSingleFileContent(
    session,
    file,
    path.join(path.dirname(output), 'files'),
    {
      projectPath,
      imageAltOutputFolder: 'files/',
      imageExtensions: TEX_IMAGE_EXTENSIONS,
      extraLinkTransformers,
    },
  );
  const toc = tic();
  const result = mdastToTex(session, mdast, references, frontmatter, null);
  session.log.info(toc(`📑 Exported TeX in %s, copying to ${output}`));
  // TODO: add imports and macros?
  writeFileToFolder(output, result.value);
}

function writeBibtexFromCitationRenderers(session: ISession, output: string) {
  const cache = castSession(session);
  const allBibtexContent = Object.values(cache.$citationRenderers)
    .map((renderers) => {
      return Object.values(renderers).map((renderer) => {
        const bibtexContent = (renderer.cite._graph as any[]).find((item) => {
          return item.type === '@biblatex/text';
        });
        return bibtexContent?.data;
      });
    })
    .flat()
    .filter((item) => !!item);
  const bibtexContent = [...new Set(allBibtexContent)].join('\n');
  if (!fs.existsSync(output)) fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, bibtexContent);
}

export async function localArticleToTexTemplated(
  session: ISession,
  file: string,
  templateOptions: ExportWithOutput,
  projectPath?: string,
  force?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const filesPath = path.join(path.dirname(templateOptions.output), 'files');
  const { frontmatter, mdast, references } = await getSingleFileContent(session, file, filesPath, {
    projectPath,
    imageAltOutputFolder: 'files/',
    imageExtensions: TEX_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });
  writeBibtexFromCitationRenderers(
    session,
    path.join(path.dirname(templateOptions.output), DEFAULT_BIB_FILENAME),
  );

  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.tex,
    template: templateOptions.template || undefined,
    buildDir: session.buildPath(),
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const toc = tic();
  const templateYml = mystTemplate.getValidatedTemplateYml();

  const partDefinitions = templateYml?.parts || [];
  const parts: Record<string, string> = {};
  let collectedImports: TemplateImports = { imports: [], commands: {} };
  partDefinitions.forEach((def) => {
    const result = extractTexPart(session, mdast, references, def, frontmatter, templateYml);
    if (result != null) {
      collectedImports = mergeTemplateImports(collectedImports, result);
      parts[def.id] = result?.value ?? '';
    }
  });

  // prune mdast based on tags, if required by template, eg abstract, acknowledgements
  // Need to load up template yaml - returned from jtex, with 'parts' dict
  // This probably means we need to store tags alongside oxa link for blocks
  // This will need opts eventually --v
  const result = mdastToTex(session, mdast, references, frontmatter, templateYml);
  // Fill in template
  session.log.info(toc(`📑 Exported TeX in %s, copying to ${templateOptions.output}`));
  renderTex(mystTemplate, {
    contentOrPath: result.value,
    outputPath: templateOptions.output,
    frontmatter,
    parts,
    options: templateOptions,
    bibliography: [DEFAULT_BIB_FILENAME],
    sourceFile: file,
    imports: mergeTemplateImports(collectedImports, result),
    force,
    packages: templateYml.packages,
    filesPath,
  });
}

export async function collectTexExportOptions(
  session: ISession,
  file: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  const { filename, disableTemplate, template, zip } = opts;
  if (disableTemplate && template) {
    throw new Error(
      'Conflicting tex export options: disableTemplate requested but a template was provided',
    );
  }
  const rawFrontmatter = await getRawFrontmatterFromFile(session, file);
  let exportOptions = getExportListFromRawFrontmatter(session, formats, rawFrontmatter, file);
  // If no export options are provided in frontmatter, instantiate default options
  if (exportOptions.length === 0 && formats.length && opts.force) {
    exportOptions = [{ format: formats[0] }];
  }
  // If any arguments are provided on the CLI, only do a single export using the first available frontmatter tex options
  if (filename || template || disableTemplate) {
    exportOptions = exportOptions.slice(0, 1);
  }
  const resolvedExportOptions: ExportWithOutput[] = exportOptions
    .map((exp): ExportWithOutput | undefined => {
      const rawOutput = filename || exp.output || '';
      const useZip = extension === 'tex' && (zip || path.extname(rawOutput) === '.zip');
      const expExtension = useZip ? 'zip' : extension;
      let output: string;
      const basename = getDefaultExportFilename(session, file, projectPath);
      if (filename) {
        output = filename;
      } else if (exp.output) {
        // output path from file frontmatter needs resolution relative to working directory
        output = path.resolve(path.dirname(file), exp.output);
      } else {
        output = getDefaultExportFolder(
          session,
          file,
          projectPath,
          formats.includes(ExportFormats.tex) ? 'tex' : undefined,
        );
      }
      if (!path.extname(output)) {
        output = path.join(output, `${basename}.${expExtension}`);
      }
      if (!output.endsWith(`.${expExtension}`)) {
        session.log.error(`The filename must end with '.${expExtension}': "${output}"`);
        return undefined;
      }
      const resolvedOptions: { output: string; template?: string | null } = { output };
      if (disableTemplate) {
        resolvedOptions.template = null;
      } else if (template) {
        resolvedOptions.template = template;
      } else if (exp.template) {
        // template path from file frontmatter needs resolution relative to working directory
        const resolvedTemplatePath = path.resolve(path.dirname(file), exp.template);
        if (fs.existsSync(resolvedTemplatePath)) {
          resolvedOptions.template = resolvedTemplatePath;
        } else {
          resolvedOptions.template = exp.template;
        }
      }
      return { ...exp, ...resolvedOptions };
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

export async function runTexExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  if (clean) cleanOutput(session, exportOptions.output);
  if (exportOptions.template === null) {
    await localArticleToTexRaw(
      session,
      file,
      exportOptions.output,
      projectPath,
      extraLinkTransformers,
    );
  } else {
    await localArticleToTexTemplated(
      session,
      file,
      exportOptions,
      projectPath,
      clean,
      extraLinkTransformers,
    );
  }
}

export async function runTexZipExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  if (clean) cleanOutput(session, exportOptions.output);
  const zipOutput = exportOptions.output;
  const texFolder = createTempFolder(session);
  exportOptions.output = path.join(
    texFolder,
    `${path.basename(zipOutput, path.extname(zipOutput))}.tex`,
  );
  await runTexExport(session, file, exportOptions, projectPath, false, extraLinkTransformers);
  session.log.info(`🤐 Zipping tex outputs to ${zipOutput}`);
  const zip = new AdmZip();
  zip.addLocalFolder(texFolder);
  zip.writeZip(zipOutput);
}

export async function localArticleToTex(
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
    await collectTexExportOptions(session, file, 'tex', [ExportFormats.tex], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      if (path.extname(exportOptions.output) === '.zip') {
        await runTexZipExport(
          session,
          file,
          exportOptions,
          projectPath,
          opts.clean,
          extraLinkTransformers,
        );
      } else {
        await runTexExport(
          session,
          file,
          exportOptions,
          projectPath,
          opts.clean,
          extraLinkTransformers,
        );
      }
    }),
    opts.throwOnFailure,
  );
}
