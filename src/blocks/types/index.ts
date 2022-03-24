import { BaseLinks } from '../../types';
import { Author } from './author';
import { FormatTypes } from './format';
import { BlockId, ChildId, VersionId } from './id';
import { KINDS } from './kind';

export * from './id';
export * from './kind';
export * from './format';
export * from './author';
export * from './misc';
export * from './jupyter';
export * from './messages';

export interface BlockLinks extends BaseLinks {
  project: string;
  comments: string;
  versions: string;
  created_by: string;
  drafts: string;
  thumbnail?: string;
  default_draft?: string;
  latest?: string;
  published?: string;
}
export interface VersionLinks extends BaseLinks {
  download: string;
  project: string;
  block: string;
  versions: string;
  created_by: string;
  drafts: string;
  parent?: string;
  output?: string;
  artifacts?: {
    tex?: string;
    pdf?: string;
  };
}

export interface PartialBlock {
  id: BlockId;
  kind: KINDS;
  title: string;
  description: string;
  caption: string | null;
  name: string | null;
  authors: Author[];
  tags: string[];
  default_draft: string | null;
  pending: string | null;
}

export interface Block extends PartialBlock {
  published: boolean;
  published_versions: number[];
  latest_version: number | null;
  num_versions: number;
  num_comments: number;
  created_by: string;
  date_created: Date;
  date_modified: Date;
  links: BlockLinks;
}

export interface BasePartialVersion {
  format: FormatTypes;
}

export interface BaseVersion extends BasePartialVersion {
  id: VersionId;
  kind: KINDS;
  title: string;
  description: string;
  caption: string | null;
  created_by: string;
  date_created: Date;
  version: number;
  published: boolean;
  parent: string | null;
  links: VersionLinks;
}

export type SrcId = {
  project: string;
  block: string;
  version: number | null;
  draft: string | null;
};

export type Alignment = 'left' | 'center' | 'right';

export interface FigureStyles {
  width?: number;
  align?: Alignment;
  numbered?: boolean;
  caption?: boolean;
}

export interface FigureFormatOptions {
  figures?: FigureStyles & { label?: string };
}

export type FormatOptions = FigureFormatOptions;

export type BlockChild = {
  id: ChildId;
  src: SrcId;
  style: FigureStyles | null;
};

export type NotebookCodeBlockChild = BlockChild & {
  output?: SrcId;
};

export interface BlockChildDict {
  [index: string]: BlockChild | NotebookCodeBlockChild;
}

export type ChildrenAndOrder = {
  children: BlockChildDict;
  order: ChildId[];
};

export enum NavListItemKindEnum {
  Group = 'group',
  Item = 'item',
}

export interface NavListGroupItemDTO {
  id: string;
  kind: NavListItemKindEnum.Group;
  title: string;
}

export interface NavListBlockItemDTO {
  id: string;
  kind: NavListItemKindEnum.Item;
  title: string;
  parentId: string | null;
  blockId: BlockId;
}

export type NavListItemDTO = NavListBlockItemDTO | NavListGroupItemDTO;

export type Language = string;
