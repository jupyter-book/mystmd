import type { CitationRenderer } from 'citation-js-utils';
import { getCiteData } from 'citation-js-utils';
import type { Element } from './types';

export function citeToJatsRef(key: string, cite: any): Element {
  const data = getCiteData(cite);
  const publicationType = !data.type || data.type === 'article-journal' ? 'journal' : data.type;
  const elements: Element[] = [];
  const authors: Element[] | undefined = data.author
    ?.map((author: { given?: string; family?: string }) => {
      if (!author.given && !author.family) return undefined;
      const authorChildren: Element[] = [];
      if (author.family) {
        authorChildren.push({
          type: 'element',
          name: 'surname',
          elements: [{ type: 'text', text: author.family }],
        });
      }
      if (author.given) {
        authorChildren.push({
          type: 'element',
          name: 'given-names',
          elements: [{ type: 'text', text: author.given }],
        });
      }
      const authorElem: Element = {
        type: 'element',
        name: 'name',
        elements: authorChildren,
      };
      return authorElem;
    })
    .filter((author: Element | undefined) => !!author);
  if (authors && authors.length) {
    elements.push({
      type: 'element',
      name: 'person-group',
      attributes: { 'person-group-type': 'author' },
      elements: authors,
    });
  }
  if (data.title) {
    elements.push({
      type: 'element',
      name: 'article-title',
      elements: [{ type: 'text', text: data.title }],
    });
  }
  if (data['container-title']) {
    elements.push({
      type: 'element',
      name: 'source',
      elements: [{ type: 'text', text: data['container-title'] }],
    });
  }
  const year = data.issued?.['date-parts']?.[0]?.[0];
  if (year) {
    elements.push({
      type: 'element',
      name: 'year',
      attributes: { 'iso-8601-date': year },
      elements: [{ type: 'text', text: year }],
    });
  }
  if (data.DOI) {
    elements.push({
      type: 'element',
      name: 'pub-id',
      attributes: { 'pub-id-type': 'doi' },
      elements: [{ type: 'text', text: data.DOI }],
    });
  }
  if (data.volume) {
    elements.push({
      type: 'element',
      name: 'volume',
      elements: [{ type: 'text', text: data.volume }],
    });
  }
  if (data.issue) {
    elements.push({
      type: 'element',
      name: 'issue',
      elements: [{ type: 'text', text: data.issue }],
    });
  }
  if (data.page) {
    const [firstPage, lastPage] = data.page.split('-');
    if (firstPage) {
      elements.push({
        type: 'element',
        name: 'fpage',
        elements: [{ type: 'text', text: firstPage }],
      });
    }
    if (lastPage) {
      elements.push({
        type: 'element',
        name: 'lpage',
        elements: [{ type: 'text', text: lastPage }],
      });
    }
  }
  if (data.ISSN) {
    elements.push({
      type: 'element',
      name: 'issn',
      elements: [{ type: 'text', text: data.ISSN }],
    });
  }
  return {
    type: 'element',
    name: 'ref',
    attributes: { id: key },
    elements: [
      {
        type: 'element',
        name: 'element-citation',
        attributes: { 'publication-type': publicationType },
        elements,
      },
    ],
  };
}

export function getRefList(citations?: CitationRenderer): Element[] {
  if (!citations || !Object.keys(citations).length) return [];
  const elements = Object.keys(citations)
    .sort()
    .map((key) => {
      return citeToJatsRef(key, citations[key].cite);
    });
  return [{ type: 'element', name: 'ref-list', elements }];
}

export function getFootnotes(footnotes?: Element[]): Element[] {
  if (!footnotes?.length) return [];
  return [{ type: 'element', name: 'fn-group', elements: footnotes }];
}

export function getBack(citations?: CitationRenderer, footnotes?: Element[]): Element | null {
  const elements = [
    ...getRefList(citations),
    ...getFootnotes(footnotes),
    // ack
    // app-group
    // bio
    // glossary
    // notes
  ];
  if (!elements.length) return null;
  return { type: 'element', name: 'back', elements };
}
