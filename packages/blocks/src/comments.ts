import { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';
import { BlockId } from './blocks/types';

export interface CommentId {
  project: string;
  block: string;
  comment: string;
}

export interface CommentLinks extends BaseLinks {
  block: string;
}

export interface DecorationRange {
  from: number;
  to: number;
}

export interface CommentContext {
  container: BlockId;
  text: string | null;
  version: number | null;
  draft: string | null;
  step: number | null;
  ranges: DecorationRange[];
}

export interface PartialComment {
  id: CommentId;
  resolved: boolean;
  content: string;
  parent: string | null;
  context: CommentContext;
}

export interface Comment extends PartialComment {
  created_by: string;
  resolved: boolean;
  resolved_by: string | null;
  edited: boolean;
  children: string[];
  date_created: Date;
  date_modified: Date;
  links: CommentLinks;
}

export function inlineContextFromDTO(commentId: CommentId, data?: JsonObject): CommentContext {
  const container = data?.container
    ? { project: data.container.project, block: data.container.block }
    : { project: commentId.project, block: commentId.block };
  if (!data)
    return {
      container,
      text: null,
      version: null,
      draft: null,
      step: null,
      ranges: [],
    };
  const ranges = (data.ranges as DecorationRange[])?.map(({ from, to }) => ({ from, to })) ?? [];
  return {
    container,
    text: data.text,
    version: data.version ?? null,
    draft: data.draft ?? null,
    step: data.step ?? null,
    ranges,
  };
}

export function commentFromDTO(commentId: CommentId, json: JsonObject): Comment {
  return {
    id: { ...commentId },
    created_by: json.created_by ?? '',
    content: json.content ?? '',
    resolved: json.resolved ?? false,
    resolved_by: json.resolved_by ?? '',
    edited: json.edited ?? false,
    parent: json.parent ?? null,
    children: json.children ?? [],
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
    context: inlineContextFromDTO(commentId, json.context),
  };
}
