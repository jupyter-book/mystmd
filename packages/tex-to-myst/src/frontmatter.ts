import type { GenericNode } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { Handler, ITexParser } from './types';
import { getArguments, getPositionExtents, originalValue, texToText } from './utils';

function getContentFromRenderedSpan(node: GenericNode | undefined): string | GenericNode[] {
  if (!node) return '';
  if (node?.children?.length === 1 && node?.children?.[0].type === 'text') {
    return node?.children?.[0].value ?? '';
  } else {
    return node?.children ?? '';
  }
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
  if (!affilNumber) {
    const lastAuthor = fm.authors[fm.authors.length - 1];
    if (!lastAuthor.affiliations) lastAuthor.affiliations = [];
    lastAuthor.affiliations.push(fmAffil.name as any);
  } else {
    (fm as any).affiliations.push(fmAffil);
  }
}

export const FRONTMATTER_HANDLERS: Record<string, Handler> = {
  macro_usepackage(node, state) {
    state.closeParagraph();
    const packages = texToText(getArguments(node, 'group'))
      .split(',')
      .map((p) => p.trim())
      .filter((p) => !!p);
    packages.forEach((p) => {
      if (state.data.packages.indexOf(p) === -1) {
        state.data.packages.push(p);
        return;
      }
      state.warn(`Multiple packages imported with the same name: "${p}"`, node);
    });
  },
  macro_newcommand(node, state) {
    state.closeParagraph();
    const [nameNode, macroNode] = getArguments(node, 'group');
    getPositionExtents(macroNode);
    const name = originalValue(state.tex, { position: getPositionExtents(nameNode) });
    const macro = originalValue(state.tex, { position: getPositionExtents(macroNode) });
    if (state.data.macros[name]) {
      state.warn(`Multiple macros defined with the same value: "${name}": "${macro}"`, node);
    }
    state.data.macros[name] = macro;
  },
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
    // instead of closing, we are going to pop it off the stack
    const renderedTitle = state.stack.pop();
    state.data.frontmatter.title = renderedTitle?.children as any;
    if (shortTitleNode) {
      state.openNode('span');
      state.renderChildren(shortTitleNode);
      state.closeParagraph();
      // instead of closing, we are going to pop it off the stack
      const renderedShortTitle = state.stack.pop();
      state.data.frontmatter.short_title = renderedShortTitle?.children as any;
    }
  },
  macro_author(node, state) {
    state.closeParagraph();
    const fm = state.data.frontmatter;
    if (!fm.authors) fm.authors = [];
    const [affilNode, emailNode] = getArguments(node, 'argument');
    const [author] = getArguments(node, 'group');
    state.openNode('span');
    state.renderChildren(author);
    state.closeParagraph();
    const renderedAuthor = state.stack.pop();
    const fmAuthor: Required<PageFrontmatter>['authors'][0] = {};
    fmAuthor.name = getContentFromRenderedSpan(renderedAuthor) as any;
    const affilNumber = texToText(affilNode);
    const email = texToText(emailNode);
    if (affilNumber) {
      fmAuthor.affiliations = affilNumber.split(/,|;|&/).map((a) => a.trim());
    }
    if (email) {
      fmAuthor.corresponding = true;
      fmAuthor.email = email;
    }
    state.data.frontmatter.authors?.push(fmAuthor);
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
    const email = getContentFromRenderedSpan(renderedEmail);
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
    state.openBlock();
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
};
