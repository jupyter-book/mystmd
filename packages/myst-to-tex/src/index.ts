import type { Root, Parent } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { fileError, toText } from 'myst-common';
import { captionHandler, containerHandler } from './container';
import { renderNodeToLatex } from './tables';
import type {
  Handler,
  ITexSerializer,
  LatexResult,
  MathPlugins,
  Options,
  StateData,
} from './types';
import { getLatexImageWidth, stringToLatexMath, stringToLatexText } from './utils';
import MATH_HANDLERS, { createMathCommands } from './math';

export type { LatexResult } from './types';

const handlers: Record<string, Handler> = {
  text(node, state) {
    state.text(node.value);
  },
  paragraph(node, state) {
    state.renderChildren(node);
  },
  heading(node, state) {
    const { depth, label, enumerated } = node;
    if (state.data.nextHeadingIsFrameTitle) {
      state.write('\\frametitle{');
      state.data.nextHeadingIsFrameTitle = false;
    } else {
      const star = enumerated || state.options.beamer ? '' : '*';
      if (depth === 1) state.write(`\\section${star}{`);
      if (depth === 2) state.write(`\\subsection${star}{`);
      if (depth === 3) state.write(`\\subsubsection${star}{`);
      if (depth === 4) state.write(`\\paragraph${star}{`);
      if (depth === 5) state.write(`\\subparagraph${star}{`);
      if (depth === 6) state.write(`\\subparagraph${star}{`);
    }
    state.renderChildren(node, true);
    state.write('}');
    if (enumerated && label) {
      state.write(`\\label{${label}}`);
    }
    state.closeBlock(node);
  },
  block(node, state) {
    if (state.options.beamer) {
      // Metadata from block `+++ { "outline": true }` is put in data field.
      if (node.data?.outline) {
        // For beamer blocks that are outline, write the content as normal
        // This will hopefully just be section and subsection
        state.data.nextHeadingIsFrameTitle = false;
        state.renderChildren(node, false);
        return;
      }
      if (node.children?.[0]?.type === 'heading') {
        state.data.nextHeadingIsFrameTitle = true;
      }
      state.write('\n\n\\begin{frame}\n');
      state.renderChildren(node, false);
      state.write('\\end{frame}\n\n');
      return;
    }
    state.renderChildren(node, false);
  },
  blockquote(node, state) {
    state.renderEnvironment(node, 'quote');
  },
  code(node, state) {
    state.write('\\begin{verbatim}\n');
    state.text(node.value, true);
    state.write('\n\\end{verbatim}');
    state.closeBlock(node);
  },
  list(node, state) {
    if (state.data.isInTable) {
      node.children.forEach((child: any, i: number) => {
        state.write(node.ordered ? `${i}.~~` : '\\textbullet~~');
        state.renderChildren(child, true);
        state.write('\\newline');
        state.ensureNewLine();
      });
    } else {
      state.renderEnvironment(node, node.ordered ? 'enumerate' : 'itemize', {
        parameters: node.ordered && node.start !== 1 ? 'resume' : undefined,
      });
    }
  },
  listItem(node, state) {
    state.write('\\item ');
    state.renderChildren(node, true);
    state.write('\n');
  },
  thematicBreak(node, state) {
    state.write('\n\\bigskip\n\\centerline{\\rule{13cm}{0.4pt}}\n\\bigskip');
    state.closeBlock(node);
  },
  ...MATH_HANDLERS,
  mystRole(node, state) {
    state.renderChildren(node, true);
  },
  mystDirective(node, state) {
    state.renderChildren(node, false);
  },
  mystComment(node, state) {
    state.ensureNewLine();
    state.write(`% ${node.value.split('\n').join('\n%')}`);
    state.closeBlock(node);
  },
  strong(node, state) {
    state.renderInlineEnvironment(node, 'textbf');
  },
  emphasis(node, state) {
    state.renderInlineEnvironment(node, 'textit');
  },
  underline(node, state) {
    state.renderInlineEnvironment(node, 'uline');
  },
  inlineCode(node, state) {
    state.write('\\texttt{');
    state.text(node.value, false);
    state.write('}');
  },
  subscript(node, state) {
    state.renderInlineEnvironment(node, 'textsubscript');
  },
  superscript(node, state) {
    state.renderInlineEnvironment(node, 'textsuperscript');
  },
  delete(node, state) {
    // \usepackage[normalem]{ulem}
    state.renderInlineEnvironment(node, 'sout');
  },
  break(node, state) {
    state.write('\\\\');
    state.ensureNewLine();
  },
  abbreviation(node, state) {
    // TODO: \newacronym{gcd}{GCD}{Greatest Common Divisor}
    // https://www.overleaf.com/learn/latex/glossaries
    state.renderChildren(node, true);
  },
  link(node, state) {
    const href = state.options.localizeLink?.(node.url) ?? node.url;
    if (node.children[0]?.value === href) {
      // URL is the same
      state.write(`\\url{${href}}`);
      return;
    }
    state.write(`\\href{${href}}{`);
    state.renderChildren(node, true);
    state.write(`}`);
  },
  admonition(node, state) {
    state.renderEnvironment(node, 'framed');
  },
  admonitionTitle(node, state) {
    state.renderInlineEnvironment(node, 'textbf');
    state.write('\\\\\n');
  },
  table: renderNodeToLatex,
  image(node, state) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { width: nodeWidth, url: nodeSrc, align } = node;
    const src = state.options.localizeImageSrc?.(nodeSrc) || nodeSrc;
    const width = getLatexImageWidth(nodeWidth);
    //   let align = 'center';
    //   switch (nodeAlign?.toLowerCase()) {
    //     case 'left':
    //       align = 'flushleft';
    //       break;
    //     case 'right':
    //       align = 'flushright';
    //       break;
    //     default:
    //       break;
    //   }
    //   if (!caption) {
    //     const template = `
    // \\begin{${align}}
    //   \\includegraphics[width=${width / 100}\\linewidth]{${src}}
    // \\end{${align}}\n`;
    //     state.write(template);
    //     return;
    //   }
    state.write(`\\includegraphics[width=${width}]{${src}}`);
    state.closeBlock(node);
  },
  container: containerHandler,
  caption: captionHandler,
  captionNumber: () => undefined,
  crossReference(node, state) {
    // Look up reference and add the text
    const text = (node.template ?? toText(node))?.replace(/\s/g, '~') || '%s';
    const id = state.options.localizeId?.(node.label) || node.label;
    state.write(text.replace(/%s/g, `\\ref{${id}}`));
  },
  citeGroup(node, state) {
    const tp = node.kind === 'narrative' ? 't' : 'p';
    state.write(`\\cite${tp}{`);
    state.renderChildren(node, true, ', ');
    state.write('}');
  },
  cite(node, state, parent) {
    if (parent.type === 'citeGroup') {
      state.write(node.label);
    } else {
      state.write(`\\cite{${node.label}}`);
    }
  },
};

