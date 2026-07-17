import { type GenericNode } from 'myst-common';
import type { Handler, ITypstSerializer } from './types.js';
import { getDefaultCaptionSupplement } from './container.js';
import { select } from 'unist-util-select';

const proof = `
#let proof(body, heading: [], kind: "proof", supplement: "Proof", labelName: none, color: blue, float: true) = {
  let stroke = 1pt + color.lighten(90%)
  let fill = color.lighten(90%)
  let title
  set figure.caption(position: top)
  set figure(placement: none)
  show figure.caption.where(body: heading): (it) => {
    block(width: 100%, stroke: stroke, fill: fill, inset: 8pt, it)
  }
  place(auto, float: float, block(width: 100%, [
    #figure(kind: kind, supplement: supplement, gap: 0pt, [
      #set align(left);
      #set figure.caption(position: bottom)
      #block(width: 100%, fill: luma(253), stroke: stroke, inset: 8pt)[#body]
    ], caption: heading)
    #if(labelName != none){label(labelName)}
  ]))
}`;

function writeProof(node: GenericNode, state: ITypstSerializer, kind: string) {
  state.useMacro(proof);
  const title = select('admonitionTitle', node);
  const supplement = getDefaultCaptionSupplement(kind);
  state.write(
    `#proof(kind: "${kind}", supplement: "${supplement}", labelName: ${node.identifier ? `"${node.identifier}"` : 'none'}`,
  );
  if (title) {
    state.write(', heading: [');
    state.renderChildren(title);
    state.write('])[\n');
  } else {
    state.write(')[\n');
  }
  state.renderChildren(node);
  state.write(']');
  state.ensureNewLine();
}

export const proofHandlers: Record<string, Handler> = {
  proof(node: GenericNode, state) {
    writeProof(node, state, node.kind || 'proof');
  },
  exercise(node: GenericNode, state) {
    writeProof(node, state, 'exercise');
  },
  solution(node: GenericNode, state) {
    writeProof(node, state, 'solution');
  },
};
