import type { Handler, Options } from 'mdast-util-to-hast';
import { defaultHandlers, toHast, all } from 'mdast-util-to-hast';
import { u } from 'unist-builder';
import classNames from 'classnames';
import type { Plugin } from 'unified';
import type { ElementContent, Properties } from 'hast';
import type { GenericParent } from 'myst-common';

const abbreviation: Handler = (h, node) => h(node, 'abbr', { title: node.title }, all(h, node));

const subscript: Handler = (h, node) => h(node, 'sub', all(h, node));
const superscript: Handler = (h, node) => h(node, 'sup', all(h, node));
const image: Handler = (h, node) =>
  h(node, 'img', {
    src: node.url,
    alt: node.alt,
    title: node.title,
    class: classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
    height: node.height,
    width: node.width,
  });
const caption: Handler = (h, node) => h(node, 'figcaption', all(h, node));
const legend: Handler = (h, node) => h(node, 'div', { class: 'legend' }, all(h, node));
const container: Handler = (h, node) =>
  h(
    node,
    'figure',
    {
      id: node.identifier || node.label || undefined,
      class: classNames({ numbered: node.enumerated !== false }, node.class) || undefined,
    },
    all(h, node),
  );

const admonitionTitle: Handler = (h, node) =>
  h(node, 'p', { class: 'admonition-title' }, all(h, node));

const admonition: Handler = (h, node) =>
  h(
    node,
    'aside',
    {
      class: classNames({
        [node.class]: node.class, // The custom class is first!!
        admonition: true,
        [node.kind]: node.kind && node.kind !== 'admonition',
      }),
    },
    all(h, node),
  );

const captionNumber: Handler = (h, node) => {
  const captionKind = node.kind?.charAt(0).toUpperCase() + node.kind?.slice(1);
  return h(node, 'span', { class: 'caption-number' }, [u('text', `${captionKind} ${node.value}`)]);
};

const math: Handler = (h, node) => {
  const attrs = { id: node.identifier || undefined, class: 'math block' };
  if (node.value.indexOf('\n') !== -1) {
    const mathHast = h(node, 'div', attrs, [u('text', node.value)]);
    return h(node, 'pre', [mathHast]);
  }
  return h(node, 'div', attrs, [u('text', node.value.replace(/\r?\n|\r/g, ' '))]);
};

const inlineMath: Handler = (h, node) => {
  return h(node, 'span', { class: 'math inline' }, [
    u('text', node.value.replace(/\r?\n|\r/g, ' ')),
  ]);
};

const definitionList: Handler = (h, node) => h(node, 'dl', all(h, node));
const definitionTerm: Handler = (h, node) => h(node, 'dt', all(h, node));
const definitionDescription: Handler = (h, node) => h(node, 'dd', all(h, node));

const mystRole: Handler = (h, node) => {
  const children = [h(node, 'code', { class: 'kind' }, [u('text', `{${node.name}}`)])];
  if (node.value) {
    children.push(h(node, 'code', {}, [u('text', node.value)]));
  }
  return h(node, 'span', { class: 'role unhandled' }, children);
};

const mystDirective: Handler = (h, node) => {
  const directiveHeader: ElementContent[] = [
    h(node, 'code', { class: 'kind' }, [u('text', `{${node.name}}`)]),
  ];
  if (node.args) {
    directiveHeader.push(h(node, 'code', { class: 'args' }, [u('text', node.args)]));
  }
  const directiveBody: ElementContent[] = [];
  if (node.options) {
    const optionsString = Object.keys(node.options)
      .map((k) => `:${k}: ${node.options[k]}`)
      .join('\n');
    directiveBody.push(
      h(node, 'pre', [h(node, 'code', { class: 'options' }, [u('text', optionsString)])]),
    );
  }
  directiveBody.push(h(node, 'pre', [h(node, 'code', [u('text', node.value)])]));
  return h(node, 'div', { class: 'directive unhandled' }, [
    h(node, 'p', {}, directiveHeader),
    ...directiveBody,
  ]);
};

const block: Handler = (h, node) =>
  h(node, 'div', { class: 'block', 'data-block': node.meta }, all(h, node));

const comment: Handler = (h, node) => u('comment', node.value);

const heading: Handler = (h, node) =>
  h(node, `h${node.depth}`, { id: node.identifier || undefined }, all(h, node));

const crossReference: Handler = (h, node) => {
  if (node.resolved) {
    return h(
      node,
      'a',
      { href: `#${node.identifier}`, title: node.title || undefined },
      all(h, node),
    );
  } else {
    return h(node, 'span', { class: 'reference role unhandled' }, [
      h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
      h(node, 'code', {}, [u('text', node.identifier)]),
    ]);
  }
};

// TODO: The defaultHandler treats the first row (and only the first row)
//       header; the mdast `tableCell.header` property is not respected.
//       For that, we need to entirely rewrite this handler.
const table: Handler = (h, node) => {
  node.data = { hProperties: { align: node.align } };
  delete node.align;
  return defaultHandlers.table(h, node);
};

const code: Handler = (h, node) => {
  const value = node.value ? node.value + '\n' : '';
  const props: Properties = {};
  if (node.identifier) {
    props.id = node.identifier;
  }
  props.className = classNames({ ['language-' + node.lang]: node.lang }, node.class) || undefined;
  const codeHast = h(node, 'code', props, [u('text', value)]);
  return h(node.position, 'pre', [codeHast]);
};

const iframe: Handler = (h, node) => h(node, 'div', { class: 'iframe' });
const bibliography: Handler = (h, node) => h(node, 'div', { class: 'bibliography' });
const details: Handler = (h, node) => h(node, 'details');
const summary: Handler = (h, node) => h(node, 'summary');
const embed: Handler = (h, node) => h(node, 'div');
const include: Handler = (h, node) => h(node, 'div', { file: node.file });
const linkBlock: Handler = (h, node) => h(node, 'a');
const margin: Handler = (h, node) => h(node, 'aside', { class: 'margin' });
const mdast: Handler = (h, node) => h(node, 'div', { id: node.id });
const mermaid: Handler = (h, node) => h(node, 'div', { class: 'margin' });
const myst: Handler = (h, node) => h(node, 'div', { class: 'margin' });
const output: Handler = (h, node) => h(node, 'div', { class: 'output' });

export const mystToHast: Plugin<[Options?], string, GenericParent> =
  (opts) => (tree: GenericParent) => {
    return toHast(tree as any, {
      ...opts,
      handlers: {
        admonition,
        admonitionTitle,
        container,
        image,
        caption,
        captionNumber,
        legend,
        abbreviation,
        subscript,
        superscript,
        math,
        inlineMath,
        definitionList,
        definitionTerm,
        definitionDescription,
        mystRole,
        mystDirective,
        block,
        comment,
        heading,
        crossReference,
        code,
        table,
        iframe,
        bibliography,
        details,
        summary,
        embed,
        include,
        linkBlock,
        margin,
        mdast,
        mermaid,
        myst,
        output,
        ...opts?.handlers,
      },
    });
  };
