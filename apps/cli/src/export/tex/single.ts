import fs from 'fs';
import path from 'path';
import type { TemplatePartDefinition, ExpandedImports } from 'jtex';
import JTex, { mergeExpandedImports } from 'jtex';
import type { Root } from 'mdast';
import { selectAll, unified } from 'mystjs';
import mystToTex from 'myst-to-tex';
import type { LatexResult } from 'myst-to-tex';
import type { VersionId } from '@curvenote/blocks';
import type { Export, PageFrontmatter } from '@curvenote/frontmatter';
import { ExportFormats } from '@curvenote/frontmatter';
import { remove } from 'unist-util-remove';
import { copyNode } from 'myst-utils';
import type { Block } from 'myst-spec';
import type { ISession } from '../../session/types';
import {
  getRawFrontmatterFromFile,
  loadFile,
  selectFile,
  transformMdast,
} from '../../store/local/actions';
import { writeFileToFolder } from '../../utils';
import { assertEndsInExtension, makeBuildPaths } from '../utils';
import { writeBibtex } from '../utils/writeBibtex';
import { gatherAndWriteArticleContent } from './gather';
import {
  ifTemplateFetchTaggedBlocks,
  ifTemplateLoadOptions,
  throwIfTemplateButNoJtex,
} from './template';
import type { TexExportOptions } from './types';
import { ifTemplateRunJtex } from './utils';

export async function singleArticleToTex(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
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

export async function getFileContent(session: ISession, file: string, filename: string) {
  await loadFile(session, file);
  // Collect bib files - mysttotex will need those, not 'references'
  await transformMdast(session, {
    file,
    imageWriteFolder: path.join(path.dirname(filename), 'images'),
    imageAltOutputFolder: 'images',
  });
  return selectFile(session, file);
}

export async function localArticleToTexRaw(session: ISession, file: string, filename: string) {
  const { mdast, frontmatter } = await getFileContent(session, file, filename);
  const result = mdastToTex(mdast, frontmatter);
  session.log.info(`🖋  Writing tex to ${filename}`);
  // TODO: add imports and macros?
  writeFileToFolder(filename, result.value);
}

export async function localArticleToTexTemplated(
  session: ISession,
  file: string,
  filename: string,
  templateOptions: Export,
  templatePath?: string,
) {
  const { frontmatter, mdast, references } = await getFileContent(session, file, filename);
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
  session.log.info(`🖋  Writing templated tex to ${filename}`);
  jtex.render({
    contentOrPath: result.value,
    outputPath: filename,
    frontmatter,
    parts,
    options: templateOptions,
    sourceFile: file,
    imports: mergeExpandedImports(collectedImports, result),
  });
}

export async function localArticleToTex(session: ISession, file: string, opts: TexExportOptions) {
  const rawFrontmatter = await getRawFrontmatterFromFile(session, file);
  const { filename, disableTemplate, template, templatePath } = opts;
  if (disableTemplate && (opts.template || opts.templatePath)) {
    throw new Error(
      'Conflicting tex export options: disableTemplate requested but a template was provided',
    );
  }
  let texExports: Export[] =
    rawFrontmatter?.exports?.filter((exp: Export) => exp.format === ExportFormats.tex) || [];
  // If any arguments are provided on the CLI, only do a single export using the first available frontmatter tex options
  if (filename || template || templatePath || disableTemplate != null) {
    const firstTexExport = texExports.length ? texExports[0] : { format: ExportFormats.tex };
    texExports = [firstTexExport];
  }
  if (texExports.length === 0) {
    throw new Error(`No tex export options defined in frontmatter of ${file}`);
  }
  for (let index = 0; index < texExports.length; index++) {
    const templateOptions = texExports[index];
    let output: string;
    if (filename) {
      output = filename;
    } else if (templateOptions.output) {
      // output path from file frontmatter needs resolution relative to working directory
      output = path.resolve(path.dirname(file), templateOptions.output);
    } else {
      output = 'main.tex';
    }
    if (!path.extname(output)) {
      output = path.join(output, 'main.tex');
    }
    assertEndsInExtension(output, 'tex');
    if (template) {
      templateOptions.template = template;
    } else if (templateOptions.template) {
      // template path from file frontmatter needs resolution relative to working directory
      const resolvedTemplatePath = path.resolve(path.dirname(file), templateOptions.template);
      if (fs.existsSync(resolvedTemplatePath)) {
        templateOptions.template = resolvedTemplatePath;
      }
    }
    if (disableTemplate) templateOptions.template = null;
    if (templateOptions.template === null) {
      await localArticleToTexRaw(session, file, output);
    } else {
      await localArticleToTexTemplated(session, file, output, templateOptions, opts.templatePath);
    }
  }
}
