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

export type ChildId = string;

export const DOCUMENT_TITLE_CHILD_ID = 'DOCUMENT';
export const SINGLE_BLOCK_CHILD_ID = 'SINGLE_BLOCK_CHILD_ID';
