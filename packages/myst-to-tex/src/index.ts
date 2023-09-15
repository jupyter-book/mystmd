import type { Root, Parent, Code } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { GenericNode, References } from 'myst-common';
import { fileError, toText } from 'myst-common';
import { captionHandler, containerHandler } from './container.js';
import { renderNodeToLatex } from './tables.js';
import type { Handler, ITexSerializer, LatexResult, Options, StateData } from './types.js';
import {
  getClasses,
  getLatexImageWidth,
  hrefToLatexText,
  stringToLatexMath,
  stringToLatexText,
} from './utils.js';
import MATH_HANDLERS, { withRecursiveCommands } from './math.js';
import { selectAll } from 'unist-util-select';
import type { DefinitionDescription, DefinitionTerm, FootnoteDefinition } from 'myst-spec-ext';
import { transformLegends } from './legends.js';

export type { LatexResult } from './types.js';

const glossaryReferenceHandler: Handler = (node, state) => {
  if (!node.identifier) return;
  const entry = state.glossary[node.identifier];
  if (!entry) {
    fileError(state.file, `Unknown glossary entry identifier "${node.identifier}"`, {
      node,
      source: 'myst-to-tex',
    });
    return;
  }
  state.write('\\gls{');
  state.write(node.identifier);
  state.write('}');
};

const createFootnoteDefinitions = (tree: Root) => Object.fromEntries(
  selectAll('footnoteDefinition', tree).map((node) => {
    const fn = node as FootnoteDefinition;
    return [fn.identifier, fn];
  }),
);

