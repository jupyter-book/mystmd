import fs from 'fs';
import path from 'path';
import { MyST } from 'mystjs';
import { CitationRenderer } from 'citation-js-utils';
import { Options, SiteConfig } from './types';
import { reactiveRoles } from './roles';
import { directives } from './directives';
import { tic } from '../utils/exec';
import { Logger } from '../../logging';
import { Frontmatter, getFrontmatter } from './frontmatter';
import {
  References,
  Root,
  transformMath,
  transformFootnotes,
  transformKeys,
  transformImages,
  transformCitations,
  transformRoot,
  transformOutputs,
} from './transforms';

export function serverPath(opts: Options) {
  const buildPath = opts.buildPath || '_build';
  return `${buildPath}/web`;
}

export function publicPath(opts: Options) {
  return path.join(serverPath(opts), 'public');
}

export function exists(opts: Options) {
  return fs.existsSync(serverPath(opts));
}

export function ensureBuildFolderExists(opts: Options) {
  if (!exists(opts)) fs.mkdirSync(serverPath(opts), { recursive: true });
}

export function writeFileToFolder(filename: string, data: string | NodeJS.ArrayBufferView) {
  if (!fs.existsSync(filename)) fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data);
}

export function parseMyst(content: string) {
  const myst = new MyST({
    roles: { ...reactiveRoles },
    directives: { ...directives },
  });
  return myst.parse(content);
}

export interface RendererData {
  sha256: string;
  frontmatter: Frontmatter;
  mdast: Root;
  references: References;
}

export async function transformMdast(
  log: Logger,
  config: SiteConfig | null,
  name: string,
  mdast: Root,
  citeRenderer: CitationRenderer,
): Promise<Omit<RendererData, 'sha256'>> {
  const toc = tic();
  const references: References = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  mdast = await transformRoot(mdast);
  [
    transformMath,
    transformFootnotes,
    transformImages,
    transformOutputs,
    transformCitations,
    transformKeys,
  ].forEach((transformer) => {
    transformer(mdast, references, citeRenderer);
    log.debug(toc(`Processing: "${name}" - ${transformer.name.slice(9).toLowerCase()} in %s`));
  });
  const frontmatter = getFrontmatter(mdast);
  if (config?.site?.design?.hideAuthors) {
    delete frontmatter.author;
  }
  const data = { frontmatter, mdast, references };
  return data;
}
