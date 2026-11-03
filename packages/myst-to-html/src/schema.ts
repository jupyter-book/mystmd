import type { Handler, Options, State } from 'mdast-util-to-hast';
import { defaultHandlers, toHast } from 'mdast-util-to-hast';
import { u } from 'unist-builder';
import classNames from 'classnames';
import type { Plugin } from 'unified';
import type { Element, ElementContent, Root as HastRoot, Properties } from 'hast';
import type { GenericParent } from 'myst-common';

/**
 * Create a hast element for an mdast node, copying its position and applying
 * any `data.hName`, `data.hProperties` and `data.hChildren` overrides.
 *
 * This mirrors the `element(state, node, tagName, props, children)` helper that
 * mdast-util-to-hast provided before v13.
 */
function element(
  state: State,
  node: any,
  tagName: string,
  properties: Properties = {},
  children: ElementContent[] = [],
): Element {
  const result: Element = { type: 'element', tagName, properties, children };
  state.patch(node, result);
  return state.applyData(node, result) as Element;
}

const abbreviation: Handler = (state, node) =>
  element(state, node, 'abbr', { title: node.title }, state.all(node));

const subscript: Handler = (state, node) => element(state, node, 'sub', {}, state.all(node));
const superscript: Handler = (state, node) => element(state, node, 'sup', {}, state.all(node));
const image: Handler = (state, node) =>
  element(state, node, 'img', {
    src: node.url,
    alt: node.alt,
    title: node.title,
    class: classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
    height: node.height,
    width: node.width,
  });
const caption: Handler = (state, node) => element(state, node, 'figcaption', {}, state.all(node));
const legend: Handler = (state, node) =>
  element(state, node, 'div', { class: 'legend' }, state.all(node));
const container: Handler = (state, node) =>
  element(
    state,
    node,
    'figure',
    {
      id: node.identifier || node.label || undefined,
      class: classNames({ numbered: node.enumerated !== false }, node.class) || undefined,
    },
    state.all(node),
  );

const admonitionTitle: Handler = (state, node) =>
  element(state, node, 'p', { class: 'admonition-title' }, state.all(node));

const admonition: Handler = (state, node) =>
  element(
    state,
    node,
    'aside',
    {
      class: classNames({
        [node.class]: node.class, // The custom class is first!!
        admonition: true,
        [node.kind]: node.kind && node.kind !== 'admonition',
      }),
    },
    state.all(node),
  );

const captionNumber: Handler = (state, node) => {
  const captionKind = node.kind?.charAt(0).toUpperCase() + node.kind?.slice(1);
  return element(state, node, 'span', { class: 'caption-number' }, [
    u('text', `${captionKind} ${node.value}`),
  ]);
};

const math: Handler = (state, node) => {
  const attrs = { id: node.identifier || undefined, class: 'math-display' };
  if (node.value.indexOf('\n') !== -1) {
    const mathHast = element(state, node, 'div', attrs, [u('text', node.value)]);
    return element(state, node, 'pre', {}, [mathHast]);
  }
  return element(state, node, 'div', attrs, [u('text', node.value.replace(/\r?\n|\r/g, ' '))]);
};

const inlineMath: Handler = (state, node) => {
  return element(state, node, 'span', { class: 'math-inline' }, [
    u('text', node.value.replace(/\r?\n|\r/g, ' ')),
  ]);
};

const definitionList: Handler = (state, node) => element(state, node, 'dl', {}, state.all(node));
const definitionTerm: Handler = (state, node) => element(state, node, 'dt', {}, state.all(node));
const definitionDescription: Handler = (state, node) =>
  element(state, node, 'dd', {}, state.all(node));

const mystRole: Handler = (state, node) => {
  const children = [element(state, node, 'code', { class: 'kind' }, [u('text', `{${node.name}}`)])];
  if (node.value) {
    children.push(element(state, node, 'code', {}, [u('text', node.value)]));
  }
  return element(state, node, 'span', { class: 'role unhandled' }, children);
};