const createGlossaryDefinitions = (tree: Root) => Object.fromEntries(
  selectAll('glossary > definitionList > *', tree)
    .map((node, i, siblings) => {
      if (node.type !== "definitionTerm") {
        return [];
      }
      const dt = node as GenericNode;
      if (!dt.identifier) {
        return [];
      }
      const dd = siblings[i + 1];
      if (dd === undefined || dd.type !== 'definitionDescription') {
        throw new Error(`Definition term has no associated description`);
      }
      return [dt.identifier, [dt, dd]];
    })
    .filter((x) => x.length > 0) // remove empty
);

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
      const star = enumerated !== false || state.options.beamer ? '' : '*';
      if (depth === 1) state.write(`\\section${star}{`);
      if (depth === 2) state.write(`\\subsection${star}{`);
      if (depth === 3) state.write(`\\subsubsection${star}{`);
      if (depth === 4) state.write(`\\paragraph${star}{`);
      if (depth === 5) state.write(`\\subparagraph${star}{`);
      if (depth === 6) state.write(`\\subparagraph${star}{`);
    }
    state.renderChildren(node, true);
    state.write('}');
    if (enumerated !== false && label) {
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
  definitionList(node, state) {
    state.write('\\begin{description}\n');
    state.renderChildren(node, true);
    state.ensureNewLine();
    state.write('\\end{description}');
    state.closeBlock(node);
  },
  definitionTerm(node, state) {
    state.ensureNewLine();
    state.write('\\item[');
    state.renderChildren(node, true);
    state.write('] ');
  },
  definitionDescription(node, state) {
    state.renderChildren(node, true);
  },
  code(node: Code, state) {
    let start = '\\begin{verbatim}\n';
    let end = '\n\\end{verbatim}';

    if (getClasses(node.class).includes('listings') && node.lang !== undefined) {
      state.usePackages('listings');
      start = `\\begin{lstlisting}[language=${node.lang}]\n`;
      end = '\n\\end{lstlisting}';
    } else if (getClasses(node.class).includes('minted') && node.lang !== undefined) {
      state.usePackages('minted');
      start = `\\begin{minted}{${node.lang}}\n`;
      end = '\n\\end{minted}';
    }
    state.write(start);
    state.text(node.value, true);
    state.write(end);
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
  comment(node, state) {
    state.ensureNewLine();
    state.write(`% ${node.value?.split('\n').join('\n% ') ?? ''}`);
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
    state.usePackages('ulem');
    state.renderInlineEnvironment(node, 'sout');
  },
  break(node, state) {
    // Use \newline instead of `\\` for breaks in LaTeX, it works in all phrasing contexts.
    // `\\` is used in tables to denote a new row.
    state.write('\\newline');
    state.ensureNewLine();
  },
  abbreviation(node, state) {
    // TODO: \newacronym{gcd}{GCD}{Greatest Common Divisor}
    // https://www.overleaf.com/learn/latex/glossaries
    state.renderChildren(node, true);
  },
  glossary() {
    // Glossary definitions are handled at once when constructing the serializer
    // Nothing to do here
  },
  link(node, state) {
    state.usePackages('url', 'hyperref');
    const href = node.url;
    if (node.children[0]?.value === href) {
      // URL is the same
      state.write('\\url{');
      state.write(hrefToLatexText(href));
      state.write('}');
      return;
    }
    state.write('\\href{');
    state.write(hrefToLatexText(href));
    state.write('}{');
    state.renderChildren(node, true);
    state.write('}');
  },
  admonition(node, state) {
    state.usePackages('framed');
    state.renderEnvironment(node, 'framed');
  },
  admonitionTitle(node, state) {
    state.renderInlineEnvironment(node, 'textbf');
    state.write('\\\\\n');
  },
  table: renderNodeToLatex,
  image(node, state) {
    state.usePackages('graphicx');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { width: nodeWidth, url: nodeSrc, align } = node;
    const src = nodeSrc;
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
  crossReference(node, state, parent) {
    if (node.kind === 'definitionTerm') {
      glossaryReferenceHandler(node, state, parent);
      return;
    }
    // Look up reference and add the text
    const usedTemplate = node.template?.includes('%s') ? node.template : undefined;
    const text = (usedTemplate ?? toText(node))?.replace(/\s/g, '~') || '%s';
    const id = node.label;
    state.write(text.replace(/%s/g, `\\ref{${id}}`));
  },
  citeGroup(node, state) {
    if (state.options.citestyle === 'numerical-only') {
      state.write('\\cite{');
    } else if (state.options.bibliography === 'biblatex') {
      const command = node.kind === 'narrative' ? 'textcite' : 'parencite';
      state.write(`\\${command}{`);
    } else {
      const tp = node.kind === 'narrative' ? 't' : 'p';
      state.write(`\\cite${tp}{`);
    }
    state.renderChildren(node, true, ', ');
    state.write('}');
  },
  cite(node, state, parent) {
    if (!state.options.bibliography) {
      state.usePackages('natbib');
      // Don't include biblatex in the package list
    }
    if (parent.type === 'citeGroup') {
      state.write(node.label);
    } else if (state.options.bibliography === 'biblatex') {
      state.write(`\\textcite{${node.label}}`);
    } else {
      state.write(`\\cite{${node.label}}`);
    }
  },
  embed(node, state) {
    state.renderChildren(node, true);
  },
  include(node, state) {
    state.renderChildren(node, true);
  },
  footnoteReference(node, state) {
    if (!node.identifier) return;
    const footnote = state.footnotes[node.identifier];
    if (!footnote) {
      fileError(state.file, `Unknown footnote identifier "${node.identifier}"`, {
        node,
        source: 'myst-to-tex',
      });
      return;
    }
    state.write('\\footnote{');
    state.renderChildren(footnote, true);
    state.trimEnd();
    state.write('}');
  },
  footnoteDefinition() {
    // Nothing!
  },
  si(node, state) {
    state.usePackages('siunitx');
    if (node.number == null) {
      state.write(`\\unit{${node.units?.map((u: string) => `\\${u}`).join('') ?? ''}}`);
    } else {
      state.write(
        `\\qty{${node.number}}{${node.units?.map((u: string) => `\\${u}`).join('') ?? ''}}`,
      );
    }
  },
};

class TexSerializer implements ITexSerializer {
  file: VFile;
  data: StateData;
  options: Options;
  handlers: Record<string, Handler>;
  references: References;
  footnotes: Record<string, FootnoteDefinition>;
  glossary: Record<string, [DefinitionTerm, DefinitionDescription]>;

  constructor(file: VFile, tree: Root, opts?: Options) {
    file.result = '';
    this.file = file;
    this.options = opts ?? {};
    this.data = { mathPlugins: {}, imports: new Set() };
    this.handlers = opts?.handlers ?? handlers;
    this.references = opts?.references ?? {};
    this.footnotes = createFootnoteDefinitions(tree);
    // Improve: render definition when encountering terms
    this.glossary = createGlossaryDefinitions(tree);
    this.renderChildren(tree);
  }

  get out(): string {
    return this.file.result as string;
  }

  usePackages(...packageNames: string[]) {
    packageNames.forEach((p) => {
      this.data.imports.add(p);
    });
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
    transformLegends(node);
    const state = new TexSerializer(file, node, opts ?? { handlers });
    const tex = (file.result as string).trim();
    const glossaryEntries = Object.keys(state.glossary).map(k => ({
      key: k,
      name: (state.glossary[k][0].children[0] as GenericNode).value || '',
      description: (state.glossary[k][1].children[0] as GenericNode).value || '',
    }));
    const result: LatexResult = {
      imports: [...state.data.imports],
      glossary: glossaryEntries,
      commands: withRecursiveCommands(state),
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
