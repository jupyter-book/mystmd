import { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';

export type CommentId = {
  project: string;
  block: string;
  comment: string;
};

export interface CommentLinks extends BaseLinks {
  block: string;
}

export interface PartialComment {
  id: CommentId;
  resolved: boolean;
  content: string;
  parent: string | null;
}

export interface Comment extends PartialComment {
  created_by: string;
  resolved: boolean;
  resolved_by: string | null;
  edited: boolean;
  parent: string | null;
  children: string[];
  date_created: Date;
  date_modified: Date;
  links: CommentLinks;
  // version: id;
  // quote?
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
  };
}
