/* eslint-disable @typescript-eslint/no-explicit-any */
import type { YAMLException } from 'js-yaml';
import yaml from 'js-yaml';
import type MarkdownIt from 'markdown-it/lib';
import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import { nestedPartToTokens } from './nestedParse.js';
import { stateError, stateWarn } from './utils.js';

const COLON_OPTION_REGEX = /^:(?<option>[^:\s]+?):(\s*(?<value>.*)){0,1}\s*$/;

function computeBlockTightness(
  src: string,
  map: [number, number] | null | undefined,
): boolean | 'before' | 'after' {
  const lines = src.split('\n');
  const tightBefore =
    typeof map?.[0] === 'number' && map[0] > 0 ? lines[map[0] - 1].trim() !== '' : false;
  const tightAfter =
    typeof map?.[1] === 'number' && map[1] < lines.length ? lines[map[1]].trim() !== '' : false;
  const tight =
    tightBefore && tightAfter ? true : tightBefore ? 'before' : tightAfter ? 'after' : false;
  return tight;
}

/** Convert fences identified as directives to `directive` tokens */
function replaceFences(state: StateCore): boolean {
  for (const token of state.tokens) {
    if (token.type === 'fence' || token.type === 'colon_fence') {
      const match = token.info.match(/^\s*\{\s*([^}\s]+)\s*\}\s*(.*)$/);
      if (match) {
        token.type = 'directive';
        token.info = match[1].trim();
        token.meta = { arg: match[2] };
      }
    }
  }
  return true;
}

/** Run all directives, replacing the original token */
function runDirectives(state: StateCore): boolean {
  const finalTokens = [];
  for (const token of state.tokens) {
    if (token.type === 'directive') {
      try {
        const { info, map } = token;
        const arg = token.meta.arg?.trim() || undefined;
        const content = parseDirectiveContent(
          token.content.trim() ? token.content.split(/\r?\n/) : [],
          info,
          state,
        );
        const { body, options } = content;
        let { bodyOffset } = content;
        while (body.length && !body[0].trim()) {
          body.shift();
          bodyOffset++;
        }
        const bodyString = body.join('\n').trimEnd();
        const directiveOpen = new state.Token('parsed_directive_open', '', 1);
        directiveOpen.info = info;
        directiveOpen.hidden = true;
        directiveOpen.content = bodyString;
        directiveOpen.map = map;
        directiveOpen.meta = {
          arg,
          options: getDirectiveOptions(options),
          // Tightness is computed for all directives (are they separated by a newline before/after)
          tight: computeBlockTightness(state.src, token.map),
        };
        const startLineNumber = map ? map[0] : 0;
        const argTokens = directiveArgToTokens(arg, startLineNumber, state);
        const optsTokens = directiveOptionsToTokens(options || [], startLineNumber + 1, state);
        const bodyTokens = directiveBodyToTokens(bodyString, startLineNumber + bodyOffset, state);
        const directiveClose = new state.Token('parsed_directive_close', '', -1);
        directiveClose.info = info;
        directiveClose.hidden = true;
        const newTokens = [
          directiveOpen,
          ...argTokens,
          ...optsTokens,
          ...bodyTokens,
          directiveClose,
        ];
        finalTokens.push(...newTokens);
      } catch (err) {
        stateError(state, `Error parsing "${token.info}" directive: ${(err as Error).message}`);
        const errorToken = new state.Token('directive_error', '', 0);
        errorToken.content = token.content;
        errorToken.info = token.info;
        errorToken.meta = token.meta;
        errorToken.map = token.map;
        errorToken.meta.error_message = (err as Error).message;
        errorToken.meta.error_name = (err as Error).name;
        finalTokens.push(errorToken);
      }
    } else {
      finalTokens.push(token);
    }
  }
  state.tokens = finalTokens;
  return true;
}

