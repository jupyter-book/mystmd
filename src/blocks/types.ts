import { BaseLinks } from '../types';

export enum KINDS {
  Content = 'Content',
  Article = 'Article',
  Code = 'Code',
  Notebook = 'Notebook',
  Output = 'Output',
  Image = 'Image',
  Navigation = 'Navigation',
  Reference = 'Reference',
}

export const DocumentKINDS = new Set([KINDS.Article, KINDS.Notebook]);

export const EditableKINDS = new Set([
  KINDS.Article,
  KINDS.Notebook,
  KINDS.Content,
  KINDS.Navigation,
]);

export enum ContentFormatTypes {
  txt = 'txt',
  html = 'html',
  md = 'md',
  rst = 'rst',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
  json = 'json',
  jupyter = 'jupyter',
}

export enum CodeFormatTypes {
  txt = 'txt',
  md = 'md',
  rst = 'rst',
  jupyter = 'jupyter',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
}

export enum ReferenceFormatTypes {
  txt = 'txt',
  bibtex = 'bibtex',
  json = 'json',
}

export enum CitationStyles {
  'apa' = 'citation-apa',
  'vancouver' = 'citation-vancouver',
  'harvard' = 'citation-harvard1',
}

export enum OutputFormatTypes {
  jupyter = 'jupyter',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
}

export enum ArticleFormatTypes {
  txt = 'txt',
  html = 'html',
  tex = 'tex',
  tex_curvenote = 'tex:curvenote',
  jupyter = 'jupyter',
  md = 'md',
  pdf = 'pdf',
}

export enum NotebookFormatTypes {
  jupyter = 'jupyter',
}

export enum ImageFormatTypes {
  png = 'png',
  gif = 'gif',
}

export enum NavigationFormatTypes {
  json = 'json',
}

export const FormatSet = new Set([
  'txt',
  'html',
  'md',
  'rst',
  'tex',
  'tex:curvenote',
  'json',
  'jupyter',
  'bibtex',
  'pdf',
]);

export type FormatTypes =
  | ContentFormatTypes
  | CodeFormatTypes
  | OutputFormatTypes
  | ArticleFormatTypes
  | NotebookFormatTypes
  | ImageFormatTypes
  | NavigationFormatTypes
  | ReferenceFormatTypes;

export type ExportableFormatTypes = ArticleFormatTypes.tex | ArticleFormatTypes.pdf;

export type Language = string;

export enum TARGET {
  JupyterMarkdown = 'jupyter.markdown',
  JupyterRaw = 'jupyter.raw',
  JupyterCode = 'jupyter.code',
  JupyterOutput = 'jupyter.output',
}

export type BlockId = {
  project: string;
  block: string;
};

export const NAV_ID = 'nav';

export type VersionId = {
  project: string;
  block: string;
  version: number | null; // TODO: WHY IS THIS NULL?!?!?!
};

export type DraftId = {
  project: string;
  block: string;
  version: number | null;
  draft: string;
};

// QUESTION: ChildName, ChildNomialId, ChildKey?
export type ChildId = string;

export const DOCUMENT_TITLE_CHILD_ID = 'DOCUMENT';
export const SINGLE_BLOCK_CHILD_ID = 'SINGLE_BLOCK_CHILD_ID';

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
  name: string | null;
  authors: Author[];
  tags: string[];
  default_draft: string | null;
  pending: string | null;
}

export interface Block extends PartialBlock {
  title: string;
  description: string;
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
  created_by: string;
  date_created: Date;
  version: number;
  published: boolean;
  parent: string | null;
  links: VersionLinks;
}

// QUESTION: LinkedBlockId, or BlockID or ChildBlockId
export type SrcId = {
  project: string;
  block: string;
  version: number | null;
  draft: string | null;
};

export type BlockChild = {
  id: ChildId;
  src: SrcId;
};

export type NotebookCodeBlockChild = {
  id: ChildId;
  src: SrcId;
  output?: SrcId;
};

export interface BlockChildDict {
  [index: string]: BlockChild | NotebookCodeBlockChild;
}

// QUESTION: Not used?
export type ChildrenAndOrder = {
  children: BlockChildDict;
  order: ChildId[];
};

export type FileMetadata = {
  size: number;
  content_type: string;
  md5: string;
};

export interface NavListItemDTO {
  id: string;
  parentId: string | null;
  title: string;
  blockId: BlockId;
}

export enum XClientName {
  app = 'Curvenote Web Client',
  ext = 'Curvenote Chrome Extension',
  python = 'Curvenote Python Client',
}

export interface Author {
  plain: string | null;
  user: string | null;
}

export enum ArtifactStatus {
  'processing' = 'processing',
  'complete' = 'complete',
  'failed' = 'failed',
}

export enum ArtifactProcessingStage {
  launching = 0,
  fetching = 10,
  building = 20,
  saving = 30,
  complete = 40,
}

export type Artifact = {
  id: string;
  format_type: FormatTypes;
  template_id: string;
  options: string;
  status_date: Date;
  status: ArtifactStatus;
  processing_stage: ArtifactProcessingStage;
  template_version?: string;
  path?: string;
  log_path?: string;
  options_path?: string;
};

export interface Message {
  data: string;
  attributes: MessageAttributes;
  [x: string]: any;
}

export interface MessageAttributes {
  job_id: string;
  user: string;
  user_auth: string;
  format: FormatTypes;
  template_id: string;
  options: string;
  project: string;
  block: string;
  version: string;
  template_version?: string;
  path?: string;
  log_path?: string;
  [x: string]: any;
}

export const TAG_ABSTRACT = 'abstract';

export enum WellKnownBlockTags {
  abstract = 'abstract',
  appendix = 'appendix',
  acknowledgments = 'acknowledgments',
  chapter = 'chapter',
  dedication = 'dedication',
  preface = 'preface',
  no_export = 'no-export',
}

export const DEFAULT_BLOCK_TAGS = Object.values(WellKnownBlockTags);

export enum ProjectTemplates {
  Blank = 'blank',
  Paper = 'paper',
  Report = 'report',
  Textbook = 'textbook',
  Thesis = 'thesis',
  Tutorial = 'tutorial',
  MeetingNotes = 'meeting_notes',
}
