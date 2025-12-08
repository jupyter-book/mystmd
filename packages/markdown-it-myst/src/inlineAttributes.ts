import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import { nestedPartToTokens } from './nestedParse.js';
import type Token from 'markdown-it/lib/token.js';

export type InlineAttributes = {
  name: string;
  id?: string;
  classes?: string[];
  attrs?: Record<string, string>;
};

/**
 * Tokenizes the inline-attributes header into:
 *   - `.className` => { kind: 'class', value: string }
 *   - `#something` => { kind: 'id', value: string } (relaxed to match digits too)
 *   - `key="someValue"` => { kind: 'attr', key, value }
 *   - leftover / bare => { kind: 'bare', value }
 */
export function tokenizeInlineAttributes(header: string) {
  // This pattern uses five alternations:
  // 1)  (\.[A-Za-z0-9_-]+)                     => matches `.className`
  // 2)  (#[A-Za-z0-9_-]+)                      => matches `#id` (relaxed to allow digits)
  // 3)  ([a-zA-Z0-9_-]+)="((?:\\.|[^\\"])*)"   => matches key="value" with possible escapes
  // 4)  ([a-zA-Z0-9_-]+)=([^\s"']+)            => matches key=value (unquoted values without spaces)
  // 5)  ([A-Za-z0-9_:-]+)                      => matches bare tokens
  // b)  ([^\s]+)                               => matches unknown tokens
  const pattern =
    /(\.[A-Za-z0-9_-]+(?:\s|$))|(#[A-Za-z0-9_-]+(?:\s|$))|([a-zA-Z0-9_-]+)="((?:\\.|[^\\"])*)"(?:\s|$)|([a-zA-Z0-9_-]+)=([^\s"']+)(?:\s|$)|([A-Za-z0-9_:-]+)(?:\s|$)|([^\s]+)/g;

  const results: Array<
    | { kind: 'class'; value: string }
    | { kind: 'id'; value: string }
    | { kind: 'attr'; key: string; value: string }
    | { kind: 'bare'; value: string }
    | { kind: 'unknown'; value: string }
  > = [];

  let match;
  while ((match = pattern.exec(header)) !== null) {
    const [
      ,
      classGroup,
      idGroup,
      attrKeyQuoted,
      attrValQuoted,
      attrKeyUnquoted,
      attrValUnquoted,
      bareGroup,
      unknownGroup,
    ] = match;

    if (classGroup) {
      results.push({ kind: 'class', value: classGroup.slice(1).trim() });
    } else if (idGroup) {
      results.push({ kind: 'id', value: idGroup.slice(1).trim() });
    } else if (attrKeyQuoted && attrValQuoted !== undefined) {
      // unescape any \" within the quoted attribute value
      const unescaped = attrValQuoted.replace(/\\"/g, '"').trim();
      results.push({ kind: 'attr', key: attrKeyQuoted, value: unescaped });
    } else if (attrKeyUnquoted && attrValUnquoted !== undefined) {
      results.push({ kind: 'attr', key: attrKeyUnquoted, value: attrValUnquoted.trim() });
    } else if (bareGroup) {
      results.push({ kind: 'bare', value: bareGroup.trim() });
    } else if (unknownGroup) {
      results.push({ kind: 'unknown', value: unknownGroup.trim() });
    }
  }

  return results;
}

export function inlineOptionsToTokens(
  header: string,
  lineNumber: number,
  state: StateCore,
): { name?: string; tokens: Token[]; options: [string, string][] } {
  // Tokenize
  const tokens = tokenizeInlineAttributes(header);

  if (tokens.length === 0) {
    throw new Error('No inline tokens found');
  }

  // The first token should be a “bare” token => the name
  // If no bare token is included, then the name is undefined
  let name = undefined;
  if (tokens[0].kind === 'bare') {
    name = tokens[0].value;
    tokens.shift();
  }

  if (tokens.filter(({ kind }) => kind === 'id').length > 1) {
    throw new Error('Cannot have more than one ID defined');
  }
  if (tokens.some(({ kind }) => kind === 'bare')) {
    throw new Error('No additional bare tokens allowed after the first token');
  }

  const markdownItTokens = tokens.map((opt) => {
    if (opt.kind === 'id' && /^[0-9]/.test(opt.value)) {
      throw new Error(`ID cannot start with a number: "${opt.value}"`);
    }
    if (opt.kind === 'unknown') {
      if (opt.value.match(/\.[A-Za-z0-9_\-.]+/)) {
        // Throw a nice error about unknown classes that are missing spaces
        throw new Error(
          `Unknown token "${opt.value}". Classes must be separated by spaces, try "${opt.value.replace(/\./g, ' .').trim()}"`,
        );
      }
      throw new Error(`Unknown token "${opt.value}"`);
    }
    if (opt.kind === 'class' || opt.kind === 'id' || opt.kind === 'bare') {
      const classTokens = [
        new state.Token('myst_option_open', '', 1),
        new state.Token('myst_option_close', '', -1),
      ];
      classTokens[0].info = opt.kind;
      classTokens[0].content =
        opt.kind === 'class' ? `.${opt.value}` : opt.kind === 'id' ? `#${opt.value}` : opt.value;
      classTokens[0].meta = { location: 'inline', ...opt };
      return classTokens;
    }

    const optTokens = nestedPartToTokens(
      'myst_option',
      opt.value,
      lineNumber,
      state,
      'run_roles',
      true,
    );
    if (optTokens.length) {
      optTokens[0].info = opt.key;
      optTokens[0].content = opt.value;
      optTokens[0].meta = { location: 'inline', ...opt };
    }
    return optTokens;
  });
  const options = tokens.map((t): [string, string] => [
    t.kind === 'attr' ? t.key : t.kind === 'id' ? 'label' : t.kind,
    t.value,
  ]);
  return { name, tokens: markdownItTokens.flat(), options };
}
