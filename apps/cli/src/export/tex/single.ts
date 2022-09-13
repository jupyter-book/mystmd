import { dirname } from 'path';
import type { TemplateTagDefinition, ExpandedImports } from 'jtex';
import JTex, { mergeExpandedImports } from 'jtex';
import type { Root } from 'mdast';
import type { GenericNode } from 'mystjs';
import { selectAll, unified } from 'mystjs';
import mystToTex from 'myst-to-tex';
import type { LatexResult } from 'myst-to-tex';
import type { VersionId } from '@curvenote/blocks';
import type { PageFrontmatter } from '@curvenote/frontmatter';
import { ExportFormats } from '@curvenote/frontmatter';
import type { ISession } from '../../session/types';
import { loadFile, selectFile, transformMdast } from '../../store/local/actions';
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

export function taggedBlocksFromMdast(mdast: Root, tag: string) {
  const taggedBlocks = selectAll('block', mdast).filter((block) => {
    let meta: Record<string, any>;
    try {
      meta = JSON.parse((block as GenericNode).meta);
      if (!meta.tags) return false;
      return (meta.tags as any).includes(tag);
    } catch {
      return false;
    }
  });
  if (taggedBlocks.length === 0) return undefined;
  return taggedBlocks as GenericNode[];
}

export function extractTaggedContent(
  mdast: Root,
  tagDefinition: TemplateTagDefinition,
  frontmatter: PageFrontmatter,
): LatexResult | undefined {
  const taggedBlocks = taggedBlocksFromMdast(mdast, tagDefinition.id);
  if (!taggedBlocks) return undefined;
  const taggedMdast = { type: 'root', children: taggedBlocks } as Root;
  const taggedContent = mdastToTex(taggedMdast, frontmatter);
  taggedBlocks.forEach((block) => {
    block.children = [];
  });
  return taggedContent;
}

export async function getFileContent(
  session: ISession,
  file: string,
  opts: Pick<TexExportOptions, 'filename'>,
) {
  const { filename } = opts;
  await loadFile(session, file);
  // Collect bib files - mysttotex will need those, not 'references'
  await transformMdast(session, {
    file,
    imageWriteFolder: dirname(filename),
    imageAltOutputFolder: '.',
  });
  return selectFile(session, file);
}

export async function localArticleToTexRaw(
  session: ISession,
  file: string,
  opts: Pick<TexExportOptions, 'filename'>,
) {
  const { filename } = opts;
  const { mdast, frontmatter } = await getFileContent(session, file, opts);
  const result = mdastToTex(mdast, frontmatter);
  session.log.info(`🖋  Writing tex to ${filename}`);
  // TODO: add imports and macros?
  writeFileToFolder(filename, result.value);
}

export async function localArticleToTexTemplated(
  session: ISession,
  file: string,
  opts: Omit<TexExportOptions, 'disableTemplate'>,
) {
  const { filename, template, templatePath } = opts;
  const { frontmatter, mdast, references } = await getFileContent(session, file, opts);
  const templateOptions = opts.templateOptions
    ? opts.templateOptions
    : frontmatter.export?.find((exp) => exp.format === ExportFormats.tex);
  const jtex = new JTex(session, { template, path: templatePath });
  await jtex.ensureTemplateExistsOnPath();
  const templateYml = jtex.getValidatedTemplateYml();

  const tagDefinitions = templateYml?.config?.tagged || [];
  const tagged: Record<string, string> = {};
  let collectedImports: ExpandedImports = { imports: [], commands: [] };
  tagDefinitions.forEach((def) => {
    const result = extractTaggedContent(mdast, def, frontmatter);
    if (result != null) {
      collectedImports = mergeExpandedImports(collectedImports, result);
      tagged[def.id] = result?.value ?? '';
    }
  });

  // prune mdast based on tags, if required by template, eg abstract, acknowledgements
  // Need to load up template yaml - returned from jtex, with 'tagged' dict
  // This probably means we need to store tags alongside oxa link for blocks
  // This will need opts eventually --v
  const result = mdastToTex(mdast, frontmatter);
  // Fill in template
  session.log.info(`🖋  Writing templated tex to ${filename}`);
  jtex.render({
    contentOrPath: result.value,
    outputPath: filename,
    frontmatter,
    tagged,
    options: templateOptions || {},
    sourceFile: file,
    imports: mergeExpandedImports(collectedImports, result),
  });
}

export async function localArticleToTex(session: ISession, file: string, opts: TexExportOptions) {
  const { filename, disableTemplate } = opts;
  assertEndsInExtension(filename, 'tex');
  if (disableTemplate && opts.template) {
    throw new Error(
      'Conflicting tex export options: disableTemplate requested but a template name was provided',
    );
  }
  if (disableTemplate) {
    await localArticleToTexRaw(session, file, opts);
  } else {
    await localArticleToTexTemplated(session, file, opts);
  }
}
