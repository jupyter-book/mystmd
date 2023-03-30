/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
// https://fettblog.eu/typescript-react-extending-jsx-elements/

declare module 'citation-js' {
  export type CitationFormatOptions = {
    format: 'string';
    type: 'html' | 'json' | 'string';
    style:
      | 'citation-apa'
      | 'citation-vancouver'
      | 'citation-harvard1'
      | 'csl'
      | 'bibtex'
      | 'bibtxt'
      | 'ris';
    lang: 'en-US' | 'fr-FR' | 'es-ES' | 'de-DE' | 'nl-NL';
  };

  // This is duplicated for export in index.ts
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

  export class Cite {
    constructor(input?: string | CitationJson);

    static parse: any;

    set(data: string | Cite): this;

    get: (opts: CitationFormatOptions) => string;

    data: CitationJson[];

    static new(): any;
  }
  export default Cite;
}
