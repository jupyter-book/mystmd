import { Root } from 'mdast';
import { defaultHandlers, Handler, toHast, all, Options } from 'mdast-util-to-hast';
import { u } from 'unist-builder';
import classNames from 'classnames';
import { AdmonitionKind } from './types';
import { Plugin } from 'unified';
import type { ElementContent } from 'hast';

const abbreviation: Handler = (h, node) =>
  h(node, 'abbr', { title: node.title }, all(h, node));

const subscript: Handler = (h, node) => h(node, 'sub', all(h, node));
const superscript: Handler = (h, node) => h(node, 'sup', all(h, node));
const image: Handler = (h, node) =>
  h(node, 'img', {
    src: node.url,
    alt: node.alt,
    title: node.title,
    class: classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
    width: node.width,
  });
const caption: Handler = (h, node) => h(node, 'figcaption', all(h, node));
const container: Handler = (h, node) =>
  h(
    node,
    'figure',
    {
      id: node.identifier || node.label || undefined,
      class: classNames({ numbered: node.numbered }, node.class) || undefined,
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
        [node.kind]: node.kind && node.kind !== AdmonitionKind.admonition,
      }),
    },
    all(h, node),
  );

const captionNumber: Handler = (h, node) => {
  const captionKind = node.kind?.charAt(0).toUpperCase() + node.kind?.slice(1);
  return h(node, 'span', { class: 'caption-number' }, [
    u('text', `${captionKind} ${node.value}`),
  ]);
};

const math: Handler = (h, node) => {
  const attrs = { id: node.identifier || undefined, class: 'math block' };
  if (node.value.indexOf('\n') !== -1) {
    const math = h(node, 'div', attrs, [u('text', node.value)]);
    return h(node, 'pre', [math]);
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

const role: Handler = (h, node) => {
  return h(node, 'span', { class: 'role unhandled' }, [
    h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
    h(node, 'code', {}, [u('text', node.value)]),
  ]);
};

const directive: Handler = (h, node) => {
  let directiveElements: ElementContent[] = [
    h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
  ];
  if (node.args) {
    directiveElements = directiveElements.concat([
      u('text', ' '),
      h(node, 'code', { class: 'args' }, [u('text', node.args)]),
    ]);
  }
  return h(node, 'div', { class: 'directive unhandled' }, [
    h(node, 'p', {}, directiveElements),
    h(node, 'pre', [h(node, 'code', [u('text', node.value)])]),
  ]);
};

const block: Handler = (h, node) =>
  h(node, 'div', { class: 'block', 'data-block': node.meta }, all(h, node));

const comment: Handler = (h, node) => u('comment', node.value);

const heading: Handler = (h, node) =>
  h(node, `h${node.depth}`, { id: node.identifier || undefined }, all(h, node));

const contentReference: Handler = (h, node) => {
  if (node.resolved) {
    return h(node, 'a', { href: `#${node.identifier}` }, all(h, node));
  } else {
    return h(node, 'span', { class: 'reference role unhandled' }, [
      h(node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
      h(node, 'code', {}, [u('text', node.identifier)]),
    ]);
  }
};

// TODO: The defaultHandler treats the first row (and only the first row)
//       header; the mdast `tableCol.header` property is not respected.
//       For that, we need to entirely rewrite this handler.
const table: Handler = (h, node) => {
  node.data = { hProperties: { align: node.align } };
  delete node.align;
  return defaultHandlers.table(h, node);
};

export const mystToHast: Plugin<[Options?], string, Root> = (opts) => (tree: Root) => {
  return toHast(tree, {
    ...opts,
    handlers: {
      admonition,
      admonitionTitle,
      container,
      image,
      caption,
      captionNumber,
      abbreviation,
      subscript,
      superscript,
      math,
      inlineMath,
      definitionList,
      definitionTerm,
      definitionDescription,
      role,
      directive,
      block,
      comment,
      heading,
      contentReference,
      table,
      ...opts?.handlers,
    },
  });
};
