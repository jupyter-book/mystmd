/* eslint-disable @typescript-eslint/no-namespace */
import type { JsonObject } from '../types';
import type { VersionId, BlockId, Block, BasePartialVersion, FormatTypes } from './types';
import { KINDS, ContentFormatTypes } from './types';
import * as article from './article';
import * as content from './content';
import * as code from './code';
import * as notebook from './notebook';
import * as output from './output';
import * as image from './image';
import * as reference from './reference';
import * as navigation from './navigation';
import { getDate, getTags } from '../helpers';
import { extractBlockFrontMatter } from './utils';

export * from './types';
export { NotebookBlockMetadata } from './notebook';
export { srcIdToJson, extractBlockFrontMatter, extractProjectFrontMatter } from './utils';
export { createAuthor } from './author';
export { RIS } from './reference';

export const blocks: Record<
  KINDS,
  {
    // TODO firm up types
    fromDTO: (json: JsonObject) => any;
    defaultFormat: FormatTypes;
  }
> = {
  [KINDS.Content]: content,
  [KINDS.Article]: article,
  [KINDS.Code]: code,
  [KINDS.Notebook]: notebook,
  [KINDS.Output]: output,
  [KINDS.Image]: image,
  [KINDS.Navigation]: navigation,
  [KINDS.Reference]: reference,
};

export namespace Blocks {
  export type Content = content.Content;
  export type Article = article.Article;
  export type Code = code.Code;
  export type Notebook = notebook.Notebook;
  export type Output = output.Output;
  export type Image = image.Image;
  export type Navigation = navigation.Navigation;
  export type Reference = reference.Reference;
}

export namespace PartialBlocks {
  export type Content = content.PartialContent;
  export type Article = article.PartialArticle;
  export type Code = code.PartialCode;
  export type Notebook = notebook.PartialNotebook;
  export type Output = output.PartialOutput;
  export type Image = image.PartialImage;
  export type Navigation = navigation.PartialNavigation;
  export type Reference = reference.PartialReference;
}

export type ALL_CONTAINER_BLOCKS = Blocks.Article | Blocks.Notebook;

export type ALL_CONTAINER_PARTIAL_BLOCKS = PartialBlocks.Article | PartialBlocks.Notebook;

export type ALL_CONTAINER_KEYS = keyof Blocks.Article | keyof Blocks.Notebook;

export type ALL_CONTENT_BLOCKS = Blocks.Content | Blocks.Code | Blocks.Reference;
// Images and outputs do not have a content field
export type ALL_CONTENT_PARTIAL_BLOCKS =
  | PartialBlocks.Content
  | PartialBlocks.Code
  | PartialBlocks.Output
  | PartialBlocks.Image
  | PartialBlocks.Navigation;
export type ALL_CONTENT_KEYS =
  | keyof Blocks.Content
  | keyof Blocks.Code
  | keyof Blocks.Output
  | keyof Blocks.Image
  | keyof Blocks.Reference
  | keyof PartialBlocks.Navigation;

export type ALL_BLOCKS =
  | ALL_CONTAINER_BLOCKS
  | ALL_CONTENT_BLOCKS
  | Blocks.Image
  | Blocks.Output
  | Blocks.Navigation;
export type ALL_PARTIAL_BLOCKS_INTERNAL = ALL_CONTAINER_PARTIAL_BLOCKS | ALL_CONTENT_PARTIAL_BLOCKS;
export type ALL_PARTIAL_BLOCKS = ALL_PARTIAL_BLOCKS_INTERNAL & BasePartialVersion;
export type ALL_KEYS = ALL_CONTAINER_KEYS | ALL_CONTENT_KEYS;

export function blockFromDTO(blockId: BlockId, json: JsonObject): Block {
  const frontMatter = extractBlockFrontMatter(json);
  return {
    ...frontMatter,
    id: { ...blockId },
    kind: json.kind,
    name: json.name ?? null,
    pending: json.pending ?? null,
    title: json.title ?? '',
    description: json.description ?? '',
    caption: json.caption ?? '',
    hidden: json.hidden ?? false,
    published: (json.published_versions ?? []).length > 0,
    published_versions: json.published_versions ?? [],
    tags: getTags(json.tags),
    latest_version: json.latest_version ?? null,
    default_draft: json.default_draft ?? null,
    num_versions: json.num_versions ?? 0,
    num_comments: json.num_comments ?? 0,
    created_by: json.created_by ?? null,
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
  };
}

// TODO: maybe not this but factory creation at some level is needed in the clients' maybe
// but certainly helps in the tests
export function createEmptyBlock(blockId: BlockId, kind: KINDS, ...rest: any[]): Block {
  return blockFromDTO(blockId, { kind, ...rest });
}

export function partialVersionFromDTO(json: JsonObject): BasePartialVersion {
  return {
    format: json.format ?? ContentFormatTypes.html,
  };
}

export function versionFromDTO(versionId: VersionId, json: JsonObject): ALL_BLOCKS {
  if (json.kind in blocks) {
    return {
      id: { ...versionId },
      kind: json.kind,
      ...partialVersionFromDTO(json),
      published: json.published ?? false,
      ...blocks[json.kind as KINDS].fromDTO(json),
      created_by: json.created_by ?? null,
      date_created: getDate(json.date_created),
      version: json.version ?? 0,
      parent: json.parent ?? null,
      links: { ...json.links },
    } as ALL_BLOCKS;
  }
  throw new Error(`Unknown block kind: ${json.kind}`);
}

// TODO: fix return type, ALL_BLOCKS?
export function createEmptyVersion(
  versionId: VersionId,
  kind: KINDS,
  tags?: string[],
  links?: any,
): any {
  return versionFromDTO(versionId, { kind, tags, links });
}

// TODO: Remove this?
/*
  Remove all fields that are not content i.e. that exceed the PartialBlock types
*/
export function cleanDraftForPosting(draft: Partial<ALL_BLOCKS>): ALL_PARTIAL_BLOCKS {
  const data = { ...draft };
  delete data.id;
  delete data.kind;
  delete data.created_by;
  delete data.date_created;
  delete data.version;
  delete data.parent;
  delete data.links;
  return data as ALL_PARTIAL_BLOCKS;
}
