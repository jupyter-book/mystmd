import type { GenericParent } from 'myst-common';
import { xml2js } from 'xml-js';
import type { Element, DeclarationAttributes } from 'xml-js';
import { convertToUnist, findDoi } from './utils';
import { select, selectAll } from 'unist-util-select';
import { Tags } from './types';
import type {
  Front,
  Body,
  Back,
  SubArticle,
  RefList,
  Reference,
  TitleGroup,
  ArtileTitle,
  Subtitle,
  Permissions,
  PubDate,
  License,
  Abstract,
  ContribGroup,
  Contrib,
  KeywordGroup,
  Keyword,
} from './types';

export class Jats {
  declaration?: DeclarationAttributes;
  doctype?: string;
  raw: Element;
  tree: GenericParent;

  constructor(data: string) {
    this.raw = xml2js(data, { compact: false }) as Element;
    const { declaration, elements } = this.raw;
    this.declaration = declaration?.attributes;
    if (
      !(elements?.length === 2 && elements[0].type === 'doctype' && elements[1].name === 'article')
    ) {
      throw new Error('article is not the only element of the JATS');
    }
    this.doctype = elements[0].doctype;
    this.tree = convertToUnist(elements[1]) as GenericParent;
  }

  get front(): Front {
    return select(Tags.front, this.tree) as Front;
  }

  get premissions(): Permissions {
    return select(Tags.permissions, this.front) as Permissions;
  }

  get doi(): string | null {
    return findDoi(this.front);
  }

  get publicationDates(): PubDate[] {
    return selectAll(Tags.pubDate, this.front) as PubDate[];
  }

  get publicationDate(): PubDate | undefined {
    return this.publicationDates.find((d) => !!select(Tags.day, d));
  }

  get license(): License {
    return select(Tags.license, this.premissions) as License;
  }

  get keywordGroup(): KeywordGroup {
    return select(Tags.kwdGroup, this.front) as KeywordGroup;
  }

  /** The first keywords */
  get keywords(): Keyword[] {
    return selectAll(Tags.kwd, this.keywordGroup) as Keyword[];
  }

  get keywordGroups(): KeywordGroup[] {
    return selectAll(Tags.kwdGroup, this.front) as KeywordGroup[];
  }

  get titleGroup(): TitleGroup {
    return select(Tags.titleGroup, this.front) as TitleGroup;
  }

  get articleTitle(): ArtileTitle {
    return select(Tags.articleTitle, this.titleGroup) as ArtileTitle;
  }

  get articleSubtitle(): Subtitle {
    return select(Tags.subtitle, this.titleGroup) as Subtitle;
  }

  get abstract(): Abstract {
    return select(Tags.abstract, this.front) as Abstract;
  }

  get abstracts(): Abstract[] {
    return selectAll(Tags.abstract, this.front) as Abstract[];
  }

  get contribGroup(): ContribGroup {
    return select(Tags.contribGroup, this.front) as ContribGroup;
  }

  get contribGroups(): ContribGroup[] {
    return selectAll(Tags.contribGroup, this.front) as ContribGroup[];
  }

  get articleAuthors(): Contrib[] {
    return selectAll(Tags.contrib, this.contribGroup) as Contrib[];
  }

  get body(): Body {
    return select(Tags.body, this.tree) as Body;
  }

  get back(): Back {
    return select(Tags.back, this.tree) as Back;
  }

  get subArticles(): SubArticle[] {
    return selectAll(Tags.subArticle, this.tree) as SubArticle[];
  }

  get refList(): RefList {
    return select(Tags.refList, this.back) as RefList;
  }

  get references(): Reference[] {
    return selectAll(Tags.ref, this.refList) as Reference[];
  }
}
