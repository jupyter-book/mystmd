import path from 'path';
import fs from 'fs';
import { CitationRenderer } from 'citation-js-utils';
import { GenericNode, selectAll } from 'mystjs';
import { IDocumentCache } from '../types';
import { transformRoot } from './root';
import { transformMath } from './math';
import { transformImages } from './images';
import { transformCitations } from './citations';
import { transformOutputs } from './outputs';
import { transformEnumerators } from './enumerate';
import { transformFootnotes } from './footnotes';
import { transformKeys } from './keys';
import { Frontmatter, getFrontmatter } from '../frontmatter';
import { References, Root } from './types';
import { tic } from '../../export/utils/exec';

export { LinkLookup, transformLinks } from './links';

export interface RendererData {
  sha256: string;
  frontmatter: Frontmatter;
  mdast: Root;
  references: References;
}

/**
 * This is the {mdast} directive, that loads from disk
 * For example, tables that can't be represented in markdown.
 */
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
  const frontmatter = getFrontmatter(mdast);
  importMdastFromJson(cache, name, mdast); // This must be first!
  // The transforms from MyST (structural mostly)
  mdast = await transformRoot(mdast);
  [
    transformMath,
    transformImages,
    transformOutputs,
    transformCitations,
    transformEnumerators,
    // Footnotes must come near the END, the other transformations need happen first (citations, math, etc.)
    transformFootnotes,
    transformKeys,
  ].forEach((transformer) => {
    transformer(mdast, { references, citeRenderer, cache, frontmatter });
    cache.session.log.debug(
      toc(`Processing: "${name}" - ${transformer.name.slice(9).toLowerCase()} in %s`),
    );
  });
  if (cache.config?.site?.design?.hideAuthors) {
    delete frontmatter.authors;
  }
  const data = { frontmatter, mdast, references };
  return data;
}
