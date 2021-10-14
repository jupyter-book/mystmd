import { oxaLinkToId } from '@curvenote/blocks';
import { Nodes, ReferenceKind } from '@curvenote/schema';
import { formatDatetime } from '@curvenote/schema/dist/nodes/time';
import { defaultNodes, defaultMarks, NodeSerializer } from 'prosemirror-docx';

export function getNodesAndMarks() {
  const nodes: NodeSerializer = {
    ...defaultNodes,
    aside: defaultNodes.blockquote,
    callout: defaultNodes.blockquote,
    cite(state, node) {
      const { kind, key, text } = node.attrs as Nodes.Cite.Attrs;
      const oxa = oxaLinkToId(key);
      if (!oxa) return;
      // TODO: This is probably very wrong
      const id = oxa.id || oxa.block.block.slice(0, 8);
      switch (kind) {
        case ReferenceKind.cite:
          state.text(text);
          break;
        case ReferenceKind.table:
        case ReferenceKind.code:
        case ReferenceKind.fig:
          state.createReference(id);
          break;
        case ReferenceKind.eq:
          state.createReference(id, 'Equation ');
          break;
        default:
          break;
      }
    },
    cite_group(state, group) {
      let count = 0;
      const [open, join, close] = ['(', '; ', ')'];
      state.text(open);
      group.forEach((n, _, index) => {
        state.render(n, group, index);
        count += 1;
        if (count < group.childCount) {
          state.text(join);
        }
      });
      state.text(close);
    },
    time(state, node) {
      const { datetime } = node.attrs as Nodes.Time.Attrs;
      const { f } = formatDatetime(datetime);
      state.text(f);
    },
    footnote(state, node) {
      state.footnote(node);
    },
  };
  return { nodes, marks: defaultMarks };
}