function parseDirectiveContent(
  content: string[],
  info: string,
  state: StateCore,
): {
  body: string[];
  bodyOffset: number;
  options?: [string, string | true][];
} {
  let bodyOffset = 1;
  let yamlBlock: string[] | null = null;
  const newContent: string[] = [];

  if (content.length && content[0].trimEnd() === '---') {
    // options contained in YAML block, starting and ending with '---'
    bodyOffset++;
    yamlBlock = [];
    let foundDivider = false;
    for (const line of content.slice(1)) {
      if (line.trimEnd() === '---') {
        bodyOffset++;
        foundDivider = true;
        continue;
      }
      if (foundDivider) {
        newContent.push(line);
      } else {
        bodyOffset++;
        yamlBlock.push(line);
      }
    }
    try {
      const options = yaml.load(yamlBlock.join('\n')) as Record<string, any>;
      if (options && typeof options === 'object') {
        return { body: newContent, options: Object.entries(options), bodyOffset };
      }
    } catch (err) {
      stateWarn(
        state,
        `Invalid YAML options in "${info}" directive: ${(err as YAMLException).reason}`,
      );
    }
  } else if (content.length && COLON_OPTION_REGEX.exec(content[0])) {
    const options: [string, string | true][] = [];
    let foundDivider = false;
    for (const line of content) {
      if (!foundDivider && !COLON_OPTION_REGEX.exec(line)) {
        foundDivider = true;
        newContent.push(line);
        continue;
      }
      if (foundDivider) {
        newContent.push(line);
      } else {
        const match = COLON_OPTION_REGEX.exec(line);
        const { option, value } = match?.groups ?? {};
        if (option) options.push([option, value || true]);
        bodyOffset++;
      }
    }
    return { body: newContent, options, bodyOffset };
  }
  return { body: content, bodyOffset: 1 };
}

function directiveArgToTokens(arg: string, lineNumber: number, state: StateCore) {
  return nestedPartToTokens('directive_arg', arg, lineNumber, state, 'run_directives', true);
}

function getDirectiveOptions(options?: [string, string | true][]) {
  if (!options) return undefined;
  const simplified: Record<string, string | true> = {};
  options.forEach(([key, val]) => {
    if (simplified[key] !== undefined) {
      return;
    }
    simplified[key] = val;
  });
  return simplified;
}

function directiveOptionsToTokens(
  options: [string, string | true][],
  lineNumber: number,
  state: StateCore,
) {
  const tokens = options.map(([key, value], index) => {
    // lineNumber mapping assumes each option is only one line;
    // not necessarily true for yaml options.
    const optTokens =
      typeof value === 'string'
        ? nestedPartToTokens(
            'directive_option',
            value,
            lineNumber + index,
            state,
            'run_directives',
            true,
          )
        : [
            new state.Token('directive_option_open', '', 1),
            new state.Token('directive_option_close', '', -1),
          ];
    if (optTokens.length) {
      optTokens[0].info = key;
      optTokens[0].content = typeof value === 'string' ? value : '';
      optTokens[0].meta = { value };
    }
    return optTokens;
  });
  return tokens.flat();
}

function directiveBodyToTokens(body: string, lineNumber: number, state: StateCore) {
  return nestedPartToTokens('directive_body', body, lineNumber, state, 'run_directives', false);
}

export function directivePlugin(md: MarkdownIt): void {
  md.core.ruler.after('block', 'fence_to_directive', replaceFences);
  md.core.ruler.after('fence_to_directive', 'run_directives', runDirectives);

  // fallback renderer for unhandled directives
  md.renderer.rules['directive'] = (tokens, idx) => {
    const token = tokens[idx];
    return `<aside class="directive-unhandled">\n<header><mark>${token.info}</mark><code> ${token.meta.arg}</code></header>\n<pre>${token.content}</pre></aside>\n`;
  };
  md.renderer.rules['directive_error'] = (tokens, idx) => {
    const token = tokens[idx];
    let content = '';
    if (token.content) {
      content = `\n---\n${token.content}`;
    }
    return `<aside class="directive-error">\n<header><mark>${token.info}</mark><code> ${token.meta.arg}</code></header>\n<pre>${token.meta.error_name}:\n${token.meta.error_message}\n${content}</pre></aside>\n`;
  };
}
