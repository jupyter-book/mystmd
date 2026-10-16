import fs from 'node:fs';
import path from 'node:path';
import type { Content } from 'mdast';
import { createDocFromState, DocxSerializer, writeDocx } from 'myst-to-docx';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import {
  FRONTMATTER_ALIASES,
  PAGE_KNOWN_PARTS,
  PAGE_FRONTMATTER_KEYS,
  PROJECT_FRONTMATTER_KEYS,
  validateProjectFrontmatter,
} from 'myst-frontmatter';
import type { RendererDoc, TemplatePartDefinition } from 'myst-templates';
import MystTemplate from 'myst-templates';
import { htmlTransform } from 'myst-transforms';
import type { GenericParent } from 'myst-common';
import { extractPart, fileError, fileWarn, RuleId, TemplateKind, toText } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { filterKeys } from 'simple-validators';
import { VFile } from 'vfile';
import { frontmatterValidationOpts } from '../../frontmatter.js';
import { finalizeMdast } from '../../process/mdast.js';
import type { ISession } from '../../session/types.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { ImageExtensions } from '../../utils/resolveExtension.js';
import { resolveFrontmatterParts } from '../../utils/resolveFrontmatterParts.js';
import type {
  DocxPart,
  DocxRendererData,
  ExportFnOptions,
  ExportResults,
  ExportWithOutput,
} from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { getFileContent } from '../utils/getFileContent.js';
import { createFooter } from './footers.js';
import { createArticleTitle, createPartTitle, createReferenceTitle } from './titles.js';

const DOCX_IMAGE_EXTENSIONS = [ImageExtensions.png, ImageExtensions.jpg, ImageExtensions.jpeg];
const BACKMATTER_PARTS = new Set(['data_availability', 'acknowledgments']);
const PART_TITLES: Record<string, string> = {
  abstract: 'Abstract',
  summary: 'Summary',
  keypoints: 'Key Points',
  dedication: 'Dedication',
  epigraph: 'Epigraph',
  data_availability: 'Data Availability',
  acknowledgments: 'Acknowledgments',
};

function splitPart(mdast: GenericParent, asList?: boolean): GenericParent | GenericParent[] {
  if (!asList) return mdast;
  if (
    mdast.children.length === 1 &&
    mdast.children[0]?.children?.length === 1 &&
    mdast.children[0].children[0].type === 'list'
  ) {
    return selectAll('listItem', mdast).map((item) => ({
      type: 'root',
      children: (item as GenericParent).children,
    })) as GenericParent[];
  }
  return mdast.children.map((child) => ({ type: 'root', children: [child] }));
}

export function extractDocxParts(
  session: ISession,
  mdast: GenericParent,
  frontmatter: DocxRendererData['frontmatter'],
  templateDefinitions: TemplatePartDefinition[],
) {
  const definitions: TemplatePartDefinition[] = [
    ...templateDefinitions,
    ...PAGE_KNOWN_PARTS.filter((id) => !templateDefinitions.some((def) => def.id === id)).map(
      (id) => ({ id, title: PART_TITLES[id] }),
    ),
  ];
  return definitions.reduce<Record<string, DocxPart>>((parts, definition) => {
    const part = extractPart(mdast, definition.id, {
      frontmatterParts: resolveFrontmatterParts(session, frontmatter),
    });
    if (part) parts[definition.id] = { definition, mdast: splitPart(part, definition.as_list) };
    return parts;
  }, {});
}

function renderParts(
  serializer: DocxSerializer,
  parts: Record<string, DocxPart>,
  backmatter: boolean,
) {
  Object.values(parts)
    .filter(({ definition }) => BACKMATTER_PARTS.has(definition.id) === backmatter)
    .forEach(({ definition, mdast }) => {
      const title = definition.title ?? PART_TITLES[definition.id];
      if (title) serializer.render(createPartTitle(title));
      (Array.isArray(mdast) ? mdast : [mdast]).forEach((part) => {
        serializer.renderChildren(part);
      });
    });
}

export function defaultWordRenderer(
  session: ISession,
  data: DocxRendererData,
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
  renderParts(serializer, data.parts, false);
  serializer.renderChildren(mdast);
  renderParts(serializer, data.parts, true);

  // Take each reference
  const referenceNodes = Object.values(references.cite?.data ?? {})
    // Parse the HTML into mdast
    .map(({ html }) => htmlTransform({ type: 'root', children: [{ type: 'html', value: html }] }))
    // Replace "root of phrasing" with "paragraph of phrasing"
    .map((root) => ({ type: 'paragraph', children: root.children }))
    // Parse out the string representation (to drop formatting)
    .map((node) => ({
      repr: toText(node),
      node,
    }))
    // Sort the string representation
    .sort((a, b) => a.repr.localeCompare(b.repr))
    // Drop the string representation
    .map(({ node }) => node);

  if (referenceNodes.length > 0) {
    serializer.render(createReferenceTitle());

    const referencesRoot = {
      type: 'root',
      children: referenceNodes,
    };
    serializer.renderChildren(referencesRoot);
    serializer.closeBlock();
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
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  const { output, articles } = exportOptions;
  const { clean, projectPath, extraLinkTransformers, execute } = opts ?? {};
  // At this point, export options are resolved to contain one-and-only-one article
  const article = articles[0];
  if (!article?.file) return { tempFolders: [] };
  if (clean) cleanOutput(session, output);
  const vfile = new VFile();
  vfile.path = output;
  const imageWriteFolder = createTempFolder(session);
  const [data] = await getFileContent(session, [article.file], {
    projectPath,
    imageExtensions: DOCX_IMAGE_EXTENSIONS,
    extraLinkTransformers,
    preFrontmatters: [
      filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    ],
    execute,
  });
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.docx,
    template: exportOptions.template || undefined,
    buildDir: session.buildPath(),
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: RuleId.docxRenders });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: RuleId.docxRenders });
    },
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const toc = tic();

  const exportFrontmatter = validateProjectFrontmatter(
    filterKeys(exportOptions, [...PROJECT_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    frontmatterValidationOpts(vfile),
  );
  logMessagesFromVFile(session, vfile);
  data.frontmatter = { ...data.frontmatter, ...exportFrontmatter };
  await finalizeMdast(session, data.mdast, data.frontmatter, article.file, {
    imageWriteFolder,
    imageExtensions: DOCX_IMAGE_EXTENSIONS,
    simplifyFigures: true,
  });
  const templateYml = mystTemplate.getValidatedTemplateYml();
  const parts = extractDocxParts(session, data.mdast, data.frontmatter, templateYml?.parts ?? []);
  const templateParts = Object.fromEntries(
    (templateYml?.parts ?? [])
      .filter(({ id }) => parts[id])
      .map(({ id }) => {
        const mdast = parts[id].mdast;
        return [id, Array.isArray(mdast) ? mdast.map((part) => toText(part)) : toText(mdast)];
      }),
  );
  const { options, doc } = mystTemplate.prepare({
    frontmatter: data.frontmatter,
    parts: templateParts,
    options: { ...data.frontmatter.options, ...exportOptions },
    sourceFile: file,
  });
  const renderer = exportOptions.renderer ?? defaultWordRenderer;
  const rendererData: DocxRendererData = { ...data, parts };
  const docx = renderer(session, rendererData, doc, options, mystTemplate.templatePath, vfile);
  logMessagesFromVFile(session, vfile);
  await writeDocx(docx, (buffer) => writeFileToFolder(output, buffer));
  session.log.info(toc(`📄 Exported DOCX in %s, copying to ${output}`));
  return { tempFolders: [imageWriteFolder] };
}
