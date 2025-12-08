import type MarkdownIt from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import type Token from 'markdown-it/lib/token.js';

/** Perform a nested parse upto and including a particular ruleName
 *
 * The main use for this function is to perform nested parses
 * upto but not including inline parsing.
 */
export function nestedCoreParse(
  md: MarkdownIt,
  pluginRuleName: string,
  src: string,
  env: any,
  initLine: number,
  includeRule = true,
  inline: boolean,
): Token[] {
  // disable all core rules after pluginRuleName
  const tempDisabledCore: string[] = [];
  // TODO __rules__ is currently not exposed in typescript, but is the only way to get the rule names,
  // since md.core.ruler.getRules('') only returns the rule functions
  // we should upstream a getRuleNames() function or similar
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore TS2339
  for (const rule of [...md.core.ruler.__rules__].reverse()) {
    if (rule.name === pluginRuleName) {
      if (!includeRule) {
        tempDisabledCore.push(rule.name);
      }
      break;
    }
    if (rule.name) {
      tempDisabledCore.push(rule.name);
    }
  }

  md.core.ruler.disable(tempDisabledCore);

  // For inline parsing, we need to disable all block level parsing except paragraphs
  const blockRules = (md.block.ruler as any).__rules__
    .map(({ name }: { name: string }) => name)
    .filter((n: string) => n !== 'paragraph');
  if (inline) md.block.ruler.disable(blockRules);

  let tokens = [];
  try {
    tokens = md.parse(src, env);
  } finally {
    md.core.ruler.enable(tempDisabledCore);
    if (inline) md.block.ruler.enable(blockRules);
  }
  for (const token of tokens) {
    token.map = token.map !== null ? [token.map[0] + initLine, token.map[1] + initLine] : token.map;
  }
  // If not inline, return the tokens as is
  if (!inline) return tokens;
  // This handles the case where inline arguments are parsed independently
  // and appear to the parser as paragraphs.
  // Ensure the body node has only **inline** children
  if (
    tokens.length === 3 &&
    tokens[0].type === 'paragraph_open' &&
    tokens[1].type === 'inline' &&
    tokens[2].type === 'paragraph_close'
  ) {
    return [tokens[1]];
  }
  // There is a bug when footnote references are used that they can interfere with the role body parsing
  // These footnotes are still in the state, but should not be returned here
  if (
    tokens[0].type === 'paragraph_open' &&
    tokens[1].type === 'inline' &&
    tokens[2].type === 'paragraph_close' &&
    tokens[3].type === 'footnote_block_open' &&
    tokens[tokens.length - 1].type === 'footnote_block_close'
  ) {
    return [tokens[1]];
  }
  return tokens;
}

export function nestedPartToTokens(
  partName: string,
  part: string,
  lineNumber: number,
  state: StateCore,
  pluginRuleName: string,
  inline: boolean,
): Token[] {
  if (!part) return [];
  const openToken = new state.Token(`${partName}_open`, '', 1);
  openToken.content = part;
  openToken.hidden = true;
  openToken.map = [lineNumber, lineNumber];
  const nestedTokens = nestedCoreParse(
    state.md,
    pluginRuleName,
    part,
    state.env,
    lineNumber,
    true,
    inline,
  );
  const closeToken = new state.Token(`${partName}_close`, '', -1);
  closeToken.hidden = true;
  return [openToken, ...nestedTokens, closeToken];
}
