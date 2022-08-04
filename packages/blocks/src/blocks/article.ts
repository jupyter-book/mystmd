import { JsonObject } from '../types';
import { KINDS, ChildId, BlockChildDict, BaseVersion, ArticleFormatTypes } from './types';
import { getDate } from '../helpers';

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
