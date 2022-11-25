import type { GenericParent } from 'myst-common';
import type { Tags } from './elementTags';

export type LinkMixin = {
  'xlink:href'?: string;
};

export type Article = GenericParent & {
  type: Tags.article;
};

export type Front = GenericParent & {
  type: Tags.front;
};

export type Body = GenericParent & {
  type: Tags.body;
};

export type Back = GenericParent & {
  type: Tags.back;
};

export type SubArticle = GenericParent & {
  type: Tags.subArticle;
  'article-type'?: string;
};

export type RefList = GenericParent & {
  type: Tags.refList;
};

export type Reference = GenericParent & {
  type: Tags.ref;
};

export type TitleGroup = GenericParent & {
  type: Tags.titleGroup;
  children: (ArtileTitle | Subtitle)[];
};

export type ArtileTitle = GenericParent & {
  type: Tags.articleTitle;
};

export type ArticleId = GenericParent & {
  type: Tags.articleId;
  'assigning-authority': string;
  'custom-type': string;
  'pub-id-type': string;
  'specific-use': string;
};

export type Subtitle = GenericParent & {
  type: Tags.subtitle;
};

export type Permissions = GenericParent & {
  type: Tags.permissions;
};

export type PubDate = GenericParent & {
  type: Tags.pubDate;
  'assigning-authority': string;
  calendar: string;
  'date-type': string;
  'iso-8601-date': string;
  'publication-format': string;
  /** @deprecated */
  'pub-type': string;
};

export type License = GenericParent &
  LinkMixin & {
    type: Tags.license;
  };

export type Abstract = GenericParent & {
  type: Tags.abstract;
  'abstract-type'?: string;
};

export type ContribGroup = GenericParent & {
  type: Tags.contribGroup;
  'content-type'?: string;
  children: (Contrib | Affiliation)[];
};

export type Contrib = GenericParent & {
  type: Tags.contrib;
  'content-type'?: string;
};

export type Affiliation = GenericParent & {
  type: Tags.aff;
};

export type KeywordGroup = GenericParent & {
  type: Tags.kwdGroup;
  'kwd-group-type'?: string;
};

export type Keyword = GenericParent & {
  type: Tags.kwd;
};
