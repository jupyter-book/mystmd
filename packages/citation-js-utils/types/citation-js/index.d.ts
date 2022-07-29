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

  export type CitationJson = {
    id: string;
    author?: { given: string; family: string }[];
    issued: { 'date-parts': number[][] };
    publisher?: string;
    title?: string;
    'citation-key'?: string;
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
