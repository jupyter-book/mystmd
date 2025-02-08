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
  // This pattern uses four alternations:
  // 1)  (\.[A-Za-z0-9_-]+)           => matches `.className`
  // 2)  (#[A-Za-z0-9_:.~-]+)         => matches `#id` (relaxed to allow digits)
  // 3)  ([a-zA-Z0-9_:.-]+)="((?:\\.|[^\\"])*)" => matches key="value" with possible escapes
  // 4)  ([^\s]+)                      => matches leftover / bare tokens
  const pattern =
    /(\.[A-Za-z0-9_-]+)|(#[A-Za-z0-9_:.~-]+)|([a-zA-Z0-9_:.-]+)="((?:\\.|[^\\"])*)"|([^\s]+)/g;

  const results: Array<
    | { kind: 'class'; value: string }
    | { kind: 'id'; value: string }
    | { kind: 'attr'; key: string; value: string }
    | { kind: 'bare'; value: string }
  > = [];

  let match;
  while ((match = pattern.exec(header)) !== null) {
    const [, classGroup, idGroup, attrKey, attrVal, bareGroup] = match;

    if (classGroup) {
      results.push({ kind: 'class', value: classGroup.slice(1) });
    } else if (idGroup) {
      results.push({ kind: 'id', value: idGroup.slice(1) });
    } else if (attrKey && attrVal !== undefined) {
      // unescape any \" within the attribute value
      const unescaped = attrVal.replace(/\\"/g, '"');
      results.push({ kind: 'attr', key: attrKey, value: unescaped });
    } else if (bareGroup) {
      results.push({ kind: 'bare', value: bareGroup });
    }
  }

  return results;
}

export function inlineOptionsToTokens(
  header: string,
  lineNumber: number,
  state: StateCore,
): { name: string; tokens: Token[] } {
  let name = '';
  // 1) Tokenize
  const tokens = tokenizeInlineAttributes(header);

  // 2) The first token must be a “bare” token => the role name
  if (tokens.length === 0 || tokens[0].kind !== 'bare') {
    throw new Error('Missing mandatory role name as the first token');
  }
  name = tokens[0].value;
  tokens.shift();

  if (tokens.filter(({ kind }) => kind === 'id').length > 1) {
    // TODO: change this to a warning and take the last ID
    throw new Error('Cannot have more than one ID defined');
  }
  if (tokens.some(({ kind }) => kind === 'bare')) {
    // TODO: Choose to open this up to boolean attributes
    throw new Error('No additional bare tokens allowed after the first token');
  }

  const markdownItTokens = tokens.map((opt) => {
    if (opt.kind === 'id' && /^[0-9]/.test(opt.value)) {
      throw new Error(`ID cannot start with a number: "${opt.value}"`);
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

    // lineNumber mapping assumes each option is only one line;
    // not necessarily true for yaml options.
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
  return { name, tokens: markdownItTokens.flat() };
}