class TexSerializer implements ITexSerializer {
  file: VFile;
  data: StateData;
  options: Options;
  handlers: Record<string, Handler>;
  mathPlugins: MathPlugins;

  constructor(file: VFile, opts?: Options) {
    file.result = '';
    this.file = file;
    this.options = opts ?? {};
    this.data = {};
    this.handlers = opts?.handlers ?? handlers;
    this.mathPlugins = {}; // initialize empty!
  }

  get out(): string {
    return this.file.result as string;
  }

  write(value: string) {
    this.file.result += value;
  }

  text(value: string, mathMode = false) {
    const escaped = mathMode ? stringToLatexMath(value) : stringToLatexText(value);
    this.write(escaped);
  }

  trimEnd() {
    this.file.result = this.out.trimEnd();
  }

  ensureNewLine(trim = false) {
    if (trim) this.trimEnd();
    if (this.out.endsWith('\n')) return;
    this.write('\n');
  }

  renderChildren(node: Partial<Parent>, inline = false, delim = '') {
    const numChildren = node.children?.length ?? 0;
    node.children?.forEach((child, index) => {
      const handler = this.handlers[child.type];
      if (handler) {
        handler(child, this, node);
      } else {
        fileError(this.file, `Unhandled LaTeX conversion for node of "${child.type}"`, {
          node: child,
          source: 'myst-to-tex',
        });
      }
      if (delim && index + 1 < numChildren) this.write(delim);
    });
    if (!inline) this.closeBlock(node);
  }

  renderEnvironment(node: any, env: string, opts?: { parameters?: string; arguments?: string[] }) {
    const optsInBrackets = opts?.parameters ? `[${opts.parameters}]` : '';
    const optsInBraces = opts?.arguments ? `{${opts.arguments.join('}{')}}` : '';
    this.file.result += `\\begin{${env}}${optsInBrackets}${optsInBraces}\n`;
    this.renderChildren(node, true);
    this.ensureNewLine(true);
    this.file.result += `\\end{${env}}`;
    this.closeBlock(node);
  }

  renderInlineEnvironment(node: any, env: string, opts?: { after?: string }) {
    this.file.result += `\\${env}{`;
    this.renderChildren(node, true);
    this.trimEnd();
    this.file.result += '}';
    if (opts?.after) {
      this.ensureNewLine(true);
      this.write(opts.after);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  closeBlock(node: any) {
    this.ensureNewLine(true);
    this.file.result += '\n';
  }
}

const plugin: Plugin<[Options?], Root, VFile> = function (opts) {
  this.Compiler = (node, file) => {
    const state = new TexSerializer(file, opts ?? { handlers });
    state.renderChildren(node);
    const tex = (file.result as string).trim();
    const result: LatexResult = {
      imports: [],
      commands: [...createMathCommands(state.mathPlugins)],
      value: tex,
    };
    file.result = result;
    return file;
  };

  return (node: Root) => {
    // Preprocess
    return node;
  };
};

export default plugin;
