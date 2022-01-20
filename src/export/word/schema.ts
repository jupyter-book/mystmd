import { oxaLinkToId } from '@curvenote/blocks';
import { CaptionKind, Nodes, ReferenceKind } from '@curvenote/schema';
import { formatDatetime } from '@curvenote/schema/dist/nodes/time';
import { HeadingLevel, IParagraphOptions, IRunOptions } from 'docx';
import { defaultMarks, NodeSerializer } from 'prosemirror-docx';
import { Node } from 'prosemirror-model';

interface Styles {
  paragraph?: IParagraphOptions;
  [HeadingLevel.HEADING_1]?: IParagraphOptions;
  [HeadingLevel.HEADING_2]?: IParagraphOptions;
  [HeadingLevel.HEADING_3]?: IParagraphOptions;
  [HeadingLevel.HEADING_4]?: IParagraphOptions;
  [HeadingLevel.HEADING_5]?: IParagraphOptions;
  [HeadingLevel.HEADING_6]?: IParagraphOptions;
  [HeadingLevel.TITLE]?: IParagraphOptions;
  blockquote?: IParagraphOptions;
  code_block?: IParagraphOptions;
  image?: IParagraphOptions;
  aside?: IParagraphOptions;
  callout?: IParagraphOptions;
  equation?: IParagraphOptions;
  iframe?: IParagraphOptions;
  figcaption?: IParagraphOptions & { suffix?: string };
  time?: IRunOptions;
}

function getLatexFromNode(node: Node): string {
  let math = '';
  node.forEach((child) => {
    if (child.isText) math += child.text;
    // TODO: improve this as we may have other things in the future
  });
  return math;
}

const defaultStyles: Styles = {
  blockquote: { style: 'IntenseQuote' },
  aside: { style: 'IntenseQuote' },
  callout: { style: 'IntenseQuote' },
  figcaption: { style: 'Caption' },
};

function figCaptionToWordCaption(kind: CaptionKind) {
  switch (kind) {
    case CaptionKind.fig:
      return 'Figure';
    case CaptionKind.table:
      return 'Table';
    case CaptionKind.code:
    case CaptionKind.eq:
      // This is a hack, I don't think word knows about other things!
      return 'Figure';
    default:
      throw new Error(`Unknown figure caption of kind ${kind}`);
  }
}

export function getNodesAndMarks(styles?: Styles) {
  const nodes: NodeSerializer = {
    text(state, node) {
      state.text(node.text ?? '');
    },
    paragraph(state, node) {
      state.renderInline(node);
      state.closeBlock(node, styles?.paragraph);
    },
    heading(state, node) {
      state.renderInline(node);
      const heading = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ][node.attrs.level - 1];
      state.closeBlock(node, { heading, ...styles?.[heading] });
    },
    blockquote(state, node) {
      state.renderContent(node, { ...defaultStyles.blockquote, ...styles?.blockquote });
    },
    code_block(state, node) {
      // TODO: something for code
      state.renderContent(node);
      state.closeBlock(node, styles?.code_block);
    },
    horizontal_rule(state, node) {
      // Kinda hacky, but this works to insert two paragraphs, the first with a break
      state.closeBlock(node, { thematicBreak: true });
      state.closeBlock(node);
    },
    hard_break(state) {
      state.addRunOptions({ break: 1 });
    },
    ordered_list(state, node) {
      state.renderList(node, 'numbered');
    },
    bullet_list(state, node) {
      state.renderList(node, 'bullets');
    },
    list_item(state, node) {
      state.renderListItem(node);
    },
    // Presentational
    image(state, node) {
      const { src } = node.attrs;
      state.image(src);
      state.closeBlock(node, styles?.image);
    },
    // Technical
    math(state, node) {
      state.math(getLatexFromNode(node), { inline: true });
    },
    equation(state, node) {
      const { id, numbered } = node.attrs;
      state.math(getLatexFromNode(node), { inline: false, numbered, id });
      state.closeBlock(node, styles?.equation);
    },
    table(state, node) {
      state.table(node);
    },
    aside(state, node) {
      state.renderContent(node, { ...defaultStyles.aside, ...styles?.aside });
    },
    callout(state, node) {
      state.renderContent(node, { ...defaultStyles.callout, ...styles?.callout });
    },
    iframe(state, node) {
      state.text('[IFrame not supported]');
      state.closeBlock(node, styles?.iframe);
    },
    figure(state, node) {
      const { id, numbered } = node.attrs as Nodes.Figure.Attrs;
      // TODO: localize this ID; we will need an options structure similar to https://github.com/curvenote/curvenotejs/blob/main/src/export/utils/localizationOptions.ts
      (state as any).nextCaptionId = id;
      (state as any).nextCaptionNumbered = numbered;
      state.renderContent(node);
    },
    figcaption(state, node) {
      const { kind } = node.attrs as Nodes.Figcaption.Attrs;
      const id = (state as any).nextCaptionId;
      const numbered = (state as any).nextCaptionNumbered;
      const options = styles?.figcaption?.suffix ? { suffix: styles.figcaption.suffix } : undefined;
      if (numbered && kind) {
        const captionKind = figCaptionToWordCaption(kind);
        state.captionLabel(id, captionKind, options);
      }
      state.renderInline(node);
      state.closeBlock(node, { ...defaultStyles.figcaption, ...styles?.figcaption });
    },
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
    cite_group(state, node) {
      let count = 0;
      const [open, join, close] = ['(', '; ', ')'];
      state.text(open);
      node.forEach((n, _, index) => {
        state.render(n, node, index);
        count += 1;
        if (count < node.childCount) {
          state.text(join);
        }
      });
      state.text(close);
    },
    time(state, node) {
      const { datetime } = node.attrs as Nodes.Time.Attrs;
      const { f } = formatDatetime(datetime);
      state.text(f, styles?.time);
    },
    footnote(state, node) {
      state.footnote(node);
    },
    // All the interactive nodes
    variable(state, node) {
      state.text('[Variable not supported]');
      state.closeBlock(node);
    },
    display(state) {
      state.text('[Display text not supported]');
    },
    dynamic(state) {
      state.text('[Dynamic text not supported]');
    },
    range(state) {
      state.text('[Range not supported]');
    },
    switch(state) {
      state.text('[Switch not supported]');
    },
    button(state) {
      state.text('[Switch not supported]');
    },
  };
  return { nodes, marks: defaultMarks };
}
