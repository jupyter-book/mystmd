import fs from 'fs';
import path from 'path';
import { GenericNode, MyST, selectAll } from 'mystjs';
import { CitationRenderer } from 'citation-js-utils';
import { IDocumentCache, Options } from './types';
import { reactiveRoles } from './roles';
import { directives } from './directives';
import { tic } from '../utils/exec';
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

function importMdastFromJson(cache: IDocumentCache, filename: string, mdast: Root) {
  const mdastNodes = selectAll('mdast', mdast) as GenericNode[];
  const loadedData: Record<string, GenericNode> = {};
  const dir = path.dirname(filename);
  mdastNodes.forEach((node) => {
    const [mdastFilename, id] = node.id.split('#');
    let data = loadedData[mdastFilename];
    if (!data) {
      data = JSON.parse(fs.readFileSync(path.join(dir, mdastFilename)).toString());
      loadedData[mdastFilename] = data;
    }
    if (!data[id]) {
      cache.session.log.error(`Mdast Node import: Could not find ${id} in ${mdastFilename}`);
      return;
    }
    // Clear the current object
    Object.keys(node).forEach((k) => {
      delete node[k];
    });
    // Replace with the import
    Object.assign(node, data[id]);
  });
}

export async function transformMdast(
  cache: IDocumentCache,
  name: string,
  mdast: Root,
  citeRenderer: CitationRenderer,
): Promise<Omit<RendererData, 'sha256'>> {
  const toc = tic();
  const references: References = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  importMdastFromJson(cache, name, mdast); // This must be first!
  // The transforms from MyST (structural mostly)
  mdast = await transformRoot(mdast);
  [
    transformMath,
    transformFootnotes,
    transformImages,
    transformOutputs,
    transformCitations,
    transformKeys,
  ].forEach((transformer) => {
    transformer(mdast, references, citeRenderer, cache);
    cache.session.log.debug(
      toc(`Processing: "${name}" - ${transformer.name.slice(9).toLowerCase()} in %s`),
    );
  });
  const frontmatter = getFrontmatter(mdast);
  if (cache.config?.site?.design?.hideAuthors) {
    delete frontmatter.author;
  }
  const data = { frontmatter, mdast, references };
  return data;
}
