"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCitations = exports.getInlineCitation = exports.InlineCite = exports.CitationJSStyles = exports.createSanitizer = void 0;
const citation_js_1 = __importDefault(require("citation-js"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function createSanitizer() {
    return {
        cleanCitationHtml(htmlStr) {
            return (0, sanitize_html_1.default)(htmlStr, { allowedTags: ['b', 'a', 'u', 'i'] });
        },
    };
}
exports.createSanitizer = createSanitizer;
function cleanRef(citation) {
    const sanitizer = createSanitizer();
    const cleanHtml = sanitizer.cleanCitationHtml(citation).trim();
    return cleanHtml.replace(/^1\./g, '').trim();
}
const defaultOpts = {
    format: 'string',
    type: 'json',
    style: 'ris',
    lang: 'en-US',
};
var CitationJSStyles;
(function (CitationJSStyles) {
    CitationJSStyles["apa"] = "citation-apa";
    CitationJSStyles["vancouver"] = "citation-vancouver";
    CitationJSStyles["harvard"] = "citation-harvard1";
})(CitationJSStyles = exports.CitationJSStyles || (exports.CitationJSStyles = {}));
var InlineCite;
(function (InlineCite) {
    InlineCite["p"] = "p";
    InlineCite["t"] = "t";
})(InlineCite = exports.InlineCite || (exports.InlineCite = {}));
const defaultString = {
    format: 'string',
    lang: 'en-US',
    type: 'html',
    style: CitationJSStyles.apa,
};
function getInlineCitation(c, kind) {
    var _a, _b, _c;
    const cite = new citation_js_1.default();
    const authors = cite.set(c).data[0].author;
    const year = (_c = (_b = (_a = cite.set(c).data[0].issued) === null || _a === void 0 ? void 0 : _a['date-parts']) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c[0];
    const yearPart = kind === InlineCite.t ? ` (${year})` : `, ${year}`;
    if (authors.length === 1) {
        return [{ type: 'text', value: `${authors[0].family}${yearPart}` }];
    }
    if (authors.length === 2) {
        return [
            { type: 'text', value: `${authors[0].family} & ${authors[1].family}${yearPart}` },
        ];
    }
    if (authors.length > 2) {
        return [
            { type: 'text', value: `${authors[0].family} ` },
            { type: 'emphasis', value: 'et al.' },
            { type: 'text', value: `${yearPart}` },
        ];
    }
    throw new Error('Unknown number of authors for citation');
}
exports.getInlineCitation = getInlineCitation;
function wrapWithDoiAchorTag(doiStr) {
    if (!doiStr)
        return '';
    return `<a target="_blank" rel="noreferrer" href="https://doi.org/${doiStr}">${doiStr}</a>`;
}
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
function replaceDoiWithAnchorElement(str, doi) {
    if (!str)
        return str;
    const match = str.match(URL_REGEX);
    if (!match)
        return str;
    return str.replace(URL_REGEX, wrapWithDoiAchorTag(doi));
}
function getCitations(bibtex) {
    return __awaiter(this, void 0, void 0, function* () {
        const parse = citation_js_1.default.parse.input.async.chain;
        const cite = new citation_js_1.default();
        const p = yield parse(bibtex);
        return Object.fromEntries(p.map((c) => {
            return [
                c.id,
                {
                    inline(kind = InlineCite.p) {
                        return getInlineCitation(c, kind);
                    },
                    render(style) {
                        return replaceDoiWithAnchorElement(cleanRef(cite
                            .set(c)
                            .get(Object.assign(Object.assign({}, defaultString), { style: style !== null && style !== void 0 ? style : CitationJSStyles.apa }))), c.DOI);
                    },
                    getDOI() {
                        return c.DOI || undefined;
                    },
                    cite: c,
                },
            ];
        }));
    });
}
exports.getCitations = getCitations;
//# sourceMappingURL=index.js.map