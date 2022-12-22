import type { Handler } from './types';
import { getArguments, getPositionExtents, originalValue, texToText } from './utils';

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
  macro_maketitle(node, state) {
    // no need to capture the maketitle, just close any paragraphs
    state.closeParagraph();
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
};
