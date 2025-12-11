import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

const HEADER_REGEX = /((?<before>[\s\S]*?)\s+){0,1}\^\^\^(\s+(?<after>[\s\S]*)){0,1}/;

export const cardDirective: DirectiveSpec = {
  name: 'card',
  alias: ['grid-item-card'],
  arg: {
    type: 'myst',
    doc: 'The title of the card, usually shown as bolded text at the top of the card.',
  },
  options: {
    url: {
      type: String,
      alias: ['link'],
      doc: 'Turns the card into a link, can be internal or external.',
    },
    header: {
      type: 'myst',
      doc: 'Adds a header to the card.',
    },
    footer: {
      type: 'myst',
      doc: 'Adds a footer to the card.',
    },
    // // https://sphinx-design.readthedocs.io/en/furo-theme/cards.html#card-options
    // width
    // margin
    // padding
    // 'text-align'
    // 'img-top'
    // 'img-background'
    // 'img-bottom'
    // link
    // // This should be removed, it is picked up just as any other link that can also be a reference
    // 'link-type'
    // 'link-alt'
    // // This should just be a class that is recognized (similar to dropdown)
    // shadow
    // 'class-card'
    // // I feel like all of these should *not* be included.
    // // Instead us a css selector on `class`: for example, `.card.my-class > header { customCss: prop; }`
    // 'class-header'
    // 'class-body'
    // 'class-title'
    // 'class-footer'
    // 'class-img-top'
    // 'class-img-bottom'
    // // https://sphinx-design.readthedocs.io/en/furo-theme/grids.html#grid-item-card-options
    // columns
    // 'class-item' // This seems the same as `class-card`?
  },
  body: {
    type: 'myst',
    required: true,
    doc: 'Main body content of the card.',
  },
  run(data: DirectiveData): GenericNode[] {
    const { url, header, footer } = data.options || {};
    let headerChildren: GenericNode[];
    let bodyChildren: GenericNode[];
    let footerChildren: GenericNode[];
    if (header || footer) {
      headerChildren = header ? [{ type: 'paragraph', children: header as GenericNode[] }] : [];
      bodyChildren = data.body as GenericNode[];
      footerChildren = footer ? [{ type: 'paragraph', children: footer as GenericNode[] }] : [];
    } else {
      const [beforeHeaderDelim, afterHeaderDelim] = splitChildrenOnDelim(
        data.body as GenericNode[],
      );
      headerChildren = afterHeaderDelim.length ? beforeHeaderDelim : [];
      const nonHeaderChildren = afterHeaderDelim.length ? afterHeaderDelim : beforeHeaderDelim;
      [bodyChildren, footerChildren] = splitChildrenOnBlockBreak(nonHeaderChildren);
    }
    const children: GenericNode[] = [];
    if (headerChildren.length) {
      children.push({
        type: 'header',
        children: headerChildren,
      });
    }
    if (data.arg) {
      children.push({
        type: 'cardTitle',
        children: data.arg as GenericNode[],
      });
    }
    children.push(...bodyChildren);
    if (footerChildren.length) {
      children.push({
        type: 'footer',
        children: footerChildren,
      });
    }
    return [
      {
        type: 'card',
        url: url as string | undefined,
        children,
      },
    ];
  },
};

/**
 * Splits paragraph node into two paragraph nodes based on delimiter string
 *
 * The delimiter must be in a text node that is a direct child of the paragraph
 */
export function splitParagraphNode(node: GenericNode): {
  before: GenericNode | null;
  after: GenericNode | null;
  post: boolean;
} {
  const preChildren: GenericNode[] = [];
  const postChildren: GenericNode[] = [];
  let post = false;
  node.children?.forEach((child) => {
    if (post) {
      postChildren.push(child);
      return;
    }
    if (child.type !== 'text' || !child.value) {
      preChildren.push(child);
      return;
    }
    const value = child.value as string;
    const match = HEADER_REGEX.exec(value);
    if (!match) {
      preChildren.push(child);
      return;
    }
    post = true;
    const { before, after } = match.groups ?? {};
    if (before) {
      preChildren.push({ type: 'text', value: before });
    }
    if (after) {
      postChildren.push({ type: 'text', value: after });
    }
  });
  const output = {
    before: preChildren.length ? { ...node, children: preChildren } : null,
    after: postChildren.length ? { ...node, children: postChildren } : null,
    post,
  };
  return output;
}

function splitChildrenOnDelim(children: GenericNode[]) {
  const preChildren: GenericNode[] = [];
  const postChildren: GenericNode[] = [];
  let post = false;
  children.forEach((child) => {
    if (post) {
      postChildren.push(child);
    } else if (child.type !== 'paragraph') {
      preChildren.push(child);
    } else {
      const split = splitParagraphNode(child);
      const { before, after } = split;
      post = split.post;
      if (before) {
        preChildren.push(before);
      }
      if (after) {
        postChildren.push(after);
      }
    }
  });
  return [preChildren, postChildren];
}

/**
 * Splits list of nodes into two lists, before and after the first
 * instance of a given node type (this node is lost).
 */
function splitChildrenOnBlockBreak(children: GenericNode[]) {
  const preChildren: GenericNode[] = [];
  const postChildren: GenericNode[] = [];
  let post = false;
  children.forEach((child) => {
    if (post) {
      postChildren.push(child);
    } else if (child.type !== 'blockBreak') {
      preChildren.push(child);
    } else {
      post = true;
    }
  });
  return [preChildren, postChildren];
}

//   const cardTitleHastHandler: Handler = (h, node) => h(node, 'div'),
//   const footerHastHandler: Handler = (h, node) => h(node, 'footer'),
//   const headerHastHandler: Handler = (h, node) => h(node, 'header'),
//   const cardHastHandler: Handler = (h, node) => h(node, 'details'),
