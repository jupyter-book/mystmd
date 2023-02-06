/* eslint-disable @typescript-eslint/no-explicit-any */
import yaml from 'js-yaml';
import type MarkdownIt from 'markdown-it/lib';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import { nestedPartToTokens } from './nestedParse';

/** Convert fences identified as directives to `directive` tokens */
function replaceFences(state: StateCore): boolean {
  for (const token of state.tokens) {
    if (token.type === 'fence' || token.type === 'colon_fence') {
      const match = token.info.match(/^\{([^\s}]+)\}\s*(.*)$/);
      if (match) {
        token.type = 'directive';
        token.info = match[1];
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
        const { arg } = token.meta;
        const content = parseDirectiveContent(
          token.content.trim() ? token.content.split(/\r?\n/) : [],
        );
        const { body, options } = content;
        let { bodyOffset } = content;
        while (body.length && !body[0].trim()) {
          body.shift();
          bodyOffset++;
        }
        const directiveOpen = new state.Token('parsed_directive_open', '', 1);
        directiveOpen.info = info;
        directiveOpen.hidden = true;
        directiveOpen.content = body.join('\n');
        directiveOpen.map = map;
        directiveOpen.meta = {
          arg,
          options,
        };
        const startLineNumber = map ? map[0] : 0;
        const argTokens = directiveArgToTokens(arg, startLineNumber, state);
        const optsTokens = directiveOptionsToTokens(options, startLineNumber + 1, state);
        const bodyTokens = directiveBodyToTokens(
          body.join('\n'),
          startLineNumber + bodyOffset,
          state,
        );
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

function loadOptions(yamlBlock: string) {
  const options = yaml.load(yamlBlock);
  if (options === null || typeof options !== 'object') {
    return null;
  }
  const output: Record<string, any> = {};
  Object.entries(options).forEach(([key, value]) => {
    // If options are given as flags, this coerces them to true
    output[key] = value !== null ? value : true;
  });
  return output;
}

function parseDirectiveContent(content: string[]): {
  body: string[];
  options: Record<string, any>;
  bodyOffset: number;
} {
  let bodyOffset = 1;
  let yamlBlock: string[] | null = null;
  const newContent: string[] = [];

  if (content.length && content[0].trim() === '---') {
    // options contained in YAML block, starting and ending with '---'
    bodyOffset++;
    yamlBlock = [];
    let foundDivider = false;
    for (const line of content.slice(1)) {
      if (line.trim() === '---') {
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
  } else if (content.length && content[0].startsWith(':')) {
    yamlBlock = [];
    let foundDivider = false;
    for (const line of content) {
      if (!foundDivider && !line.startsWith(':')) {
        foundDivider = true;
        newContent.push(line);
        continue;
      }
      if (foundDivider) {
        newContent.push(line);
      } else {
        bodyOffset++;
        yamlBlock.push(line.slice(1));
      }
    }
  }

  if (yamlBlock !== null) {
    try {
      const options = loadOptions(yamlBlock.join('\n'));
      if (options) {
        return { body: newContent, options, bodyOffset };
      }
    } catch {
      // If there's an error, no worries; assume the intent is no options.
    }
  }

  return { body: content, options: {}, bodyOffset: 1 };
}

function directiveArgToTokens(arg: string, lineNumber: number, state: StateCore) {
  return nestedPartToTokens('directive_arg', arg, lineNumber, state);
}

function directiveOptionsToTokens(
  options: Record<string, any>,
  lineNumber: number,
  state: StateCore,
) {
  const tokens = Object.entries(options).map(([key, value], index) => {
    // lineNumber mapping assumes each option is only one line;
    // not necessarily true for yaml options.
    const optTokens = nestedPartToTokens('directive_option', `${value}`, lineNumber + index, state);
    optTokens[0].info = key;
    optTokens[0].content = value;
    return optTokens;
  });
  return tokens.flat();
}

function directiveBodyToTokens(body: string, lineNumber: number, state: StateCore) {
  return nestedPartToTokens('directive_body', body, lineNumber, state);
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
