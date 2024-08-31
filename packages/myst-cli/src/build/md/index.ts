import path from 'node:path';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import type { GenericParent } from 'myst-common';
import { extractPart, RuleId, TemplateKind } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import {
  FRONTMATTER_ALIASES,
  PAGE_FRONTMATTER_KEYS,
  PROJECT_FRONTMATTER_KEYS,
  validateProjectFrontmatter,
} from 'myst-frontmatter';
import type { TemplatePartDefinition } from 'myst-templates';
import MystTemplate from 'myst-templates';
import { writeMd } from 'myst-to-md';
import { selectAll } from 'unist-util-select';
import { renderTemplate } from 'jtex';
import { filterKeys } from 'simple-validators';
import { VFile } from 'vfile';
import { finalizeMdast } from '../../process/mdast.js';
import type { ISession } from '../../session/types.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { KNOWN_IMAGE_EXTENSIONS } from '../../utils/resolveExtension.js';
import type { ExportWithOutput, ExportFnOptions, ExportResults } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { getFileContent } from '../utils/getFileContent.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import { frontmatterValidationOpts } from '../../frontmatter.js';

function writeMdAndLog(
  session: ISession,
  file: string,
  mdast: GenericParent,
  frontmatter?: PageFrontmatter,
) {
  // Do not write a block break (+++) if there is only a single block
  if (mdast.children?.length === 1) {
    const block = mdast.children[0];
    if (block.type === 'block' && block.children) {
      mdast.children = block.children;
    }
  }
  const vfile = new VFile();
  vfile.path = file;
  writeMd(vfile, mdast as any, frontmatter);
  logMessagesFromVFile(session, vfile);
  return vfile.result as string;
}

async function localArticleToMdRaw(
  session: ISession,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  const toc = tic();
  const { output, articles } = exportOptions;
  const { projectPath, extraLinkTransformers, execute } = opts ?? {};
  // At this point, export options are resolved to contain one-and-only-one article
  const article = articles[0];
  if (!article?.file) return { tempFolders: [] };
  const [{ mdast, frontmatter }] = await getFileContent(session, [article.file], {
    projectPath,
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    extraLinkTransformers,
    preFrontmatters: [
      filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    ],
    execute,
  });
  await finalizeMdast(session, mdast, frontmatter, article.file, {
    imageWriteFolder: path.join(path.dirname(output), 'files'),
    imageAltOutputFolder: 'files/',
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    simplifyFigures: false,
    useExistingImages: true,
  });
  const result = writeMdAndLog(session, article.file, mdast as any, frontmatter);
  session.log.info(toc(`📑 Exported MD in %s, copying to ${output}`));
  writeFileToFolder(output, result as string);
  return { tempFolders: [] };
}

export function extractMdPart(
  session: ISession,
  file: string,
  mdast: GenericParent,
  partDefinition: TemplatePartDefinition,
): string | string[] | undefined {
  const part = extractPart(mdast, partDefinition.id);
  if (!part) return undefined;
  if (!partDefinition.as_list) {
    return writeMdAndLog(session, file, part);
  }
  if (
    part.children.length === 1 &&
    part.children[0]?.children?.length === 1 &&
    part.children[0].children[0].type === 'list'
  ) {
    const items = selectAll('listItem', part) as GenericParent[];
    return items.map((item: GenericParent) => {
      return writeMdAndLog(session, file, { type: 'root', children: item.children });
    });
  }
  return part.children.map((block) => {
    return writeMdAndLog(session, file, { type: 'root', children: [block] });
  });
}

async function localArticleToMdTemplated(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  const toc = tic();
  const { output, articles, template } = exportOptions;
  const { projectPath, extraLinkTransformers, clean, ci, execute } = opts ?? {};
  // At this point, export options are resolved to contain one-and-only-one article
  const article = articles[0];
  const file = article?.file;
  if (!file) return { tempFolders: [] };
  const [{ mdast, frontmatter }] = await getFileContent(session, [file], {
    projectPath,
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    extraLinkTransformers,
    preFrontmatters: [
      filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    ],
    execute,
  });
  await finalizeMdast(session, mdast, frontmatter, file, {
    imageWriteFolder: path.join(path.dirname(output), 'files'),
    imageAltOutputFolder: 'files/',
    imageExtensions: KNOWN_IMAGE_EXTENSIONS,
    simplifyFigures: false,
    useExistingImages: true,
  });

  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.md,
    template: template || undefined,
    buildDir: session.buildPath(),
    errorLogFn: (message: string) => {
      addWarningForFile(session, sourceFile, message, 'error', {
        ruleId: RuleId.texRenders,
      });
    },
    warningLogFn: (message: string) => {
      addWarningForFile(session, sourceFile, message, 'warn', {
        ruleId: RuleId.mdRenders,
      });
    },
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const templateYml = mystTemplate.getValidatedTemplateYml();
  const partDefinitions = templateYml?.parts || [];
  const parts: Record<string, string | string[]> = {};
  partDefinitions.forEach((def) => {
    const part = extractMdPart(session, file, mdast, def);
    parts[def.id] = part ?? '';
  });
  const content = writeMdAndLog(session, file, mdast);
  const vfile = new VFile();
  vfile.path = file;
  let exportFrontmatter = validateProjectFrontmatter(
    filterKeys(exportOptions, [...PROJECT_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    frontmatterValidationOpts(vfile),
  );
  logMessagesFromVFile(session, vfile);
  exportFrontmatter = { ...frontmatter, ...exportFrontmatter };
  session.log.info(toc(`📑 Exported MD in %s, copying to ${output}`));
  renderTemplate(mystTemplate, {
    contentOrPath: content,
    outputPath: output,
    frontmatter: exportFrontmatter,
    parts,
    options: { ...exportFrontmatter.options, ...exportOptions },
    sourceFile,
    force: clean,
    removeVersionComment: ci,
  });
  return { tempFolders: [] };
}

export async function runMdExport(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  if (opts?.clean) cleanOutput(session, exportOptions.output);
  let result: ExportResults;
  if (exportOptions.template) {
    // No default template - only use template if explicitly set
    result = await localArticleToMdTemplated(session, sourceFile, exportOptions, opts);
  } else {
    result = await localArticleToMdRaw(session, exportOptions, opts);
  }
  return result;
}
