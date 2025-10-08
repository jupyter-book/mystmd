import type MarkdownIt from 'markdown-it/lib/index.js';
import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.js';
import { nestedPartToTokens } from './nestedParse.js';
import { inlineOptionsToTokens } from './inlineAttributes.js';

export function rolePlugin(md: MarkdownIt): void {
  md.inline.ruler.before('backticks', 'parse_roles', roleRule);
  md.core.ruler.after('inline', 'run_roles', runRoles);
  // fallback renderer for unhandled roles
  md.renderer.rules['role'] = (tokens, idx) => {
    const token = tokens[idx];
    return `<span class="role-unhandled"><mark>${token.meta.name}</mark><code>${token.content}</code></span>`;
  };
  md.renderer.rules['role_error'] = (tokens, idx) => {
    const token = tokens[idx];
    let content = '';
    if (token.content) {
      content = `\n---\n${token.content}`;
    }
    return `<aside class="role-error">\n<header><mark>${token.info}</mark><code> ${token.meta.arg}</code></header>\n<pre>${token.meta.error_name}:\n${token.meta.error_message}\n${content}</pre></aside>\n`;
  };
}

// This captures everything between { and }, then captures backticks + body
// We keep negative lookahead/lookbehind for avoiding triple-backtick or edge issues
let _x: RegExp;
try {
  // This pattern has three capturing groups:
  // 1) Everything inside { }, e.g. `something .class #id attr="value"`
  // 2) The sequence of backticks
  // 3) The actual content between those backticks
  _x = new RegExp('^\\{\\s*([^}]+?)\\s*\\}(`+)(?!`)(.+?)(?<!`)\\2(?!`)');
} catch (err) {
  // Safari does not support negative look-behinds
  // This is a slightly down-graded variant, as it does not require a space.
  _x = /^\{\s*([^}]+?)\s*\}(`+)(?!`)(.+?)\2(?!`)/;
}

const ROLE_PATTERN = _x;

function roleRule(state: StateInline, silent: boolean): boolean {
  // Check if the role is escaped
  if (state.src.charCodeAt(state.pos - 1) === 0x5c /* '\' */) {
    return false;
  }

  const match = ROLE_PATTERN.exec(state.src.slice(state.pos));
  if (match == null) return false;

  // match[1] = everything inside the braces
  // match[2] = sequence of backticks
  // match[4] = content inside those backticks
  const [str, header, , content] = match;
  if (!silent) {
    const token = state.push('role', '', 0);
    token.info = header;
    token.content = content;
    (token as any).col = [state.pos, state.pos + str.length];
  }
  state.pos += str.length;
  return true;
}

/** Run all roles, replacing the original token */
function runRoles(state: StateCore): boolean {
  for (const token of state.tokens) {
    if (token.type === 'inline' && token.children) {
      const childTokens = [];
      for (const child of token.children) {
        if (child.type === 'role') {
          try {
            const { map } = token;
            const { content, col } = child as any;
            // Note, if default role as `span` is wanted, add a
            // `name = 'span'` here and remove thrown error below
            const { name, tokens: optTokens } = inlineOptionsToTokens(
              child.info,
              map?.[0] ?? 0,
              state,
            );
            if (!name) {
              throw new Error('A role name is required, for example, "{sub}`2`"');
            }
            const roleOpen = new state.Token('parsed_role_open', '', 1);
            roleOpen.content = content;
            roleOpen.hidden = true;
            roleOpen.info = name;
            roleOpen.meta = { header: child.info };
            roleOpen.block = false;
            roleOpen.map = map;
            (roleOpen as any).col = col;
            const contentTokens = roleContentToTokens(content, map?.[0] ?? 0, state);
            const roleClose = new state.Token('parsed_role_close', '', -1);
            roleClose.block = false;
            roleClose.hidden = true;
            roleOpen.info = name;
            const newTokens = [roleOpen, ...optTokens, ...contentTokens, roleClose];
            childTokens.push(...newTokens);
          } catch (err) {
            const errorToken = new state.Token('role_error', '', 0);
            errorToken.content = child.content;
            errorToken.info = child.info;
            errorToken.meta = child.meta ?? {};
            errorToken.map = child.map;
            errorToken.meta.error_message = (err as Error).message;
            errorToken.meta.error_name = (err as Error).name;
            childTokens.push(errorToken);
          }
        } else {
          childTokens.push(child);
        }
      }
      token.children = childTokens;
    }
  }
  return true;
}

function roleContentToTokens(content: string, lineNumber: number, state: StateCore) {
  return nestedPartToTokens('role_body', content, lineNumber, state, 'run_roles', true);
}
