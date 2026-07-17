import type MarkdownIt from 'markdown-it/lib/index.js';
import type StateBlock from 'markdown-it/lib/rules_block/state_block.js';

/** Colon fence
 * This plugin directly mimics regular fences, but with `:` colons.
 *
 * Example:

        :::name
        contained text
        :::
 *
*/
export function colonFencePlugin(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'colon_fence', colon_fence_rule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list', 'footnote_def'],
  });
}

function colon_fence_rule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  let haveEndMarker = false;
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) {
    return false;
  }

  if (pos + 3 > max) {
    return false;
  }

  const marker = state.src.charCodeAt(pos);

  if (marker !== 0x3a /* : */) {
    return false;
  }

  // scan marker length
  let mem = pos;
  pos = state.skipChars(pos, marker);

  let len = pos - mem;

  if (len < 3) {
    return false;
  }

  const markup = state.src.slice(mem, pos);
  const params = state.src.slice(pos, max);

  // Since start is found, we can report success here in validation mode
  if (silent) {
    return true;
  }

  // search end of block
  let nextLine = startLine;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      // unclosed block should be autoclosed by end of document.
      // also block seems to be autoclosed by end of parent
      break;
    }

    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      // non-empty line with negative indent should stop the list:
      // - ```
      //  test
      break;
    }

    if (state.src.charCodeAt(pos) !== marker) {
      continue;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      // closing fence should be indented less than 4 spaces
      continue;
    }

    pos = state.skipChars(pos, marker);

    // closing code fence must be at least as long as the opening one
    if (pos - mem < len) {
      continue;
    }

    // make sure tail has spaces only
    pos = state.skipSpaces(pos);

    if (pos < max) {
      continue;
    }

    haveEndMarker = true;
    // found!
    break;
  }

  // If a fence has heading spaces, they should be removed from its inner block
  len = state.sCount[startLine];

  state.line = nextLine + (haveEndMarker ? 1 : 0);

  const token = state.push('fence', 'code', 0);
  token.info = params;
  token.content = state.getLines(startLine + 1, nextLine, len, true);
  token.markup = markup;
  token.map = [startLine, state.line];

  return true;
}
