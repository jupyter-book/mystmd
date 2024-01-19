import AdmZip from 'adm-zip';
import path from 'node:path';
import which from 'which';
import { makeExecutable, tic, writeFileToFolder } from 'myst-cli-utils';
import type { References, GenericParent } from 'myst-common';
import { extractPart, RuleId, TemplateKind } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { ExportFormats } from 'myst-frontmatter';
import type { TemplatePartDefinition, TemplateYml } from 'myst-templates';
import MystTemplate from 'myst-templates';
import mystToTypst from 'myst-to-typst';
import type { TypstResult } from 'myst-to-typst';
import type { LinkTransformer } from 'myst-transforms';
import { unified } from 'unified';
import { selectAll } from 'unist-util-select';
import type { TypstTemplateImports } from 'jtex';
import { mergeTypstTemplateImports, renderTemplate, renderTypstImports } from 'jtex';
import { findCurrentProjectAndLoad } from '../config.js';
import { finalizeMdast } from '../process/mdast.js';
import { loadProjectFromDisk } from '../project/load.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { ImageExtensions } from '../utils/resolveExtension.js';
import { logMessagesFromVFile } from '../utils/logMessagesFromVFile.js';
import { getFileContent } from './utils/getFileContent.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { createTempFolder } from '../utils/createTempFolder.js';
import version from '../version.js';
import { cleanOutput } from './utils/cleanOutput.js';
import type { ExportWithOutput, ExportOptions, ExportResults } from './types.js';
import { writeBibtexFromCitationRenderers } from './utils/bibtex.js';
import { collectTexExportOptions } from './utils/collectExportOptions.js';
import { resolveAndLogErrors } from './utils/resolveAndLogErrors.js';

export const DEFAULT_BIB_FILENAME = 'main.bib';
const TYPST_IMAGE_EXTENSIONS = [
  ImageExtensions.svg,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
];

export function isTypstAvailable() {
  return which.sync('typst', { nothrow: true });
}

export async function runTypstExecutable(session: ISession, typstFile: string) {
  if (!isTypstAvailable()) {
    session.log.debug('typst CLI must be installed to build PDFs from typst');
    return;
  }
  if (path.extname(typstFile) !== '.typ') {
    throw new Error(`invalid input file for typst executable: ${typstFile}`);
  }
  session.log.debug('Running typst compile');
  await makeExecutable(`typst compile ${typstFile}`, session.log)();
}

export function mdastToTypst(
  session: ISession,
  mdast: GenericParent,
  references: References,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml | null,
  printGlossaries: boolean,
) {
  const pipe = unified().use(mystToTypst, {
    math: frontmatter?.math,
    // citestyle: templateYml?.style?.citation,
    // bibliography: templateYml?.style?.bibliography,
    // printGlossaries,
    // references,
    // ...frontmatter.settings?.myst_to_tex,
  });
  const result = pipe.runSync(mdast as any);
  const typ = pipe.stringify(result);
  logMessagesFromVFile(session, typ);
  return typ.result as TypstResult;
}

export function extractTypstPart(
  session: ISession,
  mdast: GenericParent,
  references: References,
  partDefinition: TemplatePartDefinition,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml,
): TypstResult | TypstResult[] | undefined {
  const part = extractPart(mdast, partDefinition.id);
  if (!part) return undefined;
  if (!partDefinition.as_list) {
    // Do not build glossaries when extracting parts: references cannot be mapped to definitions
    return mdastToTypst(session, part, references, frontmatter, templateYml, false);
  }
  if (
    part.children.length === 1 &&
    part.children[0]?.children?.length === 1 &&
    part.children[0].children[0].type === 'list'
  ) {
    const items = selectAll('listItem', part) as GenericParent[];
    return items.map((item: GenericParent) => {
      return mdastToTypst(
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
    return mdastToTypst(
      session,
      { type: 'root', children: [block] },
      references,
      frontmatter,
      templateYml,
      false,
    );
  });
}

export async function localArticleToTypstRaw(
  session: ISession,
  templateOptions: ExportWithOutput,
  projectPath?: string,
  extraLinkTransformers?: LinkTransformer[],
): Promise<ExportResults> {
  const { articles, output } = templateOptions;
  const content = await getFileContent(session, articles, {
    projectPath,
    imageExtensions: TYPST_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });

  const toc = tic();
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      const article = articles[ind];
      await finalizeMdast(session, mdast, frontmatter, article, {
        imageWriteFolder: path.join(path.dirname(output), 'files'),
        imageAltOutputFolder: 'files/',
        imageExtensions: TYPST_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });
      return mdastToTypst(session, mdast, references, frontmatter, null, false);
    }),
  );
  session.log.info(toc(`📑 Exported typst in %s, copying to ${output}`));
  if (results.length === 1) {
    writeFileToFolder(output, results[0].value);
  } else {
    const { dir, name, ext } = path.parse(output);
    const includeFileBases = results.map((result, ind) => {
      const base = `${name}-${content[ind]?.slug ?? ind}${ext}`;
      const includeFile = path.format({ dir, ext, base });
      let part = '';
      const { title, content_includes_title } = content[ind]?.frontmatter ?? {};
      if (title && !content_includes_title) {
        part = `= ${title}\n\n`;
      }
      writeFileToFolder(includeFile, `${part}${result.value}`);
      return base;
    });
    const includeContent = includeFileBases.map((base) => `\\include{${base}}`).join('\n');
    writeFileToFolder(output, includeContent);
  }
  // TODO: add imports and macros?
  return { tempFolders: [] };
}

