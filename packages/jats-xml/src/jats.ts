import type { GenericNode, GenericParent } from 'myst-common';
import { toText } from 'myst-common';
import { xml2js } from 'xml-js';
import doi from 'doi-utils';
import type { Element, DeclarationAttributes } from 'xml-js';
import type { PageFrontmatter } from 'myst-frontmatter';
import { authorAndAffiliation, convertToUnist, findArticleId, toDate } from './utils';
import { select as unistSelect, selectAll } from 'unist-util-select';
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
  ArticleCategories,
} from './types';
import type { Logger } from 'myst-cli-utils';
import { tic } from 'myst-cli-utils';

type Options = { log?: Logger; source?: string };

function select<T extends GenericNode>(selector: string, node?: GenericNode): T | undefined {
  return (unistSelect(selector, node) ?? undefined) as T | undefined;
}

export class Jats {
  declaration?: DeclarationAttributes;
  doctype?: string;
  raw: Element;
  log?: Logger;
  tree: GenericParent;
  source?: string;

  constructor(data: string, opts?: Options) {
    const toc = tic();
    this.log = opts?.log;
    if (opts?.source) this.source = opts.source;
    try {
      this.raw = xml2js(data, { compact: false }) as Element;
    } catch (error) {
      throw new Error('Problem parsing the JATS document, please ensure it is XML');
    }
    const { declaration, elements } = this.raw;
    this.declaration = declaration?.attributes;
    if (
      !(elements?.length === 2 && elements[0].type === 'doctype' && hasSingleArticle(elements[1]))
    ) {
      throw new Error('Element <article> is not the only element of the JATS');
    }
    this.doctype = elements[0].doctype;
    const converted = convertToUnist(elements[1]);
    this.tree = select('article', converted) as GenericParent;
    this.log?.debug(toc('Parsed and converted JATS to unist tree in %s'));
  }

  get frontmatter(): PageFrontmatter {
    const title = this.articleTitle;
    const subtitle = this.articleSubtitle;
    const date = this.publicationDate;
    const authors = this.articleAuthors;
    const firstSubject = select(Tags.subject, this.articleCategories ?? this.front);
    const journalTitle = select(Tags.journalTitle, this.front);
    return {
      title: title ? toText(title) : undefined,
      subtitle: subtitle ? toText(subtitle) : undefined,
      doi: this.doi ?? undefined,
      date: date ? toDate(date)?.toISOString() : undefined,
      authors: authors?.map((a) => authorAndAffiliation(a, this.tree)),
      keywords: this.keywords?.map((k) => toText(k)),
      venue: journalTitle ? { title: toText(journalTitle) } : undefined,
      subject: firstSubject ? toText(firstSubject) : undefined,
    };
  }

  get front(): Front | undefined {
    return select<Front>(Tags.front, this.tree);
  }

  get premissions(): Permissions | undefined {
    return select<Permissions>(Tags.permissions, this.front);
  }

  get doi(): string | undefined {
    return doi.normalize(findArticleId(this.front, 'doi') ?? '');
  }

  get pmc(): string | undefined {
    return findArticleId(this.front, 'pmc')?.replace(/^PMC:?/, '');
  }

  get pmid(): string | undefined {
    return findArticleId(this.front, 'pmid');
  }

  get publicationDates(): PubDate[] {
    return selectAll(Tags.pubDate, this.front) as PubDate[];
  }

  get publicationDate(): PubDate | undefined {
    return this.publicationDates.find((d) => !!select(Tags.day, d));
  }

  get license(): License | undefined {
    return select<License>(Tags.license, this.premissions);
  }

  get keywordGroup(): KeywordGroup | undefined {
    return select<KeywordGroup>(Tags.kwdGroup, this.front);
  }

  /** The first keywords */
  get keywords(): Keyword[] {
    return selectAll(Tags.kwd, this.keywordGroup) as Keyword[];
  }

  get keywordGroups(): KeywordGroup[] {
    return selectAll(Tags.kwdGroup, this.front) as KeywordGroup[];
  }

  get articleCategories(): ArticleCategories | undefined {
    return select<ArticleCategories>(Tags.articleCategories, this.front);
  }

  get titleGroup(): TitleGroup | undefined {
    return select<TitleGroup>(Tags.titleGroup, this.front);
  }

  get articleTitle(): ArtileTitle | undefined {
    return select<ArtileTitle>(Tags.articleTitle, this.titleGroup);
  }

  get articleSubtitle(): Subtitle | undefined {
    return select<Subtitle>(Tags.subtitle, this.titleGroup);
  }

  get abstract(): Abstract | undefined {
    return select<Abstract>(Tags.abstract, this.front);
  }

  get abstracts(): Abstract[] {
    return selectAll(Tags.abstract, this.front) as Abstract[];
  }

  get contribGroup(): ContribGroup | undefined {
    return select<ContribGroup>(Tags.contribGroup, this.front);
  }

  get contribGroups(): ContribGroup[] {
    return selectAll(Tags.contribGroup, this.front) as ContribGroup[];
  }

  get articleAuthors(): Contrib[] {
    return selectAll(Tags.contrib, this.contribGroup) as Contrib[];
  }

  get body(): Body | undefined {
    return select<Body>(Tags.body, this.tree);
  }

  get back(): Back | undefined {
    return select<Back>(Tags.back, this.tree);
  }

  get subArticles(): SubArticle[] {
    return selectAll(Tags.subArticle, this.tree) as SubArticle[];
  }

  get refList(): RefList | undefined {
    return select<RefList>(Tags.refList, this.back);
  }

  get references(): Reference[] {
    return selectAll(Tags.ref, this.refList) as Reference[];
  }
}

function hasSingleArticle(element: Element): boolean {
  if (element.name === 'article') {
    return true;
  }
  if (
    element.name === 'pmc-articleset' &&
    element.elements?.length === 1 &&
    element.elements[0].name === 'article'
  ) {
    return true;
  }
  return false;
}
