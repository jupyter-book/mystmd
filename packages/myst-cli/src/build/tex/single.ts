import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import type { TemplateImports } from 'jtex';
import { renderTex, mergeTemplateImports } from 'jtex';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import type { References, GenericParent } from 'myst-common';
import { extractPart, RuleId, TemplateKind } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { ExportFormats } from 'myst-frontmatter';
import type { TemplatePartDefinition, TemplateYml } from 'myst-templates';
import MystTemplate from 'myst-templates';
import mystToTex, { mergePreambles, generatePreamble } from 'myst-to-tex';
import type { LatexResult, PreambleData } from 'myst-to-tex';
import type { LinkTransformer } from 'myst-transforms';
import { unified } from 'unified';
import { select, selectAll } from 'unist-util-select';
import { findCurrentProjectAndLoad } from '../../config.js';
import { finalizeMdast } from '../../process/mdast.js';
import { loadProjectFromDisk } from '../../project/load.js';
import { castSession } from '../../session/cache.js';
import type { ISession } from '../../session/types.js';
import { ImageExtensions } from '../../utils/resolveExtension.js';
import { logMessagesFromVFile } from '../../utils/logMessagesFromVFile.js';
import { getFileContent } from '../utils/getFileContent.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import type { ExportWithOutput, ExportOptions, ExportResults } from '../types.js';
import { collectTexExportOptions } from '../utils/collectExportOptions.js';
import { resolveAndLogErrors } from '../utils/resolveAndLogErrors.js';
import { selectors } from '../../store/index.js';

export const DEFAULT_BIB_FILENAME = 'main.bib';
const TEX_IMAGE_EXTENSIONS = [
  ImageExtensions.pdf,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
];

export function mdastToTex(
  session: ISession,
  mdast: GenericParent,
  references: References,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml | null,
  printGlossaries: boolean,
) {
  const pipe = unified().use(mystToTex, {
    math: frontmatter?.math,
    citestyle: templateYml?.style?.citation,
    bibliography: templateYml?.style?.bibliography,
    printGlossaries,
    references,
    ...frontmatter.settings?.myst_to_tex,
  });
  const result = pipe.runSync(mdast as any);
  const tex = pipe.stringify(result);
  logMessagesFromVFile(session, tex);
  return tex.result as LatexResult;
}

export function extractTexPart(
  session: ISession,
  mdast: GenericParent,
  references: References,
  partDefinition: TemplatePartDefinition,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml,
): LatexResult | LatexResult[] | undefined {
  const part = extractPart(mdast, partDefinition.id);
  if (!part) return undefined;
  if (!partDefinition.as_list) {
    // Do not build glossaries when extracting parts: references cannot be mapped to definitions
    return mdastToTex(session, part, references, frontmatter, templateYml, false);
  }
  if (
    part.children.length === 1 &&
    part.children[0]?.children?.length === 1 &&
    part.children[0].children[0].type === 'list'
  ) {
    const items = selectAll('listItem', part) as GenericParent[];
    return items.map((item: GenericParent) => {
      return mdastToTex(
        session,
        { type: 'root', children: item.children },
        references,
        frontmatter,
        templateYml,
        false,
      );
    });
  }
  return part.children.map((block) => {
    return mdastToTex(
      session,
      { type: 'root', children: [block] },
      references,
      frontmatter,
      templateYml,
      false,
    );
  });
}

