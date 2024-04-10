import type { OutputOptions } from '@citation-js/core';
import { Cite } from '@citation-js/core';
import { clean as cleanCSL } from '@citation-js/core/lib/plugins/input/csl.js';
import sanitizeHtml from 'sanitize-html';

import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

const DOI_IN_TEXT = /(10.\d{4,9}\/[-._;()/:A-Z0-9]*[A-Z0-9])/i;

// This is duplicated in citation-js types, which are not exported
export type CSL = {
  type?: 'article-journal' | string;
  id: string;
  author?: { given: string; family: string; literal?: string }[];
  issued?: { 'date-parts'?: number[][]; literal?: string };
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
  return cleanHtml.replace(/^1\./g, '').replace(/&amp;/g, '&').trim();
}

export enum CitationJSStyles {
  'apa' = 'citation-apa',
  'vancouver' = 'citation-vancouver',
  'harvard' = 'citation-harvard1',
}

export enum InlineCite {
  'p' = 'p',
  't' = 't',
}

const defaultOptions: Record<string, string> = {
  lang: 'en-US',
  type: 'html',
  style: CitationJSStyles.apa,
};

export function yearFromCitation(data: CSL) {
  let year: number | string | undefined = data.issued?.['date-parts']?.[0]?.[0];
  if (year) return year;
  year = data.issued?.['literal']?.match(/\b[12][0-9]{3}\b/)?.[0];
  if (year) return year;
  return 'n.d.';
}

export function getInlineCitation(data: CSL, kind: InlineCite, opts?: InlineOptions) {
  let authors = data.author;
  if (!authors || authors.length === 0) {
    authors = data.editor;
  }
  const year = yearFromCitation(data);
  const prefix = opts?.prefix ? `${opts.prefix} ` : '';
  const suffix = opts?.suffix ? `, ${opts.suffix}` : '';
  let yearPart = kind === InlineCite.t ? ` (${year}${suffix})` : `, ${year}${suffix}`;

  if (opts?.partial === 'author') yearPart = '';
  if (opts?.partial === 'year') {
    const onlyYear = kind === InlineCite.t ? `(${year}${suffix})` : `${year}${suffix}`;
    return [{ type: 'text', value: onlyYear }];
  }

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
      { type: 'text', value: `${prefix}${authors[0].family ?? authors[0].literal} ` },
      { type: 'emphasis', children: [{ type: 'text', value: 'et al.' }] },
      { type: 'text', value: `${yearPart}` },
    ];
  }
  throw new Error('Unknown number of authors for citation');
}

export type InlineOptions = { prefix?: string; suffix?: string; partial?: 'author' | 'year' };

export type CitationRenderer = Record<
  string,
  {
    render: (style?: CitationJSStyles) => string;
    inline: (kind?: InlineCite, opts?: InlineOptions) => InlineNode[];
    getDOI: () => string | undefined;
    getURL: () => string | undefined;
    cite: CSL;
    exportBibTeX: () => string;
  }
>;

function doiUrl(doi?: string) {
  return doi ? `https://doi.org/${doi}` : undefined;
}

function wrapWithAnchorTag(url: string, text?: string) {
  if (!url) return '';
  return `<a target="_blank" rel="noreferrer" href="${url}">${text ?? url}</a>`;
}

function wrapWithDoiAnchorTag(doi?: string) {
  const url = doiUrl(doi);
  if (!url) return '';
  return wrapWithAnchorTag(url, doi);
}

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;

function replaceUrlsWithAnchorElement(str?: string, doi?: string) {
  if (!str) return '';
  const matches = [...str.matchAll(URL_REGEX)];
  let newStr = str;
  matches.forEach((match) => {
    if (doi && match[0].includes(doi)) {
      newStr = newStr.replace(match[0], wrapWithDoiAnchorTag(doi));
    } else {
      newStr = newStr.replace(match[0], wrapWithAnchorTag(match[0]));
    }
  });
  return newStr;
}

export function firstNonDoiUrl(str?: string, doi?: string) {
  if (!str) return;
  const matches = [...str.matchAll(URL_REGEX)];
  return matches.map((match) => match[0]).find((match) => !doi || !match.includes(doi));
}

/**
 * Parse a citation style of the form `citation-<style>` into its `<style>`
 *
 * @param style: citation style string
 */
function parseCitationStyle(style: string): string {
  const [styleType, styleFormat] = style.split('-');
  if (styleType !== 'citation') {
    throw new Error(`unexpected citation style: ${style}`);
  }
  return styleFormat;
}

/**
 * Parse a BibTeX string into an array of CSL items
 *
 * @param source - BibTeX string
 *
 */
export function parseBibTeX(source: string): CSL[] {
  return new Cite(source).data;
}

/**
 * Parse CSL-JSON into an array of "clean" CSL items
 *
 * @param source - array of unclean CSL items
 */
export function parseCSLJSON(source: object[]): CSL[] {
  return cleanCSL(source);
}

/**
 * Compatability shim for existing callers of getCitations
 * Replaced by getCitationRenderers
 *
 * @param bibtex - BibTeX string
 */
export async function getCitations(bibtex: string): Promise<CitationRenderer> {
  const csl = parseBibTeX(bibtex);
  return await getCitationRenderers(csl);
}

/**
 * Build renderers for the given array of CSL items
 *
 * @param data - array of CSL items
 */
export async function getCitationRenderers(data: CSL[]): Promise<CitationRenderer> {
  const cite = new Cite();
  return Object.fromEntries(
    data.map((c): [string, CitationRenderer[0]] => {
      const matchDoi = c.URL?.match(DOI_IN_TEXT) ?? c.note?.match(DOI_IN_TEXT);
      if (!c.DOI && matchDoi) {
        c.DOI = matchDoi[0];
      }
      return [
        c.id,
        {
          inline(kind = InlineCite.p, opts) {
            return getInlineCitation(c, kind, opts);
          },
          render(style?: CitationJSStyles) {
            return replaceUrlsWithAnchorElement(
              cleanRef(
                cite.set(c).format('bibliography', {
                  template: parseCitationStyle(style ?? (CitationJSStyles.apa as string)),
                  format: 'html',
                  lang: 'en-US',
                }) as string,
              ),
              c.DOI,
            );
          },
          getDOI(): string | undefined {
            return c.DOI || undefined;
          },
          getURL(): string | undefined {
            return (
              firstNonDoiUrl(
                cleanRef(
                  cite.set(c).format('bibliography', {
                    template: parseCitationStyle(CitationJSStyles.apa as string),
                    format: 'html',
                    lang: 'en-US',
                  }) as string,
                ),
                c.DOI,
              ) ?? doiUrl(c.DOI)
            );
          },
          cite: c,
          exportBibTeX(): string {
            return cite.set(c).format('bibtex', { format: 'text' }) as string;
          },
        },
      ];
    }),
  );
}
