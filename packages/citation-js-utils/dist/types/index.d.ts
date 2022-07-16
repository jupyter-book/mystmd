import Cite from 'citation-js';
export declare type InlineNode = {
    type: string;
    value?: string;
    children?: InlineNode[];
};
export declare function createSanitizer(): {
    cleanCitationHtml(htmlStr: string): string;
};
export declare enum CitationJSStyles {
    'apa' = "citation-apa",
    'vancouver' = "citation-vancouver",
    'harvard' = "citation-harvard1"
}
export declare enum InlineCite {
    'p' = "p",
    't' = "t"
}
export declare function getInlineCitation(c: Cite, kind: InlineCite): {
    type: string;
    value: string;
}[];
export declare type CitationRenderer = Record<string, {
    render: (style?: CitationJSStyles) => string;
    inline: (kind?: InlineCite) => InlineNode[];
    getDOI: () => string | undefined;
    cite: any;
}>;
export declare function getCitations(bibtex: string): Promise<CitationRenderer>;
