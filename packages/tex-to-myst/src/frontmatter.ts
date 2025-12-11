import type { GenericNode } from 'myst-common';
import { copyNode, toText, mergeTextNodes } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import type { Handler, ITexParser } from './types.js';
import { getArguments, getPositionExtents, originalValue, texToText } from './utils.js';
import { createTheoremHandler } from './algorithms.js';
import { createMacroHandler } from './math.js';

function getContentFromRenderedSpan(node: GenericNode | undefined): string | GenericNode {
  if (!node) return '';
  const copy = mergeTextNodes(copyNode(node));
  if (copy?.children?.length === 1 && copy?.children?.[0].type === 'text') {
    return copy?.children?.[0].value?.trim() ?? '';
  } else {
    return copy ?? '';
  }
}

function childrenOrString(node: GenericNode | string | undefined): string | GenericNode[] {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node;
  return node?.children ?? '';
}

// https://stackoverflow.com/a/46181
export function validateEmail(email: string) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function extractEmailFromName(author: { name?: GenericNode | string; email?: string }): {
  name?: GenericNode | string;
  email?: string;
} {
  const { name } = author;
  if (!author.email && typeof name === 'string') {
    const matcher =
      /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
    const match = name.match(matcher);

    if (match) {
      author.email = match[0];
      author.name = name.replace(matcher, '').trim();
    } else {
      author.name = name;
    }
  } else {
    author.name = name;
  }
  return author;
}

function getAuthorOrEmailFromNode(node: GenericNode | string) {
  if (typeof node === 'string') return extractEmailFromName({ name: node });
  const copy = copyNode(node);
  remove(copy, 'break');
  const author: { name?: GenericNode | string; email?: string } = {};
  (selectAll('inlineCode,link', copy) as GenericNode[]).forEach((n) => {
    const maybeEmail = toText(n);
    if (validateEmail(maybeEmail)) {
      author.email = maybeEmail;
      n.type = 'remove';
      return;
    }
    if (n.url && validateEmail(n.url.replace(/^mailto:/, ''))) {
      author.email = n.url.replace(/^mailto:/, '');
      n.type = 'remove';
    }
  });
  remove(copy, 'remove');
  author.name = getContentFromRenderedSpan(copy);
  return extractEmailFromName(author);
}

function addAffiliation(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
  const fm = state.data.frontmatter;
  if (!fm.authors) fm.authors = [];
  if (!(fm as any).affiliations) (fm as any).affiliations = [];
  const affilNumber = texToText(getArguments(node, 'argument'));
  const [affil] = getArguments(node, 'group');
  state.openNode('span');
  state.renderChildren(affil);
  state.closeParagraph();
  const renderedAffil = state.stack.pop();
  const fmAffil = { id: affilNumber, name: getContentFromRenderedSpan(renderedAffil) };
  if (!affilNumber && fm.authors.length > 0) {
    const lastAuthor = fm.authors[fm.authors.length - 1];
    if (!lastAuthor.affiliations) lastAuthor.affiliations = [];
    lastAuthor.affiliations.push(childrenOrString(fmAffil.name) as any);
  } else {
    (fm as any).affiliations.push(fmAffil);
  }
}

function addKnownMacros(state: ITexParser, name: string) {
  switch (name) {
    case 'siunitx':
      state.data.macros['\\si'] = '\\mathrm{ #1 }';
      return;
    default:
      break;
  }
}

function cleanMacro(macro: string) {
  // Remove any leading and trailing dollars, these aren't used in a math macro context
  return macro.trim().replace(/(^\$)|(\$$)/g, '');
}

function newCommand(opts?: { override?: boolean; warn?: 'defined' | 'undefined' }) {
  return (node: GenericNode, state: ITexParser) => {
    state.closeParagraph();
    const [nameNode, macroNode] = getArguments(node, 'group');
    getPositionExtents(macroNode);
    const name = originalValue(state.tex, { position: getPositionExtents(nameNode) });
    const macro = originalValue(state.tex, { position: getPositionExtents(macroNode) });
    if (state.data.macros[name]) {
      if (opts?.warn === 'defined') {
        state.warn(
          `Multiple macros defined with the same value${opts?.override ? '; overriding' : ''}: "${name}": "${macro}"`,
          node,
        );
      }
      if (!opts?.override) return;
    }
    if (!state.data.macros[name] && opts?.warn === 'undefined') {
      state.warn(`Attempting to redefine a currently undefined macro: "${name}": "${macro}"`, node);
    }
    state.data.macros[name] = cleanMacro(macro);
    const macroName = name.replace(/^\\/, '');
    // TODO: Need to update the parsing based on any arguments defined here
    state.data.dynamicHandlers[`macro_${macroName}`] = createMacroHandler(name, macroNode);
  };
}

