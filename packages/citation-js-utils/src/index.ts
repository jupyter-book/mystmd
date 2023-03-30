import type { CitationFormatOptions } from 'citation-js';
import Cite from 'citation-js';
import sanitizeHtml from 'sanitize-html';

// This is duplicated in citation-js types, which are not exported
export type CitationJson = {
  type?: 'article-journal' | string;
  id: string;
  author?: { given: string; family: string }[];
  issued?: { 'date-parts': number[][] };
  publisher?: string;
  title?: string;
  'citation-key'?: string;
  'container-title'?: string;
  abstract?: string;
  DOI?: string;
  ISBN?: string;
  ISSN?: string;
  issue?: string;
  keyword?: string;
  page?: string;
  volume?: string;
} & Record<string, any>;

export type InlineNode = {
  type: string;
  value?: string;
  children?: InlineNode[];
};

export function createSanitizer() {
  return {
    cleanCitationHtml(htmlStr: string) {
      return sanitizeHtml(htmlStr, { allowedTags: ['b', 'a', 'u', 'i'] });
    },
  };
}

function cleanRef(citation: string) {
  const sanitizer = createSanitizer();
  const cleanHtml = sanitizer.cleanCitationHtml(citation).trim();
  return cleanHtml.replace(/^1\./g, '').trim();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultOpts: CitationFormatOptions = {
  format: 'string',
  type: 'json',
  style: 'ris',
  lang: 'en-US',
};

export enum CitationJSStyles {
  'apa' = 'citation-apa',
  'vancouver' = 'citation-vancouver',
  'harvard' = 'citation-harvard1',
}

export enum InlineCite {
  'p' = 'p',
  't' = 't',
}

const defaultString: CitationFormatOptions = {
  format: 'string',
  lang: 'en-US',
  type: 'html',
  style: CitationJSStyles.apa,
};

export function getInlineCitation(data: CitationJson, kind: InlineCite, opts?: InlineOptions) {
  let authors = data.author;
  if (!authors || authors.length === 0) {
    authors = data.editor;
  }
  const year = data.issued?.['date-parts']?.[0]?.[0];
  const prefix = opts?.prefix ? `${opts.prefix} ` : '';
  const suffix = opts?.suffix ? `, ${opts.suffix}` : '';
  const yearPart = kind === InlineCite.t ? ` (${year}${suffix})` : `, ${year}${suffix}`;

  if (!authors || authors.length === 0) {
    const text = data.publisher || data.title;
    return [{ type: 'text', value: `${prefix}${text}${yearPart}` }];
  }

  if (authors.length === 1) {
    return [{ type: 'text', value: `${prefix}${authors[0].family}${yearPart}` }];
  }
  if (authors.length === 2) {
    return [
      { type: 'text', value: `${prefix}${authors[0].family} & ${authors[1].family}${yearPart}` },
    ];
  }
  if (authors.length > 2) {
    return [
      { type: 'text', value: `${prefix}${authors[0].family} ` },
      { type: 'emphasis', children: [{ type: 'text', value: 'et al.' }] },
      { type: 'text', value: `${yearPart}` },
    ];
  }
  throw new Error('Unknown number of authors for citation');
}

export type InlineOptions = { prefix?: string; suffix?: string };

export type CitationRenderer = Record<
  string,
  {
    render: (style?: CitationJSStyles) => string;
    inline: (kind?: InlineCite, opts?: InlineOptions) => InlineNode[];
    getDOI: () => string | undefined;
    cite: CitationJson;
  }
>;

function wrapWithDoiAchorTag(doiStr: string) {
  if (!doiStr) return '';
  return `<a target="_blank" rel="noreferrer" href="https://doi.org/${doiStr}">${doiStr}</a>`;
}

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

function replaceDoiWithAnchorElement(str: string, doi: string) {
  if (!str) return str;
  const match = str.match(URL_REGEX);
  if (!match) return str;
  return str.replace(URL_REGEX, wrapWithDoiAchorTag(doi));
}

export async function getCitations(bibtex: string): Promise<CitationRenderer> {
  const parse = Cite.parse.input.async.chain;
  const cite = new Cite();
  const p = await parse(bibtex);

  return Object.fromEntries(
    p.map((c: any): [string, CitationRenderer[0]] => {
      return [
        c.id,
        {
          inline(kind = InlineCite.p, opts) {
            return getInlineCitation(c, kind, opts);
          },
          render(style?: CitationJSStyles) {
            return replaceDoiWithAnchorElement(
              cleanRef(cite.set(c).get({ ...defaultString, style: style ?? CitationJSStyles.apa })),
              c.DOI,
            );
          },
          getDOI(): string | undefined {
            return c.DOI || undefined;
          },
          cite: c,
        },
      ];
    }),
  );
}
