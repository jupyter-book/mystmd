import fs from 'fs';
import path from 'path';
import type { Content } from 'mdast';
import { createDocFromState, DocxSerializer, writeDocx } from 'myst-to-docx';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { ExportFormats } from 'myst-frontmatter';
import type { RendererDoc } from 'myst-templates';
import MystTemplate from 'myst-templates';
import type { LinkTransformer } from 'myst-transforms';
import { htmlTransform } from 'myst-transforms';
import { VFile } from 'vfile';
import { findCurrentProjectAndLoad } from '../../config';
import { loadProjectFromDisk } from '../../project';
import type { ISession } from '../../session/types';
import type { RendererData } from '../../transforms/types';
import { createTempFolder, ImageExtensions, logMessagesFromVFile } from '../../utils';
import type { ExportOptions, ExportWithOutput } from '../types';
import {
  resolveAndLogErrors,
  cleanOutput,
  getFileContent,
  collectWordExportOptions,
} from '../utils';
import { createFooter } from './footers';
import { createArticleTitle, createReferenceTitle } from './titles';
import { TemplateKind } from 'myst-common';
import { selectAll } from 'unist-util-select';

const DOCX_IMAGE_EXTENSIONS = [ImageExtensions.png, ImageExtensions.jpg, ImageExtensions.jpeg];

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
  const referencesDocStates = Object.values(references.cite?.data ?? {})
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
  selectAll('footnoteDefinition', mdast).forEach((footnote) => {
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
  const { output, article } = exportOptions;
  if (clean) cleanOutput(session, output);
  const vfile = new VFile();
  vfile.path = output;
  const [data] = await getFileContent(session, [article], createTempFolder(session), {
    projectPath,
    imageExtensions: DOCX_IMAGE_EXTENSIONS,
    extraLinkTransformers,
  });
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.docx,
    template: exportOptions.template || undefined,
    buildDir: session.buildPath(),
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const toc = tic();
  const { options, doc } = mystTemplate.prepare({
    frontmatter: data.frontmatter,
    parts: [],
    options: exportOptions,
    sourceFile: file,
  });
  const renderer = exportOptions.renderer ?? defaultWordRenderer;
  const docx = renderer(session, data, doc, options, mystTemplate.templatePath, vfile);
  logMessagesFromVFile(session, vfile);
  await writeDocx(docx, (buffer) => writeFileToFolder(output, buffer));
  session.log.info(toc(`📄 Exported DOCX in %s, copying to ${output}`));
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
    opts.throwOnFailure,
  );
}