const FRONTMATTER_HANDLERS: Record<string, Handler> = {
  macro_usepackage(node, state) {
    state.closeParagraph();
    const packages = texToText(getArguments(node, 'group'))
      .split(',')
      .map((p) => p.trim())
      .filter((p) => !!p);
    packages.forEach((p) => {
      if (state.data.packages.indexOf(p) === -1) {
        addKnownMacros(state, p);
        state.data.packages.push(p);
        return;
      }
      state.warn(`Multiple packages imported with the same name: "${p}"`, node);
    });
  },
  /** `newcommand` defines a new command, and makes an error if it is already defined. */
  macro_newcommand: newCommand({ warn: 'defined', override: true }),
  /** `renewcommand` redefines a predefined command, and makes an error if it is not yet defined. */
  macro_renewcommand: newCommand({ warn: 'undefined', override: true }),
  /** `providecommand` defines a new command if it isn't already defined. */
  macro_providecommand: newCommand({ override: false }),
  macro_date(node, state) {
    state.closeParagraph();
    // No action for now
  },
  macro_maketitle(node, state) {
    state.closeParagraph();
    // Indicate that we are past this in the tree.
    state.data.maketitle = true;
  },
  macro_tableofcontents(node, state) {
    state.closeParagraph();
    // No action for now
  },
  macro_appendix(node, state) {
    state.closeParagraph();
    state.closeBlock();
    state.data.appendix = true;
  },
  macro_title(node, state) {
    // no need to capture the maketitle, just close any paragraphs
    state.closeParagraph();
    const [shortTitleNode] = getArguments(node, 'argument');
    const [titleNode] = getArguments(node, 'group');
    state.openNode('span');
    state.renderChildren(titleNode);
    state.closeParagraph();
    if (state.data.frontmatter.title) {
      state.warn('Multiple titles defined in document', node);
      state.closeNode();
    } else {
      // instead of closing, we are going to pop it off the stack
      const renderedTitle = state.stack.pop();
      state.data.frontmatter.title = childrenOrString(
        getContentFromRenderedSpan(renderedTitle),
      ) as any;
    }
    if (shortTitleNode) {
      state.openNode('span');
      state.renderChildren(shortTitleNode);
      state.closeParagraph();
      if (state.data.frontmatter.short_title) {
        state.warn('Multiple short titles defined in document', node);
        state.closeNode();
      } else {
        // instead of closing, we are going to pop it off the stack
        const renderedShortTitle = state.stack.pop();
        state.data.frontmatter.short_title = childrenOrString(
          getContentFromRenderedSpan(renderedShortTitle),
        ) as any;
      }
    }
  },
  macro_author(node, state) {
    state.closeParagraph();
    const fm = state.data.frontmatter;
    if (!fm.authors) fm.authors = [];
    const [affilNode, emailNode] = getArguments(node, 'argument');
    const [author] = getArguments(node, 'group');
    state.openNode('span');
    state.data.andCallback = () => {
      // This is called, maybe multiple times if the `\and` is used in the author block.
      state.closeParagraph();
      const nextAuthor = state.stack.pop();
      const andAuthor: Required<PageFrontmatter>['authors'][0] = {};
      const { name, email } = getAuthorOrEmailFromNode(getContentFromRenderedSpan(nextAuthor));
      andAuthor.name = childrenOrString(name) as any;
      if (email) {
        andAuthor.corresponding = true;
        andAuthor.email = email;
      }
      state.data.frontmatter.authors?.push(andAuthor);
      state.openNode('span');
    };
    state.renderChildren(author);
    delete state.data.andCallback;
    state.closeParagraph();
    const renderedAuthor = state.stack.pop();
    const fmAuthor: Required<PageFrontmatter>['authors'][0] = {};
    const { name, email } = getAuthorOrEmailFromNode(getContentFromRenderedSpan(renderedAuthor));
    fmAuthor.name = childrenOrString(name) as any;
    if (email) {
      fmAuthor.corresponding = true;
      fmAuthor.email = email;
    }
    const affilNumber = texToText(affilNode);
    const emailText = texToText(emailNode);
    if (affilNumber) {
      fmAuthor.affiliations = affilNumber.split(/,|;|&/).map((a) => a.trim());
    }
    if (emailText) {
      fmAuthor.corresponding = true;
      fmAuthor.email = emailText;
    }
    state.data.frontmatter.authors?.push(fmAuthor);
  },
  macro_thanks(node, state) {
    // Just write directly?? This is sometimes the affiliation...
    const content = getArguments(node, 'group');
    // Put in a single space, as sometimes the commands don't have spaces
    state.text(' ');
    state.renderChildren({ content });
  },
  macro_affil: addAffiliation,
  macro_affiliation: addAffiliation,
  macro_email(node, state) {
    if (state.data.maketitle) {
      // If we have already made the title, just render the contents as a link
      return;
    }
    state.closeParagraph();
    const fm = state.data.frontmatter;
    const lastAuthor = fm.authors?.[fm.authors.length - 1];
    const [emailNode] = getArguments(node, 'group');
    state.openNode('span');
    state.renderChildren(emailNode);
    state.closeParagraph();
    const renderedEmail = state.stack.pop();
    const email = childrenOrString(getContentFromRenderedSpan(renderedEmail));
    if (!lastAuthor) {
      state.warn(
        `Unexpected use of email "${texToText(email)}" without defining authors.`,
        node,
        'email',
      );
      return;
    }
    lastAuthor.corresponding = true;
    lastAuthor.email = email as any;
  },
  env_abstract(node, state) {
    state.openBlock({ data: { part: 'abstract' } });
    state.renderChildren(node);
    state.closeBlock();
  },
  macro_keywords(node, state) {
    state.closeParagraph();
    const keywords = texToText(node);
    state.data.frontmatter.keywords = keywords
      .split(/,|;/)
      .map((k) => k.trim())
      .filter((k) => !!k);
  },
  macro_newtheorem(node, state) {
    // https://tex.stackexchange.com/questions/155710/understanding-the-arguments-in-newtheorem-e-g-newtheoremtheoremtheoremsec/155714#155714
    const [, nameNode, x, labelNode, y] = node.args ?? [];
    const name = texToText(nameNode);
    const label = texToText(labelNode);
    const countWith = texToText(x) || undefined;
    const countAfter = texToText(y) || undefined;
    state.data.theorems[name] = { label, countWith, countAfter };
    // We create a handler now for future nodes
    state.data.dynamicHandlers[`env_${name}`] = createTheoremHandler(name);
  },
};

FRONTMATTER_HANDLERS.macro_Author = FRONTMATTER_HANDLERS.macro_author;

export { FRONTMATTER_HANDLERS };
