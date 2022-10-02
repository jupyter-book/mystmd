import fs from 'fs';
import path from 'path';
import type { TemplatePartDefinition, TemplateImports, TemplateYml } from 'jtex';
import JTex, { mergeTemplateImports } from 'jtex';
import type { Root } from 'mdast';
import { selectAll, unified } from 'mystjs';
import mystToTex from 'myst-to-tex';
import type { LatexResult } from 'myst-to-tex';
import type { ValidationOptions } from 'simple-validators';
import type { Export, PageFrontmatter } from 'myst-frontmatter';
import { validateExport, ExportFormats } from 'myst-frontmatter';
import { remove } from 'unist-util-remove';
import { copyNode } from 'myst-common';
import type { Block } from 'myst-spec';
import AdmZip from 'adm-zip';
import type { ISession } from '../../session/types';
import { bibFilesInDir, getRawFrontmatterFromFile } from '../../store/local/actions';
import { selectLocalProject } from '../../store/selectors';
import { createTempFolder, findProjectAndLoad, writeFileToFolder } from '../../utils';
import type { ExportWithOutput } from '../types';
import { cleanOutput } from '../utils/cleanOutput';
import { getDefaultExportFilename, getDefaultExportFolder } from '../utils/defaultNames';
import { getFileContent } from '../utils/getFileContent';
import { resolveAndLogErrors } from '../utils/resolveAndLogErrors';
import type { TexExportOptions } from './types';

export const DEFAULT_BIB_FILENAME = 'main.bib';

export function mdastToTex(
  mdast: Root,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml | null,
) {
  const pipe = unified().use(mystToTex, {
    math: frontmatter?.math,
    citestyle: templateYml?.style?.citation,
    bibliography: templateYml?.style?.bibliography,
  });
  const result = pipe.runSync(mdast as any);
  const tex = pipe.stringify(result);
  return tex.result as LatexResult;
}

/**
 * Extracts the node(s) based on part (string) or tags (string[]).
 */
function blockPartsFromMdast(mdast: Root, part: string) {
  const blockParts = selectAll('block', mdast).filter((block) => {
    if (!block.data?.tags && !block.data?.part) return false;
    if (block.data?.part === part) return true;
    try {
      return (block.data.tags as any).includes(part);
    } catch {
      return false;
    }
  });
  if (blockParts.length === 0) return undefined;
  return blockParts as Block[];
}

export function extractPart(
  mdast: Root,
  partDefinition: TemplatePartDefinition,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml,
): LatexResult | undefined {
  const blockParts = blockPartsFromMdast(mdast, partDefinition.id);
  if (!blockParts) return undefined;
  const taggedMdast = { type: 'root', children: copyNode(blockParts) } as unknown as Root;
  const partContent = mdastToTex(taggedMdast, frontmatter, templateYml);
  // Remove the blockparts from the main document
  blockParts.forEach((block) => {
    (block as any).type = '__delete__';
  });
  remove(mdast, '__delete__');
  return partContent;
}

export async function localArticleToTexRaw(
  session: ISession,
  file: string,
  output: string,
  projectPath?: string,
) {
  const { mdast, frontmatter } = await getFileContent(
    session,
    file,
    path.join(path.dirname(output), 'images'),
    projectPath,
    'images',
  );
  const result = mdastToTex(mdast, frontmatter, null);
  session.log.info(`🖋  Writing tex to ${output}`);
  // TODO: add imports and macros?
  writeFileToFolder(output, result.value);
}

function concatenateFiles(files: string[], output: string) {
  const fd = fs.openSync(output, 'w');
  files.forEach((file) => {
    fs.writeSync(fd, fs.readFileSync(file));
    fs.writeSync(fd, '\n');
  });
  fs.closeSync(fd);
}

