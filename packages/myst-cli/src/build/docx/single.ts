import fs from 'fs';
import path from 'path';
import type { RendererDoc } from 'jtex';
import JTex from 'jtex';
import type { Content } from 'mdast';
import { createDocFromState, DocxSerializer, writeDocx } from 'myst-to-docx';
import { writeFileToFolder } from 'myst-cli-utils';
import type { Export } from 'myst-frontmatter';
import { validateExport, ExportFormats } from 'myst-frontmatter';
import type { LinkTransformer } from 'myst-transforms';
import { htmlTransform } from 'myst-transforms';
import type { ValidationOptions } from 'simple-validators';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config';
import { getRawFrontmatterFromFile } from '../../frontmatter';
import { loadProjectFromDisk } from '../../project';
import type { ISession } from '../../session/types';
import type { RendererData } from '../../transforms/types';
import { createTempFolder, logMessagesFromVFile } from '../../utils';
import type { ExportOptions, ExportWithOutput } from '../types';
import {
  getDefaultExportFilename,
  getDefaultExportFolder,
  resolveAndLogErrors,
  cleanOutput,
  getSingleFileContent,
} from '../utils';
import { createFooter } from './footers';
import { createArticleTitle, createReferenceTitle } from './titles';

export async function collectWordExportOptions(
  session: ISession,
  file: string,
  extension: string,
  formats: ExportFormats[],
  projectPath: string | undefined,
  opts: ExportOptions,
) {
  const { template, filename, renderer } = opts;
  const rawFrontmatter = await getRawFrontmatterFromFile(session, file);
  const exportErrorMessages: ValidationOptions['messages'] = {};
  let exportOptions: Export[] =
    rawFrontmatter?.exports
      ?.map((exp: any, ind: number) => {
        return validateExport(exp, {
          property: `exports.${ind}`,
          messages: exportErrorMessages,
          errorLogFn: (message: string) => {
            session.log.error(`Validation error: ${message}`);
          },
          warningLogFn: (message: string) => {
            session.log.warn(`Validation: ${message}`);
          },
        });
      })
      .filter((exp: Export | undefined) => exp && formats.includes(exp?.format)) || [];
  // If no export options are provided in frontmatter, instantiate default options
  if (exportOptions.length === 0 && formats.length && opts.force) {
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
      const resolvedOptions: {
        output: string;
        renderer?: ExportOptions['renderer'];
        template?: string | null;
      } = { output };
      if (renderer) {
        resolvedOptions.renderer = renderer;
      }
      if (template) {
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

function defaultWordRenderer(
  session: ISession,
  data: RendererData,
  doc: RendererDoc,
  opts: Record<string, any>,
  staticPath: string,
  vfile: VFile,
) {
  const { mdast, frontmatter, references } = data;
  const frontmatterNodes = createArticleTitle(frontmatter.title, frontmatter.authors) as Content[];
  const serializer = new DocxSerializer(
    vfile,
    {
      getImageBuffer(image: string) {
        // This extra read somehow prevents an error when buffer-image-size tries to get image dimensions...
        fs.readFileSync(image);
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
  const logo = path.join(staticPath, 'logo.png');
  const docfooter = fs.existsSync(logo) && !opts.hideFooter ? createFooter(logo) : undefined;
  const styles = path.join(staticPath, 'styles.xml');
  const docstyles = fs.existsSync(styles) ? fs.readFileSync(styles).toString() : undefined;
  return createDocFromState(serializer, docfooter, docstyles);
}

export async function runWordExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  projectPath?: string,
  clean?: boolean,
  extraLinkTransformers?: LinkTransformer[],
) {
  const { output } = exportOptions;
  if (clean) cleanOutput(session, output);
  const data = await getSingleFileContent(session, file, createTempFolder(session), {
    projectPath,
    extraLinkTransformers,
  });
  const vfile = new VFile();
  vfile.path = output;
  const jtex = new JTex(session, {
    kind: 'docx' as any,
    template: exportOptions.template || undefined,
    buildDir: session.buildPath(),
  });
  await jtex.ensureTemplateExistsOnPath();
  const { options, doc } = jtex.preRender({
    frontmatter: data.frontmatter,
    parts: [],
    options: exportOptions,
    sourceFile: file,
  });
  const renderer = exportOptions.renderer ?? defaultWordRenderer;
  const docx = renderer(session, data, doc, options, jtex.templatePath, vfile);
  logMessagesFromVFile(session, vfile);
  session.log.info(`🖋  Writing docx to ${output}`);
  await writeDocx(docx, (buffer) => writeFileToFolder(output, buffer));
}

export async function localArticleToWord(
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
    await collectWordExportOptions(session, file, 'docx', [ExportFormats.docx], projectPath, opts)
  ).map((exportOptions) => {
    return { ...exportOptions, ...templateOptions };
  });
  await resolveAndLogErrors(
    session,
    exportOptionsList.map(async (exportOptions) => {
      await runWordExport(
        session,
        file,
        exportOptions,
        projectPath,
        opts.clean,
        extraLinkTransformers,
      );
    }),
  );
}
