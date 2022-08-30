import type { Root } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { captionHandler, containerHandler } from './container';
import { renderNodeToLatex } from './tables';
import type { Handler, ITexSerializer, Options } from './types';
import { DEFAULT_IMAGE_WIDTH } from './types';
import { stringToLatexMath, stringToLatexText } from './utils';

const handlers: Record<string, Handler> = {
  text(node, state) {
    state.text(node.value);
  },
  paragraph(node, state) {
    state.renderChildren(node);
  },
  heading(node, state) {
    const { depth, identifier, enumerated } = node;
    const star = enumerated ? '' : '*';
    if (depth === 1) state.write(`\\section${star}{`);
    if (depth === 2) state.write(`\\subsection${star}{`);
    if (depth === 3) state.write(`\\subsubsection${star}{`);
    if (depth === 4) state.write(`\\paragraph${star}{`);
    if (depth === 5) state.write(`\\subparagraph${star}{`);
    if (depth === 6) state.write(`\\subparagraph${star}{`);
    state.renderChildren(node, true);
    state.write('}');
    if (enumerated && identifier) {
      state.write(`\\label{${identifier}}`);
    }
    state.closeBlock(node);
  },
  block(node, state) {
    // TODO: write metadata to a comment?
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
    if (state.isInTable) {
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
  math(node, state) {
    const { identifier, enumerated } = node;
    if (state.isInTable) {
      state.write('\\(\\displaystyle ');
      state.write(node.value);
      state.write(' \\)');
    } else {
      // TODO: AMS math
      state.write(`\\begin{equation${enumerated === false ? '*' : ''}}\n`);
      if (identifier) {
        state.write(`\\label{${identifier}}`);
      }
      state.ensureNewLine();
      state.write(node.value);
      state.ensureNewLine(true);
      state.write(`\\end{equation${enumerated === false ? '*' : ''}}`);
    }
    if (!state.isInTable) state.closeBlock(node);
  },
  inlineMath(node, state) {
    state.write('$');
    state.text(node.value, true);
    state.write('$');
  },
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
    const width = Math.round(nodeWidth ?? DEFAULT_IMAGE_WIDTH);
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
    state.write(`\\includegraphics[width=${width / 100}\\linewidth]{${src}}`);
    state.closeBlock(node);
  },
  container: containerHandler,
  caption: captionHandler,
  captionNumber: () => undefined,
  crossReference(node, state) {
    // Look up reference and add the text
    const text = 'Figure~%s';
    const id = state.options.localizeId?.(node.identifier) || node.identifier;
    state.write(text.replace(/%s/g, `\\ref{${id}}`));
  },
};

class TexSerializer implements ITexSerializer {
  file: VFile;
  options: Options;
  handlers: Record<string, Handler>;

  isInTable = false;
  longFigure = false;

  constructor(file: VFile, opts?: Options) {
    file.result = '';
    this.file = file;
    this.options = opts ?? {};
    this.handlers = this.options.handlers ?? handlers;
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

  renderChildren(node: any, inline = false) {
    node.children?.forEach((child: any) => {
      const handler = this.handlers[child.type];
      if (handler) {
        handler(child, this, node);
      } else {
        console.log(`myst-to-tex: unhandled node of ${child.type}`, child);
      }
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
    const writer = new TexSerializer(file, opts?.handlers ?? handlers);
    writer.renderChildren(node);
    file.result = (file.result as string).trim();
    return file;
  };

  return (node: Root) => {
    // Preprocess
    return node;
  };
};

export default plugin;
