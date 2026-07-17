/* eslint-disable @typescript-eslint/prefer-namespace-keyword */
// https://fettblog.eu/typescript-react-extending-jsx-elements/
declare module '@citation-js/plugin-bibtex' {}
declare module '@citation-js/plugin-csl' {}
declare module '@citation-js/core/lib/plugins/input/csl.js' {
  export function clean(data: any): any {}
}
declare module '@citation-js/core' {
  export type OutputOptions = {
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
  export type CSL = {
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
    constructor(input?: any);

    static async(data: any): Promise<Cite>;

    set(data: any): this;

    format: (format: string, options: any) => string | object[];

    data: CSL[];
  }

  // Only declare types for used config fields
  export const plugins: {
    config: {
      get(format: string): {
        format: {
          useIdAsLabel?: boolean;
          checkLabel?: boolean;
        };
      };
    };
  };
}
