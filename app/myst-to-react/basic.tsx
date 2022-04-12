import type * as spec from 'myst-spec';
import { NodeRenderer } from './types';

function getCaptionStart(kind?: string) {
  switch (kind) {
    case 'figure':
      return 'Figure';
    case 'table':
      return 'Table';
    default:
      return 'Unknown';
  }
}

type TableExts = {
  rowspan?: number;
  colspan?: number;
};

type Strike = {
  type: 'strike';
};

type Underline = {
  type: 'underline';
};

type BasicNodeRenderers = {
  strong: NodeRenderer<spec.Strong>;
  emphasis: NodeRenderer<spec.Emphasis>;
  inlineCode: NodeRenderer<spec.InlineCode>;
  link: NodeRenderer<spec.Link>;
  paragraph: NodeRenderer<spec.Paragraph>;
  break: NodeRenderer<spec.Break>;
  inlineMath: NodeRenderer<spec.InlineMath>;
  math: NodeRenderer<spec.Math>;
  list: NodeRenderer<spec.List>;
  listItem: NodeRenderer<spec.ListItem>;
  container: NodeRenderer<spec.Container>;
  image: NodeRenderer<spec.Image>;
  caption: NodeRenderer<spec.Caption>;
  blockquote: NodeRenderer<spec.Blockquote>;
  thematicBreak: NodeRenderer<spec.ThematicBreak>;
  crossReference: NodeRenderer<spec.CrossReference>;
  subscript: NodeRenderer<spec.Subscript>;
  superscript: NodeRenderer<spec.Superscript>;
  abbr: NodeRenderer<spec.Abbreviation>;
  // Tables
  table: NodeRenderer<spec.Table>;
  tableRow: NodeRenderer<spec.TableRow>;
  tableCell: NodeRenderer<spec.TableCell & TableExts>;
  // Comment
  comment: NodeRenderer<spec.Comment>;
  mystComment: NodeRenderer<spec.Comment>;
  // Our additions
  captionNumber: NodeRenderer<{ kind: string }>;
  strike: NodeRenderer<Strike>;
  underline: NodeRenderer<Underline>;
};

const BASIC_RENDERERS: BasicNodeRenderers = {
  strike(node, children) {
    return <del key={node.key}>{children}</del>;
  },
  strong(node, children) {
    return <strong key={node.key}>{children}</strong>;
  },
  emphasis(node, children) {
    return <em key={node.key}>{children}</em>;
  },
  underline(node, children) {
    return (
      <span key={node.key} style={{ textDecoration: 'underline' }}>
        {children}
      </span>
    );
  },
  inlineCode(node, children) {
    return <code key={node.key}>{children}</code>;
  },
  link(node, children) {
    return (
      <a key={node.key} target="_blank" href={node.url}>
        {children}
      </a>
    );
  },
  paragraph(node, children) {
    return <p key={node.key}>{children}</p>;
  },
  break(node) {
    return <br key={node.key} />;
  },
  inlineMath(node) {
    return <code key={node.key}>{node.value}</code>;
  },
  math(node) {
    return <code key={node.key}>{node.value}</code>;
  },
  list(node, children) {
    if (node.ordered) {
      return (
        <ol key={node.key} start={node.start || undefined}>
          {children}
        </ol>
      );
    }
    return <ul key={node.key}>{children}</ul>;
  },
  listItem(node, children) {
    return <li key={node.key}>{children}</li>;
  },
  container(node, children) {
    return (
      <figure key={node.key} id={node.identifier}>
        {children}
      </figure>
    );
  },
  image(node) {
    return <img key={node.key} src={node.url} />;
  },
  caption(node, children) {
    return <figcaption key={node.key}>{children}</figcaption>;
  },
  blockquote(node, children) {
    return <blockquote key={node.key}>{children}</blockquote>;
  },
  thematicBreak(node) {
    return <hr key={node.key} />;
  },
  crossReference(node, children) {
    return (
      <a key={node.key} href={`#${node.identifier}`}>
        {children}
      </a>
    );
  },
  // TODO: This doesn't exist in the spec
  captionNumber(node, children) {
    return (
      <span key={node.key} className="caption-number">
        {getCaptionStart(node.kind)} {children}:
      </span>
    );
  },
  table(node, children) {
    return <table key={node.key}>{children}</table>;
  },
  tableRow(node, children) {
    return <tr key={node.key}>{children}</tr>;
  },
  tableCell(node, children) {
    const ifGreaterThanOne = (num?: number) => (num === 1 ? undefined : num);
    const attrs = {
      key: node.key,
      rowSpan: ifGreaterThanOne(node.rowspan),
      colSpan: ifGreaterThanOne(node.colspan),
    };
    if (node.header) return <th {...attrs}>{children}</th>;
    return <td {...attrs}>{children}</td>;
  },
  subscript(node, children) {
    return <sub key={node.key}>{children}</sub>;
  },
  superscript(node, children) {
    return <sup key={node.key}>{children}</sup>;
  },
  abbr(node, children) {
    return (
      <abbr key={node.key} title={node.title}>
        {children}
      </abbr>
    );
  },
  mystComment() {
    return null;
  },
  comment() {
    return null;
  },
};

export default BASIC_RENDERERS;