export async function localArticleToTypstTemplated(
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
    imageExtensions: TYPST_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });
  const bibtexWritten = writeBibtexFromCitationRenderers(
    session,
    path.join(path.dirname(output), DEFAULT_BIB_FILENAME),
    content,
  );

  const warningLogFn = (message: string) => {
    addWarningForFile(session, file, message, 'warn', {
      ruleId: RuleId.texRenders,
    });
  };
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.typst,
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
  let collected: TypstTemplateImports = {
    macros: [],
    commands: {},
  };
  const hasGlossaries = false;
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      const article = articles[ind];
      await finalizeMdast(session, mdast, frontmatter, article, {
        imageWriteFolder: filesPath,
        imageAltOutputFolder: 'files/',
        imageExtensions: TYPST_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });

      partDefinitions.forEach((def) => {
        const part = extractTypstPart(session, mdast, references, def, frontmatter, templateYml);
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
            collected = mergeTypstTemplateImports(collected, item);
          });
          parts[def.id] = part.map(({ value }) => value);
        } else if (part != null) {
          collected = mergeTypstTemplateImports(collected, part);
          parts[def.id] = part?.value ?? '';
        }
      });
      const result = mdastToTypst(session, mdast, references, frontmatter, templateYml, true);
      collected = mergeTypstTemplateImports(collected, result);
      return result;
    }),
  );

  let frontmatter: Record<string, any>;
  let typstContent: string;
  const versionString = `/* Written by MyST v${version} */`;
  if (results.length === 1) {
    frontmatter = content[0].frontmatter;
    typstContent = results[0].value;
  } else {
    const state = session.store.getState();
    frontmatter = selectors.selectLocalProjectConfig(state, projectPath ?? '.') ?? {};
    const { dir, name, ext } = path.parse(output);
    const includeFileBases = results.map((result, ind) => {
      const base = `${name}-${content[ind]?.slug ?? ind}${ext}`;
      const includeFile = path.format({ dir, ext, base });
      const exports = renderTypstImports(false, collected);
      let part = '';
      const { title, content_includes_title } = content[ind]?.frontmatter ?? {};
      if (title && !content_includes_title) {
        part = `= ${title}\n\n`;
      }
      writeFileToFolder(includeFile, `${versionString}\n\n${exports}\n\n${part}${result.value}`);
      return base;
    });
    typstContent = includeFileBases.map((base) => `#include "${base}"`).join('\n');
  }
  typstContent = `${versionString}\n\n${typstContent}`;
  session.log.info(toc(`📑 Exported typst in %s, copying to ${output}`));
  renderTemplate(mystTemplate, {
    contentOrPath: typstContent,
    outputPath: output,
    frontmatter,
    parts,
    options: { ...frontmatter.options, ...templateOptions },
    bibliography: bibtexWritten ? DEFAULT_BIB_FILENAME : undefined,
    sourceFile: file,
    imports: collected,
    force,
    packages: templateYml.packages,
    filesPath,
  });
  await runTypstExecutable(session, output);
  return { tempFolders: [], hasGlossaries };
}

export async function runTypstExport( // DBG: Must return an info on whether glossaries are present
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
    result = await localArticleToTypstRaw(
      session,
      exportOptions,
      projectPath,
      extraLinkTransformers,
    );
  } else {
    result = await localArticleToTypstTemplated(
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

export async function runTypstZipExport(
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
  await runTypstExport(session, file, exportOptions, projectPath, false, extraLinkTransformers);
  session.log.info(`🤐 Zipping typst outputs to ${zipOutput}`);
  const zip = new AdmZip();
  zip.addLocalFolder(texFolder);
  zip.writeZip(zipOutput);
  return { tempFolders: [texFolder] };
}

export async function localArticleToTypst(
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
    await collectTexExportOptions(session, file, 'typ', [ExportFormats.tex], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  const results: ExportResults = { tempFolders: [] };
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      let exportResults: ExportResults;
      if (path.extname(exportOptions.output) === '.zip') {
        exportResults = await runTypstZipExport(
          session,
          file,
          exportOptions,
          projectPath,
          opts.clean,
          extraLinkTransformers,
        );
      } else {
        exportResults = await runTypstExport(
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
