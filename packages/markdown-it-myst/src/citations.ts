/**
 * @license
 * citations.js file is adapted from `markdown-it-citations` (Sept 2023)
 * MIT License - Martin Ring <@martinring>
 * https://github.com/martinring/markdown-it-citations
 */

// Follows syntax from pandoc:
// https://pandoc.org/chunkedhtml-demo/8.20-citation-syntax.html

import type { PluginWithOptions } from 'markdown-it';
import type Token from 'markdown-it/lib/token.js';

type CiteKind = 'narrative' | 'parenthetical';
type CitePartial = 'author' | 'year';

export interface Citation {
  label: string;
  kind: CiteKind;
  partial?: CitePartial;
  prefix?: Token[];
  suffix?: Token[];
}

export const citationsPlugin: PluginWithOptions = (md) => {
  const regexes = {
    citation: /^([^^-]|[^^].+?)?(-)?@([\w][\w:.#$%&\-+?<>~/]*)(.+)?$/,
    inText: /^@((?:[\w|{][\w:.#$%&\-+?<>~/]*[\w|}])|\w)(\s*)(\[)?/,
    allowedBefore: /^[^a-zA-Z.0-9]$/,
  };

  md.inline.ruler.after('emphasis', 'citation', (state, silent) => {
    // const max = state.posMax;
    const char = state.src.charCodeAt(state.pos);
    if (
      char == 0x40 /* @ */ &&
      (state.pos == 0 || regexes.allowedBefore.test(state.src.slice(state.pos - 1, state.pos)))
    ) {
      // in-text
      const match = state.src.slice(state.pos).match(regexes.inText);
      if (match) {
        const citation: Citation = {
          label: trimBraces(match[1]),
          kind: 'narrative',
        };
        let token: Token | undefined;
        if (!silent) {
          token = state.push('cite', 'cite', 0);
          token.meta = citation;
          (token as any).col = [state.pos];
        }
        if (match[3]) {
          // suffix is there
          const suffixStart = state.pos + match[0].length;
          const suffixEnd = state.md.helpers.parseLinkLabel(state, suffixStart);
          const charAfter = state.src.codePointAt(suffixEnd + 1);
          if (suffixEnd > 0 && charAfter != 0x28 && charAfter != 0x5b /* ( or [ */) {
            const suffix = state.src.slice(suffixStart, suffixEnd);
            citation.suffix = state.md.parseInline(suffix, state.env);
            state.pos += match[0].length + suffixEnd - suffixStart + 1;
            if (token) {
              token.content = match[0] + suffix + ']';
              (token as any).col.push(state.pos);
            }
          } else {
            state.pos += match[0].length - match[2].length - match[3].length;
            if (token) {
              token.content = match[0];
              (token as any).col.push(state.pos);
            }
          }
        } else {
          state.pos += match[0].length - match[2].length;
          if (token) {
            token.content = match[0];
            (token as any).col.push(state.pos);
          }
        }
        return true;
      }
    } else if (char == 0x5b /* [ */) {
      const end = state.md.helpers.parseLinkLabel(state, state.pos);
      const charAfter = state.src.codePointAt(end + 1);
      if (end > 0 && charAfter != 0x28 && charAfter != 0x5b) {
        const str = state.src.slice(state.pos + 1, end);
        const parts = str.split(';').map((x) => x.match(regexes.citation));
        if (parts.indexOf(null) >= 0) return false;
        let curCol = state.pos + 1;
        const cites = (parts as RegExpMatchArray[]).map(
          (x): Citation & { content: string; col: number[] } => {
            // remove the punctuation from the suffix if it exists
            const suffix = x[4] ? x[4].trim().replace(/^,[\s]*/, '') : undefined;
            const colEnd = curCol + x[0].length;
            const meta = {
              label: trimBraces(x[3]),
              kind: 'parenthetical' as CiteKind,
              prefix: x[1]?.trim() ? state.md.parseInline(x[1]?.trim(), state.env) : undefined,
              suffix: suffix ? state.md.parseInline(suffix, state.env) : undefined,
              partial: x[2] ? ('year' as CitePartial) : undefined,
              content: x[0].trim(),
              col: [curCol, colEnd],
            };
            curCol = colEnd + 1;
            return meta;
          },
        );
        if (!silent) {
          const token = state.push('cite_group_open', 'span', 1);
          token.content = '[';
          token.meta = { kind: 'parenthetical' };
          cites.forEach((citation) => {
            const { content, col, ...meta } = citation;
            const cite = state.push('cite', 'cite', 0);
            cite.content = content;
            (cite as any).col = col;
            cite.meta = meta;
          });
          const close = state.push('cite_group_close', 'span', -1);
          close.content = ']';
        }
        state.pos = end + 1;
        return true;
      }
      return false;
    }
    return false;
  });
};

function trimBraces(label: string): string {
  return label.replace(/^\{(.*)\}$/, '$1');
}
