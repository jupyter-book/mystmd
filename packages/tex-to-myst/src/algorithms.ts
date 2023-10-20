import { u } from 'unist-builder';
import type { GenericNode } from 'myst-common';
import { normalizeLabel } from 'myst-common';
import type { Handler, ITexParser } from './types.js';
import { getArguments } from './utils.js';
import { select, selectAll } from 'unist-util-select';

function addNestingStatement(
  node: GenericNode,
  state: ITexParser,
  { before, after }: { before: string; after?: string },
) {
  state.closeParagraph();
  state.openParagraph({ indent: state.data.algorithm_indent });
  state.pushNode(u('strong', [u('text', before)]));
  const args = getArguments(node, 'group');
  const children = args[args.length - 1];
  if (children) {
    state.text(' ');
    state.renderChildren(children);
  }
  if (after) {
    state.text(' ');
    state.pushNode(u('strong', [u('text', after)]));
  }
  state.closeParagraph();
  state.data.algorithm_indent ??= 0;
  state.data.algorithm_indent += 1;
}

function finishNestingStatement(node: GenericNode, state: ITexParser, { text }: { text: string }) {
  state.closeParagraph();
  state.data.algorithm_indent ??= 0;
  state.data.algorithm_indent -= 1;
  state.openParagraph({ indent: state.data.algorithm_indent });
  state.pushNode(u('strong', [u('text', text)]));
  const args = getArguments(node, 'group');
  const children = args[args.length - 1];
  if (children) {
    state.text(' ');
    state.renderChildren(children);
  }
  state.closeParagraph();
}

function numberParagraphsAsLines(node: GenericNode) {
  const paragraphs = selectAll('paragraph', node) as GenericNode[];
  paragraphs.forEach((p, i) => {
    p.type = 'line';
    p.enumerator = String(i + 1);
  });
}

export function createTheoremHandler(name: string): Handler {
  return function (node, state) {
    state.closeParagraph();
    state.openNode('proof', { kind: name, enumerated: true });
    state.renderChildren(node);
    state.closeParagraph();
    state.closeNode();
  };
}

export const ALGORITHM_HANDLERS: Record<string, Handler> = {
  env_algorithm(node, state) {
    state.closeParagraph();
    state.openNode('proof', { kind: 'algorithm' });
    state.renderChildren(node);
    state.closeParagraph();
    const proof = state.top();
    const caption = select('caption', proof) as GenericNode;
    if (caption) {
      caption.type = 'admonitionTitle';
      caption.children = caption.children?.[0].children;
    }
    if (caption?.label) {
      // Move the caption label up to the proof
      proof.label = caption.label;
      delete caption.label;
      delete caption.identifier;
    }
    if (proof.label) {
      const { label, identifier } = normalizeLabel(proof.label) ?? {};
      proof.label = label;
      proof.identifier = identifier;
      proof.enumerated = true;
    }
    numberParagraphsAsLines(proof);
    state.closeNode();
  },
  env_algorithmic(node, state) {
    state.closeParagraph();
    const forceProof = state.top().type !== 'proof';
    if (forceProof) state.openNode('proof', { kind: 'algorithm' });
    state.data.algorithm_indent = 0;
    state.renderChildren(node);
    state.closeParagraph();
    if (forceProof) {
      numberParagraphsAsLines(state.top());
      state.closeNode();
    }
  },
  macro_Loop(node, state) {
    addNestingStatement(node, state, { before: 'loop' });
  },
  macro_For(node, state) {
    addNestingStatement(node, state, { before: 'for', after: 'do' });
  },
  macro_ForAll(node, state) {
    addNestingStatement(node, state, { before: 'for all', after: 'do' });
  },
  macro_State(node, state) {
    state.closeParagraph();
    state.openParagraph({ indent: state.data.algorithm_indent });
  },
  macro_Ensure(node, state) {
    state.closeParagraph();
    state.openParagraph({ indent: state.data.algorithm_indent });
    state.pushNode(u('strong', [u('text', 'Ensure: ')]));
  },
  macro_Require(node, state) {
    state.closeParagraph();
    state.openParagraph({ indent: state.data.algorithm_indent });
    state.pushNode(u('strong', [u('text', 'Require: ')]));
  },
  macro_Repeat(node, state) {
    addNestingStatement(node, state, { before: 'repeat ' });
  },
  macro_Until(node, state) {
    finishNestingStatement(node, state, { text: 'until' });
  },
  macro_While(node, state) {
    addNestingStatement(node, state, { before: 'while', after: 'do' });
  },
  macro_EndWhile(node, state) {
    finishNestingStatement(node, state, { text: 'end while' });
  },
  macro_EndFor(node, state) {
    finishNestingStatement(node, state, { text: 'end for' });
  },
  macro_EndLoop(node, state) {
    finishNestingStatement(node, state, { text: 'end loop' });
  },
  macro_If(node, state) {
    addNestingStatement(node, state, { before: 'if', after: 'then' });
  },
  macro_ElsIf(node, state) {
    state.data.algorithm_indent ??= 0;
    state.data.algorithm_indent -= 1;
    addNestingStatement(node, state, { before: 'else if', after: 'then' });
  },
  macro_Else(node, state) {
    finishNestingStatement(node, state, { text: 'else' });
    state.data.algorithm_indent ??= 0;
    state.data.algorithm_indent += 1;
  },
  macro_EndIf(node, state) {
    finishNestingStatement(node, state, { text: 'end if' });
  },
  macro_Comment(node, state) {
    const args = getArguments(node, 'group');
    const children = args[args.length - 1];
    if (!children) return;
    state.openNode('span', { style: { float: 'right' } });
    state.renderChildren(children);
    state.data.ignoreNextWhitespace = true;
    state.closeNode();
  },
};
