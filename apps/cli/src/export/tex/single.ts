import fs from 'fs';
import path from 'path';
import type { TemplatePartDefinition, ExpandedImports } from 'jtex';
import JTex, { mergeExpandedImports } from 'jtex';
import type { Root } from 'mdast';
import { selectAll, unified } from 'mystjs';
import mystToTex from 'myst-to-tex';
import type { LatexResult } from 'myst-to-tex';
import type { ValidationOptions } from 'simple-validators';
import type { VersionId } from '@curvenote/blocks';
import type { Export, PageFrontmatter } from 'myst-frontmatter';
import { validateExport, ExportFormats } from 'myst-frontmatter';
import { remove } from 'unist-util-remove';
import { copyNode } from 'myst-common';
import type { Block } from 'myst-spec';
import type { ISession } from '../../session/types';
import {
  bibFilesInDir,
  getRawFrontmatterFromFile,
  loadFile,
  selectFile,
  transformMdast,
} from '../../store/local/actions';
import { selectLocalProject, selectPageSlug } from '../../store/selectors';
import { createSlug } from '../../toc/utils';
import { findProjectAndLoad, writeFileToFolder } from '../../utils';
import { makeBuildPaths } from '../utils';
import { writeBibtex } from '../utils/writeBibtex';
import { gatherAndWriteArticleContent } from './gather';
import {
  ifTemplateFetchTaggedBlocks,
  ifTemplateLoadOptions,
  throwIfTemplateButNoJtex,
} from './template';
import type { ExportWithOutput, TexExportOptions } from './types';
import { ifTemplateRunJtex } from './utils';

export const DEFAULT_TEX_FILENAME = 'main.tex';

export async function singleArticleToTex(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
  if (!opts.filename) opts.filename = DEFAULT_TEX_FILENAME;
  throwIfTemplateButNoJtex(opts);
  const { tagged } = await ifTemplateFetchTaggedBlocks(session, opts);
  const templateOptions = ifTemplateLoadOptions(opts);

  const { buildPath } = makeBuildPaths(session.log, opts);

  session.log.debug('Starting articleToTex...');
  session.log.debug(`With Options: ${JSON.stringify(opts)}`);

  const { article, filename } = await gatherAndWriteArticleContent(
    session,
    versionId,
    opts,
    tagged,
    templateOptions,
    buildPath,
  );

  session.log.debug('Writing bib file...');
  await writeBibtex(session, article.references, 'main.bib', {
    path: buildPath,
    alwaysWriteFile: true,
  });

  await ifTemplateRunJtex(filename, session.log, opts);

  return article;
}

export function mdastToTex(mdast: Root, frontmatter: PageFrontmatter) {
  const pipe = unified().use(mystToTex, { math: frontmatter?.math });
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
): LatexResult | undefined {
  const blockParts = blockPartsFromMdast(mdast, partDefinition.id);
  if (!blockParts) return undefined;
  const taggedMdast = { type: 'root', children: copyNode(blockParts) } as unknown as Root;
  const partContent = mdastToTex(taggedMdast, frontmatter);
  // Remove the blockparts from the main document
  blockParts.forEach((block) => {
    (block as any).type = '__delete__';
  });
  remove(mdast, '__delete__');
  return partContent;
}

export async function getFileContent(
  session: ISession,
  file: string,
  output: string,
  projectPath?: string,
) {
  await loadFile(session, file);
  // Collect bib files - mysttotex will need those, not 'references'
  await transformMdast(session, {
    file,
    imageWriteFolder: path.join(path.dirname(output), 'images'),
    imageAltOutputFolder: 'images',
    projectPath,
  });
  return selectFile(session, file);
}

export async function localArticleToTexRaw(
  session: ISession,
  file: string,
  output: string,
  projectPath?: string,
) {
  const { mdast, frontmatter } = await getFileContent(session, file, output, projectPath);
  const result = mdastToTex(mdast, frontmatter);
  session.log.info(`🖋  Writing tex to ${output}`);
  // TODO: add imports and macros?
  writeFileToFolder(output, result.value);
}

function concatinateFiles(files: string[], output: string) {
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
  templatePath?: string,
  projectPath?: string,
  force?: boolean,
) {
  const { frontmatter, mdast, references } = await getFileContent(
    session,
    file,
    templateOptions.output,
    projectPath,
  );
  let bibFiles: string[];
  if (projectPath) {
    const { bibliography } = selectLocalProject(session.store.getState(), projectPath) || {};
    bibFiles = bibliography || [];
  } else {
    bibFiles = (await bibFilesInDir(session, path.dirname(file), false)) || [];
  }
  concatinateFiles(bibFiles, path.join(path.dirname(templateOptions.output), 'main.bib'));

  const jtex = new JTex(session, {
    template: templateOptions.template || undefined,
    path: templatePath,
  });
  await jtex.ensureTemplateExistsOnPath();
  const templateYml = jtex.getValidatedTemplateYml();

  const partDefinitions = templateYml?.parts || [];
  const parts: Record<string, string> = {};
  let collectedImports: ExpandedImports = { imports: [], commands: [] };
  partDefinitions.forEach((def) => {
    const result = extractPart(mdast, def, frontmatter);
    if (result != null) {
      collectedImports = mergeExpandedImports(collectedImports, result);
      parts[def.id] = result?.value ?? '';
    }
  });

  // prune mdast based on tags, if required by template, eg abstract, acknowledgements
  // Need to load up template yaml - returned from jtex, with 'parts' dict
  // This probably means we need to store tags alongside oxa link for blocks
  // This will need opts eventually --v
  const result = mdastToTex(mdast, frontmatter);
  // Fill in template
  session.log.info(`🖋  Writing templated tex to ${templateOptions.output}`);
  jtex.render({
    contentOrPath: result.value,
    outputPath: templateOptions.output,
    frontmatter,
    parts,
    options: templateOptions,
    sourceFile: file,
    imports: mergeExpandedImports(collectedImports, result),
    force,
  });
}

