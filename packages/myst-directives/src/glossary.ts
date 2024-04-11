import type { DirectiveSpec, DirectiveData, DirectiveContext, GenericNode } from 'myst-common';
import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import { liftChildren } from 'myst-common';

type GlossaryItem = {
  termLines: string[];
  definitionLines: string[];
};

function runLegacy(data: DirectiveData, vfile: VFile, ctx: DirectiveContext): GenericNode[] {
  const lines = (data.body as string).split('\n');
  // Flag tracking whether the line-processor expects definition lines
  let inDefinition = false;
  let indentSize = 0;

  const entries: GlossaryItem[] = [];

  // Parse lines into separate entries
  for (const line of lines) {
    // Is the line a comment?
    if (/^\.\.\s/.test(line) || !line.length) {
      continue;
    }
    // Is the line a non-whitespace-leading line (term declaration)?
    else if (/^[^\s]/.test(line[0])) {
      // Comment
      if (line.startsWith('.. ')) {
        continue;
      }

      // Do we need to create a new entry?
      if (inDefinition || !entries.length) {
        // Close the current definition, open a new term
        entries.push({
          definitionLines: [],
          termLines: [line],
        });
        inDefinition = false;
      }
      // Can we extend existing entry with an additional term?
      else if (entries.length) {
        entries[entries.length - 1].termLines.push(line);
      }
    }
    // Open a definition
    else if (!inDefinition) {
      inDefinition = true;
      indentSize = line.length - line.replace(/^\s+/, '').length;

      if (entries.length) {
        entries[entries.length - 1].definitionLines.push(line.slice(indentSize));
      }
    }
  }

  // Build glossary
  const definitionChildren: GenericNode[] = [];

  for (const entry of entries) {
    const { termLines, definitionLines } = entry;

    const definitionBody = definitionLines.join('\n');
    const definitionDescription = {
      type: 'definitionDescription',
      children: ctx.parseMyST(definitionBody).children,
    };

    for (const termLine of termLines) {
      const [term, ...classifiers] = termLine.split(/\s+:\s+/);
      const definitionTerm = {
        type: 'definitionTerm',
        children: ctx.parseMyST(term).children,
      };

      definitionChildren.push(definitionTerm, definitionDescription);
    }
  }
  const definitionList = {
    type: 'definitionList',
    children: definitionChildren,
  };

  // Clean-up AST (lift redundant paragraphs)
  selectAll(':matches(definitionTerm, definitionDescription) > paragraph', definitionList).forEach(
    (node) => {
      (node as GenericNode).type = '__lift__';
    },
  );
  liftChildren(definitionList, '__lift__');
  return [
    {
      type: 'glossary',
      children: [definitionList],
    },
  ];
}

export const glossaryDirective: DirectiveSpec = {
  name: 'glossary',
  body: {
    type: String,
    required: true,
  },
  run(data: DirectiveData, vfile: VFile, ctx: DirectiveContext): GenericNode[] {
    // Test for MyST-definition list syntax
    const lines = (data.body as string).split('\n');
    if (lines.some((item) => /^\s{0,2}[:-]/.test(item))) {
      return [
        {
          type: 'glossary',
          children: ctx.parseMyST(data.body as string).children,
        },
      ];
    } else {
      return runLegacy(data, vfile, ctx);
    }
  },
};
