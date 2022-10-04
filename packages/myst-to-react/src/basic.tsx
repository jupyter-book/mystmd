import type * as spec from 'myst-spec';
import { HashLink } from './heading';
import type { NodeRenderer } from './types';

type TableExts = {
  rowspan?: number;
  colspan?: number;
};

type Delete = {
  type: 'delete';
};

type Underline = {
  type: 'underline';
};

type SmallCaps = {
  type: 'smallcaps';
};

type DefinitionList = {
  type: 'definitionList';
};

type DefinitionTerm = {
  type: 'definitionTerm';
};

type DefinitionDescription = {
  type: 'definitionDescription';
};

type CaptionNumber = {
  type: 'captionNumber';
  kind: string;
  identifier: string;
};

type BasicNodeRenderers = {
  strong: NodeRenderer<spec.Strong>;
  emphasis: NodeRenderer<spec.Emphasis>;
  link: NodeRenderer<spec.Link>;
  paragraph: NodeRenderer<spec.Paragraph>;
  break: NodeRenderer<spec.Break>;
  inlineMath: NodeRenderer<spec.InlineMath>;
  math: NodeRenderer<spec.Math>;
  list: NodeRenderer<spec.List>;
  listItem: NodeRenderer<spec.ListItem>;
  container: NodeRenderer<spec.Container>;
  caption: NodeRenderer<spec.Caption>;
  blockquote: NodeRenderer<spec.Blockquote>;
  thematicBreak: NodeRenderer<spec.ThematicBreak>;
  subscript: NodeRenderer<spec.Subscript>;
  superscript: NodeRenderer<spec.Superscript>;
  abbreviation: NodeRenderer<spec.Abbreviation>;
  // Tables
  table: NodeRenderer<spec.Table>;
  tableRow: NodeRenderer<spec.TableRow>;
  tableCell: NodeRenderer<spec.TableCell & TableExts>;
  // Comment
  comment: NodeRenderer<spec.Comment>;
  mystComment: NodeRenderer<spec.Comment>;
  // Our additions
  captionNumber: NodeRenderer<CaptionNumber>;
  delete: NodeRenderer<Delete>;
  underline: NodeRenderer<Underline>;
  smallcaps: NodeRenderer<SmallCaps>;
  // definitions
  definitionList: NodeRenderer<DefinitionList>;
  definitionTerm: NodeRenderer<DefinitionTerm>;
  definitionDescription: NodeRenderer<DefinitionDescription>;
};

const BASIC_RENDERERS: BasicNodeRenderers = {
  delete(node, children) {
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
  smallcaps(node, children) {
    return (
      <span key={node.key} style={{ fontVariant: 'small-caps' }}>
        {children}
      </span>
    );
  },
  link(node, children) {
    return (
      <a key={node.key} target="_blank" href={node.url} rel="noreferrer">
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
      <figure key={node.key} id={node.html_id || node.identifier || node.key} className={node.kind}>
        {children}
      </figure>
    );
  },
  caption(node, children) {
    return (
      <figcaption key={node.key} className="group">
        {children}
      </figcaption>
    );
  },
  blockquote(node, children) {
    return <blockquote key={node.key}>{children}</blockquote>;
  },
  thematicBreak(node) {
    return <hr key={node.key} />;
  },
  captionNumber(node, children) {
    function backwardsCompatibleLabel(value: string, kind?: string) {
      const capital = kind?.slice(0, 1).toUpperCase() ?? 'F';
      const body = kind?.slice(1) ?? 'igure';
      return `${capital}${body}: ${children}`;
    }
    const label =
      typeof children === 'string' ? backwardsCompatibleLabel(children, node.kind) : children;
    const id = node.html_id || node.identifier || node.key;
    return (
      <span key={node.key} className="font-bold mr-1 select-none relative">
        <HashLink id={id} align="left" kind={node.kind} />
        {label}
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
  abbreviation(node, children) {
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
  definitionList(node, children) {
    return <dl key={node.key}>{children}</dl>;
  },
  definitionTerm(node, children) {
    let strongChildren: React.ReactNode = children;
    if (Array.isArray(children)) {
      const allowedStrongTypes = new Set(['emphasis']);
      strongChildren = children.map((child, i) => {
        if (typeof child === 'string') return <strong key={node.key + i}>{child}</strong>;
        if (allowedStrongTypes.has(child?.type)) return <strong key={node.key + i}>{child}</strong>;
        return child;
      });
    } else if (typeof children === 'string') {
      strongChildren = <strong key={node.key + '0'}>{children}</strong>;
    }
    return <dt key={node.key}>{strongChildren}</dt>;
  },
  definitionDescription(node, children) {
    return <dd key={node.key}>{children}</dd>;
  },
};

export default BASIC_RENDERERS;