/**
 * Get default folder for saving export. Folder will be created on export.
 *
 * The default folder is:
 * <root>/_build/exports/
 *
 * If the file is part of a project, the root is the project folder;
 * if not, the root is the file folder.
 */
function getDefaultExportFolder(session: ISession, file: string, projectPath?: string) {
  const { dir } = path.parse(file);
  const buildSubpath = path.join('_build', 'exports');
  return path.join(projectPath || dir, buildSubpath);
}

/**
 * Get default filename for saving export.
 *
 * This uses the project slug if available, or creates a new slug from the filename otherwise.
 */
function getDefaultExportFilename(session: ISession, file: string, projectPath?: string) {
  const { name } = path.parse(file);
  const slugFromProject = projectPath
    ? selectPageSlug(session.store.getState(), projectPath, file)
    : undefined;
  const slug = slugFromProject || createSlug(name);
  return slug;
}

export async function collectExportOptions(
  session: ISession,
  file: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: TexExportOptions,
) {
  const { filename, disableTemplate, templatePath, template } = opts;
  if (disableTemplate && (opts.template || opts.templatePath)) {
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
  // If any arguments are provided on the CLI, only do a single export using the first available frontmatter tex options
  if (filename || template || templatePath || disableTemplate) {
    if (exportOptions.length) {
      exportOptions = [exportOptions[0]];
    } else if (formats.length) {
      exportOptions = [{ format: formats[0] }];
    } else {
      exportOptions = [];
    }
  }
  const resolvedExportOptions: ExportWithOutput[] = exportOptions
    .map((exp): ExportWithOutput | undefined => {
      let output: string;
      if (filename) {
        output = filename;
      } else if (exp.output) {
        // output path from file frontmatter needs resolution relative to working directory
        output = path.resolve(path.dirname(file), exp.output);
      } else {
        output = getDefaultExportFolder(session, file, projectPath);
      }
      if (!path.extname(output)) {
        const slug = getDefaultExportFilename(session, file, projectPath);
        output = path.join(output, `${slug}.${extension}`);
      }
      if (!output.endsWith(`.${extension}`)) {
        session.log.error(`The filename must end with '.${extension}': "${output}"`);
        return undefined;
      }
      const resolvedOptions: { output: string; template?: string | null } = { output };
      if (disableTemplate) {
        resolvedOptions.template = null;
      } else if (!template && exp.template) {
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
      `No export options of format ${formats.join(', ')} defined in frontmatter of ${file}${
        exportErrorMessages.errors?.length
          ? '\nPossible causes:\n- ' + exportErrorMessages.errors.map((e) => e.message).join('\n- ')
          : ''
      }`,
    );
  }
  resolvedExportOptions.forEach((exp) => {
    session.log.info(`🔍 Performing export: ${exp.output}`);
  });
  return resolvedExportOptions;
}

export function cleanOutput(session: ISession, output: string) {
  if (fs.existsSync(output)) {
    session.log.info(`🧹 Cleaning old output at ${output}`);
    fs.rmSync(output, { recursive: true });
  }
}

export async function runTexExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  templatePath?: string,
  projectPath?: string,
  clean?: boolean,
) {
  if (clean) cleanOutput(session, exportOptions.output);
  if (exportOptions.template === null) {
    await localArticleToTexRaw(session, file, exportOptions.output, projectPath);
  } else {
    await localArticleToTexTemplated(
      session,
      file,
      exportOptions,
      templatePath,
      projectPath,
      clean,
    );
  }
}

export async function resolveAndLogErrors(session: ISession, promises: Promise<any>[]) {
  const errors = await Promise.all(promises.map((p) => p.catch((e) => e)));
  errors
    .filter((e) => e instanceof Error)
    .forEach((e) => {
      session.log.error(e);
    });
}

export async function localArticleToTex(session: ISession, file: string, opts: TexExportOptions) {
  const projectPath = await findProjectAndLoad(session, path.dirname(file));
  const exportOptionsList = await collectExportOptions(
    session,
    file,
    'tex',
    [ExportFormats.tex],
    projectPath,
    opts,
  );
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runTexExport(session, file, exportOptions, opts.templatePath, projectPath, opts.clean);
    }),
  );
}
