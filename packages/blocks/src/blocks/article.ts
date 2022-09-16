import { getDate } from 'simple-validators';
import type { JsonObject } from '../types';
import type { KINDS, ChildId, BlockChildDict, BaseVersion } from './types';
import { ArticleFormatTypes } from './types';

export interface PartialArticle {
  date: Date;
  order: ChildId[];
  children: BlockChildDict;
}

export interface Article extends BaseVersion, PartialArticle {
  kind: typeof KINDS.Article;
}

export const defaultFormat = ArticleFormatTypes.html;

export function fromDTO(dto: JsonObject): PartialArticle {
  return {
    date: getDate(dto.date),
    order: [...(dto?.order ?? [])],
    children: { ...dto.children },
  };
}
