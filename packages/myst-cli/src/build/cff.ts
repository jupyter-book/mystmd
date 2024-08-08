import path from 'node:path';
import yaml from 'js-yaml';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import { extractPart, fileWarn, toText } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { filterKeys } from 'simple-validators';
import { VFile } from 'vfile';
import type { CFF } from 'citation-cff-utils';
import { CFF_KEYS, frontmatterToCFF } from 'citation-cff-utils';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { KNOWN_IMAGE_EXTENSIONS } from '../utils/resolveExtension.js';
import type { ExportWithOutput, ExportFnOptions } from './types.js';
import { cleanOutput } from './utils/cleanOutput.js';
import { getFileContent } from './utils/getFileContent.js';
import { parseMyst } from '../process/myst.js';

function exportOptionsToCFF(exportOptions: ExportWithOutput): CFF {
  // Handle overlap of key "format" between CFF and export
  const exportForCFF: Record<string, any> = { ...exportOptions, format: undefined };
  if (exportForCFF['cff-format']) {
    exportForCFF.format = exportForCFF['cff-format'];
  }
  return filterKeys(exportForCFF, CFF_KEYS) as CFF;
}

export async function runCffExport(
  session: ISession,
  sourceFile: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
) {
  const toc = tic();
  const { output, articles } = exportOptions;
  const { clean, projectPath, extraLinkTransformers } = opts ?? {};
  const article = articles[0];
  const state = session.store.getState();
  let frontmatter: PageFrontmatter | undefined;
  let abstract: string | undefined;
  if (projectPath && selectors.selectLocalConfigFile(state, projectPath) === sourceFile) {
    frontmatter = selectors.selectLocalProjectConfig(state, projectPath);
    const rawAbstract = frontmatter?.parts?.abstract?.join('\n\n');
    if (rawAbstract) {
      const abstractAst = parseMyst(session, rawAbstract, sourceFile);
      abstract = toText(abstractAst);
    }
  } else if (article.file) {
    const [content] = await getFileContent(session, [article.file], {
      projectPath,
      imageExtensions: KNOWN_IMAGE_EXTENSIONS,
      extraLinkTransformers,
    });
    frontmatter = content.frontmatter;
    const abstractMdast = extractPart(content.mdast, 'abstract');
    if (abstractMdast) abstract = toText(abstractMdast);
  }
  if (!frontmatter) return { tempFolders: [] };
  if (clean) cleanOutput(session, output);
  const vfile = new VFile();
  vfile.path = output;
  if (path.basename(output) !== 'CITATION.cff') {
    fileWarn(
      vfile,
      `Invalid Citation File Format filename ${path.basename(output)} - CFF requires filename 'CITATION.cff'`,
    );
  }
  const cff = {
    ...frontmatterToCFF(frontmatter, abstract),
    ...exportOptionsToCFF(exportOptions),
  };
  logMessagesFromVFile(session, vfile);
  session.log.info(toc(`📑 Exported CFF in %s, copying to ${output}`));
  writeFileToFolder(output, yaml.dump(cff));
  return { tempFolders: [] };
}
