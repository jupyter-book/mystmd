import fs from 'fs';
import path from 'path';
import type { TemplatePartDefinition, ExpandedImports } from 'jtex';
import JTex, { mergeExpandedImports } from 'jtex';
import type { Root } from 'mdast';
import { selectAll, unified } from 'mystjs';
import mystToTex from 'myst-to-tex';
import type { LatexResult } from 'myst-to-tex';
import type { VersionId } from '@curvenote/blocks';
import type { Export, PageFrontmatter } from 'myst-frontmatter';
import { validateExport, ExportFormats } from 'myst-frontmatter';
import { remove } from 'unist-util-remove';
import { copyNode } from 'myst-common';
import type { Block } from 'myst-spec';
import type { ISession } from '../../session/types';
import {
  getRawFrontmatterFromFile,
  loadFile,
  selectFile,
  transformMdast,
} from '../../store/local/actions';
import { selectPageSlug } from '../../store/selectors';
import { createSlug } from '../../toc/utils';
import { findProject, writeFileToFolder } from '../../utils';
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

export async function localArticleToTexTemplated(
  session: ISession,
  file: string,
  templateOptions: ExportWithOutput,
  templatePath?: string,
  projectPath?: string,
) {
  const { frontmatter, mdast, references } = await getFileContent(
    session,
    file,
    templateOptions.output,
    projectPath,
  );
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
  });
}

/**
 * Get default folder for saving export. Folder will be created on export.
 *
 * The default folder is:
 * <root>/_build/curvenote/exports/<slug>/
 *
 * If the file is part of a project, the root is the project folder;
 * if not, the root is the file folder.
 */
function getDefaultExportFolder(session: ISession, file: string, projectPath?: string) {
  const { name, dir } = path.parse(file);
  const slugFromProject = projectPath
    ? selectPageSlug(session.store.getState(), projectPath, file)
    : undefined;
  const slug = slugFromProject || createSlug(name);
  const buildSubpath = path.join('_build', 'curvenote', 'exports', slug);
  return path.join(projectPath || dir, buildSubpath);
}

export async function collectExportOptions(
  session: ISession,
  file: string,
  extension: string,
  formats: ExportFormats[],
  defaultOutputFilename: string,
  projectPath: string | undefined,
  opts: TexExportOptions,
) {
  const { filename, disableTemplate, templatePath } = opts;
  let { template } = opts;
  if (disableTemplate && (opts.template || opts.templatePath)) {
    throw new Error(
      'Conflicting tex export options: disableTemplate requested but a template was provided',
    );
  }
  const rawFrontmatter = await getRawFrontmatterFromFile(session, file);
  let exportOptions: Export[] =
    rawFrontmatter?.exports
      ?.filter((exp: any) => formats.includes(exp?.format))
      .map((exp: any, ind: number) =>
        validateExport(exp, {
          property: `exports.${ind}`,
          messages: {},
          errorLogFn: (msg) => session.log.error(msg),
          warningLogFn: (msg) => session.log.warn(msg),
        }),
      )
      .filter((exp: Export | undefined) => exp) || [];
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
        output = path.join(output, defaultOutputFilename);
      }
      if (!output.endsWith(`.${extension}`)) {
        session.log.error(`The filename must end with '.${extension}': "${output}"`);
        return undefined;
      }
      if (disableTemplate) {
        template = null;
      } else if (!template && exp.template) {
        // template path from file frontmatter needs resolution relative to working directory
        const resolvedTemplatePath = path.resolve(path.dirname(file), exp.template);
        if (fs.existsSync(resolvedTemplatePath)) {
          template = resolvedTemplatePath;
        } else {
          template = exp.template;
        }
      }
      return { ...exp, output, template };
    })
    .filter((exp): exp is ExportWithOutput => Boolean(exp));
  if (exportOptions.length === 0) {
    throw new Error(
      `No export options of format ${formats.join(',')} defined in frontmatter of ${file}`,
    );
  }
  resolvedExportOptions.forEach((exp) => {
    session.log.info(`🔍 Performing export: ${exp.output}`);
  });
  return resolvedExportOptions;
}

export async function runTexExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  templatePath?: string,
  projectPath?: string,
) {
  if (exportOptions.template === null) {
    await localArticleToTexRaw(session, file, exportOptions.output, projectPath);
  } else {
    await localArticleToTexTemplated(session, file, exportOptions, templatePath, projectPath);
  }
}

export async function localArticleToTex(session: ISession, file: string, opts: TexExportOptions) {
  const projectPath = findProject(session, path.dirname(file));
  const exportOptionsList = await collectExportOptions(
    session,
    file,
    'tex',
    [ExportFormats.tex],
    DEFAULT_TEX_FILENAME,
    projectPath,
    opts,
  );
  // Just a normal loop so these output in serial in the CLI
  for (let index = 0; index < exportOptionsList.length; index++) {
    await runTexExport(session, file, exportOptionsList[index], opts.templatePath, projectPath);
  }
}
