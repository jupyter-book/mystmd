import type { CitationRenderer } from 'citation-js-utils';
import type { Element } from './types';

export function getRefList(citations?: CitationRenderer): Element[] {
  if (!citations || !Object.keys(citations).length) return [];
  return [{ type: 'element', name: 'ref-list', elements: [] }];
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