const mystDirective: Handler = (state, node) => {
  const directiveHeader: Element[] = [
    element(state, node, 'code', { class: 'kind' }, [u('text', `{${node.name}}`)]),
  ];
  if (node.args) {
    directiveHeader.push(element(state, node, 'code', { class: 'args' }, [u('text', node.args)]));
  }
  const directiveBody: Element[] = [];
  if (node.options) {
    const optionsString = Object.keys(node.options)
      .map((k) => `:${k}: ${node.options[k]}`)
      .join('\n');
    directiveBody.push(
      element(state, node, 'pre', {}, [
        element(state, node, 'code', { class: 'options' }, [u('text', optionsString)]),
      ]),
    );
  }
  if (node.value) {
    directiveBody.push(
      element(state, node, 'pre', {}, [element(state, node, 'code', {}, [u('text', node.value)])]),
    );
  }
  return element(state, node, 'div', { class: 'directive unhandled' }, [
    element(state, node, 'p', {}, directiveHeader),
    ...directiveBody,
  ]);
};

const block: Handler = (state, node) =>
  element(
    state,
    node,
    'div',
    { id: node.html_id || node.identifier || undefined, class: 'block', 'data-block': node.meta },
    state.all(node),
  );

const comment: Handler = (state, node) => u('comment', node.value);

const heading: Handler = (state, node) =>
  element(state, node, `h${node.depth}`, { id: node.identifier || undefined }, state.all(node));

const crossReference: Handler = (state, node) => {
  if (node.resolved) {
    return element(
      state,
      node,
      'a',
      { href: `#${node.identifier}`, title: node.title || undefined },
      state.all(node),
    );
  } else {
    return element(state, node, 'span', { class: 'reference role unhandled' }, [
      element(state, node, 'code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
      element(state, node, 'code', {}, [u('text', node.identifier)]),
    ]);
  }
};

// TODO: The defaultHandler treats the first row (and only the first row)
//       header; the mdast `tableCell.header` property is not respected.
//       For that, we need to entirely rewrite this handler.
const table: Handler = (state, node) => {
  node.data = { hProperties: { align: node.align } };
  delete node.align;
  return defaultHandlers.table(state, node);
};

const code: Handler = (state, node) => {
  const value = node.value ? node.value + '\n' : '';
  const props: Properties = {};
  if (node.identifier) {
    props.id = node.identifier;
  }
  const className = classNames({ ['language-' + node.lang]: node.lang }, node.class);
  props.className = className ? className.split(' ') : undefined;
  const codeHast = element(state, node, 'code', props, [u('text', value)]);
  const result: Element = { type: 'element', tagName: 'pre', properties: {}, children: [codeHast] };
  state.patch(node, result);
  return result;
};

const iframe: Handler = (state, node) => element(state, node, 'div', { class: 'iframe' });
const bibliography: Handler = (state, node) =>
  element(state, node, 'div', { class: 'bibliography' });
const details: Handler = (state, node) => element(state, node, 'details');
const summary: Handler = (state, node) => element(state, node, 'summary');
const embed: Handler = (state, node) => element(state, node, 'div');
const include: Handler = (state, node) => element(state, node, 'div', { file: node.file });
const linkBlock: Handler = (state, node) => element(state, node, 'a');
const margin: Handler = (state, node) => element(state, node, 'aside', { class: 'margin' });
const mdast: Handler = (state, node) => element(state, node, 'div', { id: node.id });
const mermaid: Handler = (state, node) => element(state, node, 'div', { class: 'margin' });
const myst: Handler = (state, node) => element(state, node, 'div', { class: 'margin' });
const output: Handler = (state, node) => element(state, node, 'div', { class: 'output' });
const keyboard: Handler = (state, node) => element(state, node, 'kbd', {}, state.all(node));

// These handle MyST node types, which `Handlers` does not know about
const mystHandlers: Record<string, Handler> = {
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
  keyboard,
};

export const mystToHast: Plugin<[Options?], GenericParent, HastRoot> =
  (opts) => (tree: GenericParent) => {
    // Converting an mdast root always produces a hast root
    return toHast(tree as any, {
      // mdast-util-to-hast@13 changed the default to "Back to reference N"; keep the previous label
      footnoteBackLabel: 'Back to content',
      ...opts,
      handlers: {
        ...mystHandlers,
        ...opts?.handlers,
      },
    }) as HastRoot;
  };