export async function localArticleToTexRaw(
  session: ISession,
  templateOptions: ExportWithOutput,
  projectPath?: string,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  const { articles, output } = templateOptions;
  const content = await getFileContent(session, articles, {
    projectPath,
    imageExtensions: TEX_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });

  const toc = tic();
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      const article = articles[ind];
      await finalizeMdast(session, mdast, frontmatter, article, {
        imageWriteFolder: path.join(path.dirname(output), 'files'),
        imageAltOutputFolder: 'files/',
        imageExtensions: TEX_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });
      return mdastToTex(session, mdast, references, frontmatter, null, false);
    }),
  );
  session.log.info(toc(`📑 Exported TeX in %s, copying to ${output}`));
  if (results.length === 1) {
    writeFileToFolder(output, results[0].value);
  } else {
    const { dir, name, ext } = path.parse(output);
    const includeFileBases = results.map((result, ind) => {
      const base = `${name}-${content[ind]?.slug ?? ind}${ext}`;
      const includeFile = path.format({ dir, ext, base });
      writeFileToFolder(includeFile, result.value);
      return base;
    });
    const includeContent = includeFileBases.map((base) => `\\include{${base}}`).join('\n');
    writeFileToFolder(output, includeContent);
  }
  // TODO: add imports and macros?
  return { tempFolders: [] };
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
): Promise<ExportResults> {
  const { output, articles, template } = templateOptions;
  const filesPath = path.join(path.dirname(output), 'files');
  const content = await getFileContent(session, articles, {
    projectPath,
    imageExtensions: TEX_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });
  writeBibtexFromCitationRenderers(session, path.join(path.dirname(output), DEFAULT_BIB_FILENAME));

  const warningLogFn = (message: string) => {
    addWarningForFile(session, file, message, 'warn', {
      ruleId: RuleId.texRenders,
    });
  };
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.tex,
    template: template || undefined,
    buildDir: session.buildPath(),
    errorLogFn: (message: string) => {
      addWarningForFile(session, file, message, 'error', {
        ruleId: RuleId.texRenders,
      });
    },
    warningLogFn,
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const toc = tic();
  const templateYml = mystTemplate.getValidatedTemplateYml();
  const partDefinitions = templateYml?.parts || [];
  const parts: Record<string, string | string[]> = {};
  let collectedImports: TemplateImports = { imports: [], commands: {} };
  let preambleData: PreambleData = {
    hasProofs: false,
    printGlossaries: false,
    glossary: {},
    abbreviations: {},
  };
  let hasGlossaries = false;
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      const article = articles[ind];
      await finalizeMdast(session, mdast, frontmatter, article, {
        imageWriteFolder: filesPath,
        imageAltOutputFolder: 'files/',
        imageExtensions: TEX_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });

      partDefinitions.forEach((def) => {
        const part = extractTexPart(session, mdast, references, def, frontmatter, templateYml);
        if (part && parts[def.id]) {
          addWarningForFile(
            session,
            file,
            `multiple values for part '${def.id}' found; ignoring value from ${article}`,
            'error',
            { ruleId: RuleId.texRenders },
          );
        } else if (Array.isArray(part)) {
          // This is the case if def.as_list is true
          part.forEach((item) => {
            collectedImports = mergeTemplateImports(collectedImports, item);
          });
          parts[def.id] = part.map(({ value }) => value);
        } else if (part != null) {
          collectedImports = mergeTemplateImports(collectedImports, part);
          parts[def.id] = part?.value ?? '';
        }
      });
      const result = mdastToTex(session, mdast, references, frontmatter, templateYml, true);
      collectedImports = mergeTemplateImports(collectedImports, result);
      preambleData = mergePreambles(preambleData, result.preamble, warningLogFn);
      hasGlossaries = hasGlossaries || hasGlossary(mdast);
      return result;
    }),
  );

  let frontmatter: Record<string, any>;
  let texContent: string;
  if (results.length === 1) {
    frontmatter = content[0].frontmatter;
    texContent = results[0].value;
  } else {
    const state = session.store.getState();
    frontmatter = selectors.selectLocalProjectConfig(state, projectPath ?? '.') ?? {};
    const { dir, name, ext } = path.parse(output);
    const includeFileBases = results.map((result, ind) => {
      const base = `${name}-${content[ind]?.slug ?? ind}${ext}`;
      const includeFile = path.format({ dir, ext, base });
      writeFileToFolder(includeFile, result.value);
      return base;
    });
    texContent = includeFileBases.map((base) => `\\include{${base}}`).join('\n');
  }
  // Fill in template
  session.log.info(toc(`📑 Exported TeX in %s, copying to ${output}`));
  const { preamble, suffix } = generatePreamble(preambleData);
  renderTex(mystTemplate, {
    contentOrPath: texContent + suffix,
    outputPath: output,
    frontmatter,
    parts,
    options: { ...frontmatter.options, ...templateOptions },
    bibliography: [DEFAULT_BIB_FILENAME],
    sourceFile: file,
    imports: collectedImports,
    preamble,
    force,
    packages: templateYml.packages,
    filesPath,
  });
  return { tempFolders: [], hasGlossaries };
}

export async function runTexExport( // DBG: Must return an info on whether glossaries are present
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  if (clean) cleanOutput(session, exportOptions.output);
  let result: ExportResults;
  if (exportOptions.template === null) {
    result = await localArticleToTexRaw(session, exportOptions, projectPath, extraLinkTransformers);
  } else {
    result = await localArticleToTexTemplated(
      session,
      file,
      exportOptions,
      projectPath,
      clean,
      extraLinkTransformers,
    );
  }
  return result;
}

export async function runTexZipExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
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
  return { tempFolders: [texFolder] };
}

export async function localArticleToTex(
  session: ISession,
  file: string,
  opts: ExportOptions,
  templateOptions?: Record<string, any>,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  let { projectPath } = opts;
  if (!projectPath) projectPath = findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) await loadProjectFromDisk(session, projectPath);
  const exportOptionsList = (
    await collectTexExportOptions(session, file, 'tex', [ExportFormats.tex], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      let exportResults: ExportResults;
      if (path.extname(exportOptions.output) === '.zip') {
        exportResults = await runTexZipExport(
          session,
          file,
          exportOptions,
          projectPath,
          opts.clean,
          extraLinkTransformers,
        );
      } else {
        exportResults = await runTexExport(
          session,
          file,
          exportOptions,
          projectPath,
          opts.clean,
          extraLinkTransformers,
        );
      }
      results.tempFolders.push(...exportResults.tempFolders);
    }),
    opts.throwOnFailure,
  );
  return results;
}

function hasGlossary(mdast: GenericParent): boolean {
  const glossary = select('glossary', mdast);
  return glossary !== null;
}