export async function localArticleToTexTemplated(
  session: ISession,
  file: string,
  templateOptions: ExportWithOutput,
  projectPath?: string,
  force?: boolean,
) {
  const { frontmatter, mdast } = await getFileContent(
    session,
    file,
    path.join(path.dirname(templateOptions.output), 'images'),
    projectPath,
    'images',
  );
  let bibFiles: string[];
  if (projectPath) {
    const { bibliography } = selectLocalProject(session.store.getState(), projectPath) || {};
    bibFiles = bibliography || [];
  } else {
    bibFiles = (await bibFilesInDir(session, path.dirname(file), false)) || [];
  }
  concatenateFiles(bibFiles, path.join(path.dirname(templateOptions.output), DEFAULT_BIB_FILENAME));

  const jtex = new JTex(session, {
    template: templateOptions.template || undefined,
    rootDir: projectPath || path.dirname(file),
  });
  await jtex.ensureTemplateExistsOnPath();
  const templateYml = jtex.getValidatedTemplateYml();

  const partDefinitions = templateYml?.parts || [];
  const parts: Record<string, string> = {};
  let collectedImports: TemplateImports = { imports: [], commands: {} };
  partDefinitions.forEach((def) => {
    const result = extractPart(mdast, def, frontmatter, templateYml);
    if (result != null) {
      collectedImports = mergeTemplateImports(collectedImports, result);
      parts[def.id] = result?.value ?? '';
    }
  });

  // prune mdast based on tags, if required by template, eg abstract, acknowledgements
  // Need to load up template yaml - returned from jtex, with 'parts' dict
  // This probably means we need to store tags alongside oxa link for blocks
  // This will need opts eventually --v
  const result = mdastToTex(mdast, frontmatter, templateYml);
  // Fill in template
  session.log.info(`🖋  Writing templated tex to ${templateOptions.output}`);
  jtex.render({
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
  });
}

export async function collectTexExportOptions(
  session: ISession,
  file: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: TexExportOptions,
) {
  const { filename, disableTemplate, template, zip } = opts;
  if (disableTemplate && template) {
    throw new Error(
      'Conflicting tex export options: disableTemplate requested but a template was provided',
    );
  }
  const rawFrontmatter = await getRawFrontmatterFromFile(session, file);
  const exportErrorMessages: ValidationOptions['messages'] = {};
  let exportOptions: Export[] =
    rawFrontmatter?.exports
      ?.map((exp: any, ind: number) => {
        return validateExport(exp, {
          property: `exports.${ind}`,
          messages: exportErrorMessages,
        });
      })
      .filter((exp: Export | undefined) => exp && formats.includes(exp?.format)) || [];
  // If no export options are provided in frontmatter, instantiate default options
  if (exportOptions.length === 0 && formats.length) {
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
  if (exportOptions.length === 0) {
    throw new Error(
      `No valid export options of format ${formats.join(', ')} found${
        exportErrorMessages.errors?.length
          ? '\nPossible causes:\n- ' + exportErrorMessages.errors.map((e) => e.message).join('\n- ')
          : ''
      }`,
    );
  }
  resolvedExportOptions.forEach((exp) => {
    session.log.info(`📬 Performing export: ${exp.output}`);
  });
  return resolvedExportOptions;
}

export async function runTexExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
) {
  if (clean) cleanOutput(session, exportOptions.output);
  if (exportOptions.template === null) {
    await localArticleToTexRaw(session, file, exportOptions.output, projectPath);
  } else {
    await localArticleToTexTemplated(session, file, exportOptions, projectPath, clean);
  }
}

async function runTexZipExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
) {
  if (clean) cleanOutput(session, exportOptions.output);
  const zipOutput = exportOptions.output;
  const texFolder = createTempFolder();
  exportOptions.output = path.join(
    texFolder,
    `${path.basename(zipOutput, path.extname(zipOutput))}.tex`,
  );
  await runTexExport(session, file, exportOptions, projectPath);
  session.log.info(`🤐 Zipping tex outputs to ${zipOutput}`);
  const zip = new AdmZip();
  zip.addLocalFolder(texFolder);
  zip.writeZip(zipOutput);
}

export async function localArticleToTex(
  session: ISession,
  file: string,
  opts: TexExportOptions,
  templateOptions?: Record<string, any>,
) {
  const projectPath = await findProjectAndLoad(session, path.dirname(file));
  const exportOptionsList = (
    await collectTexExportOptions(session, file, 'tex', [ExportFormats.tex], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      if (path.extname(exportOptions.output) === '.zip') {
        await runTexZipExport(session, file, exportOptions, projectPath, opts.clean);
      } else {
        await runTexExport(session, file, exportOptions, projectPath, opts.clean);
      }
    }),
  );
}
