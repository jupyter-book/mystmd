import fs from 'fs';
import path from 'path';
import type { File } from 'docx';
import type { Content } from 'mdast';
import { createDocFromState, DocxSerializer, writeDocx } from 'myst-to-docx';
import { writeFileToFolder } from 'myst-cli-utils';
import type { Export } from 'myst-frontmatter';
import { validateExport, ExportFormats } from 'myst-frontmatter';
import { htmlTransform } from 'myst-transforms';
import type { ValidationOptions } from 'simple-validators';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config';
import { getRawFrontmatterFromFile } from '../../frontmatter';
import { loadProjectAndBibliography } from '../../project';
import type { ISession } from '../../session/types';
import type { RendererData } from '../../transforms/types';
import { createTempFolder, logMessagesFromVFile } from '../../utils';
import type { ExportWithOutput } from '../types';
import {
  getDefaultExportFilename,
  getDefaultExportFolder,
  resolveAndLogErrors,
  cleanOutput,
  getFileContent,
} from '../utils';
import { createCurvenoteFooter } from './footers';
import DEFAULT_STYLE from './simpleStyles';
import { createArticleTitle, createReferenceTitle } from './titles';

export type WordExportOptions = {
  filename: string;
  clean?: boolean;
  renderer?: (
    session: ISession,
    data: RendererData,
    vfile: VFile,
    opts: Record<string, any>,
  ) => File;
};

export async function collectWordExportOptions(
  session: ISession,
  file: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: WordExportOptions,
) {
  const { filename, renderer } = opts;
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
  if (filename) {
    exportOptions = exportOptions.slice(0, 1);
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
      return { ...exp, output, renderer };
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

function defaultWordRenderer(
  session: ISession,
  data: RendererData,
  vfile: VFile,
  opts: Record<string, any>,
) {
  const { mdast, frontmatter, references } = data;
  const frontmatterNodes = createArticleTitle(frontmatter.title, frontmatter.authors) as Content[];
  const serializer = new DocxSerializer(
    vfile,
    {
      getImageBuffer(image: string) {
        return Buffer.from(fs.readFileSync(image).buffer);
      },
      useFieldsForCrossReferences: false,
    },
    frontmatter,
  );
  frontmatterNodes.forEach((node) => {
    serializer.render(node);
  });
  serializer.renderChildren(mdast);
  const referencesDocStates = Object.values(references.cite.data)
    .map(({ html }) => html)
    .sort((a, b) => a.localeCompare(b))
    .map((html) => {
      return { type: 'html', value: html };
    });
  if (referencesDocStates.length > 0) {
    serializer.render(createReferenceTitle());
    const referencesRoot = htmlTransform({ type: 'root', children: referencesDocStates as any });
    serializer.renderChildren(referencesRoot);
  }
  Object.values(references.footnotes).forEach((footnote) => {
    serializer.render(footnote);
  });
  return createDocFromState(serializer, createCurvenoteFooter(), DEFAULT_STYLE);
}

export async function runWordExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
) {
  const { output } = exportOptions;
  if (clean) cleanOutput(session, output);
  const data = await getFileContent(session, file, createTempFolder(), projectPath);
  const vfile = new VFile();
  vfile.path = output;
  const renderer = exportOptions.renderer ?? defaultWordRenderer;
  const doc = renderer(session, data, vfile, exportOptions);
  logMessagesFromVFile(session, vfile);
  session.log.info(`🖋  Writing docx to ${output}`);
  writeDocx(doc, (buffer) => writeFileToFolder(output, buffer));
}

export async function localArticleToWord(
  session: ISession,
  file: string,
  opts: WordExportOptions,
  templateOptions?: Record<string, any>,
) {
  const projectPath = await findCurrentProjectAndLoad(session, path.dirname(file));
  if (projectPath) loadProjectAndBibliography(session, projectPath);
  const exportOptionsList = (
    await collectWordExportOptions(session, file, 'docx', [ExportFormats.docx], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runWordExport(session, file, exportOptions, projectPath, opts.clean);
    }),
  );
}
