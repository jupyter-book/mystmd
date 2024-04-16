import type { DirectiveSpec, DirectiveData, DirectiveContext, GenericNode } from 'myst-common';
import type { DefinitionList, DefinitionTerm, DefinitionDescription } from 'myst-spec-ext';
import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import { liftChildren } from 'myst-common';

type Line = {
  content: string;
  offset: number;
};

type LegacyGlossaryItem = {
  termLines: Line[];
  definitionLines: Line[];
};

export const legacyGlossaryDirective: DirectiveSpec = {
  name: 'glossary',
  body: {
    type: String,
    required: true,
  },
  run(data: DirectiveData, vfile: VFile, ctx: DirectiveContext): GenericNode[] {
    const lines = (data.body as string).split('\n');
    // Flag tracking whether the line-processor expects definition lines
    let inDefinition = false;
    let indentSize = 0;

    const entries: LegacyGlossaryItem[] = [];

    // Parse lines into separate entries
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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
            termLines: [{ content: line, offset: i }],
          });
          inDefinition = false;
        }
        // Can we extend existing entry with an additional term?
        else if (entries.length) {
          entries[entries.length - 1].termLines.push({ content: line, offset: i });
        }
      }
      // Open a definition
      else if (!inDefinition) {
        inDefinition = true;
        indentSize = line.length - line.replace(/^\s+/, '').length;

        if (entries.length) {
          entries[entries.length - 1].definitionLines.push({
            content: line.slice(indentSize),
            offset: i,
          });
        }
      }
    }

    // Build glossary
    const definitionChildren: (DefinitionTerm | DefinitionDescription)[] = [];

    for (const entry of entries) {
      const { termLines, definitionLines } = entry;

      const definitionBody = definitionLines.map((line) => line.content).join('\n');
      const definitionDescription: DefinitionDescription = {
        type: 'definitionDescription',
        children: ctx.parseMyST(definitionBody, definitionLines[0]?.offset || 0).children,
      };

      for (const {content, offset} of termLines) {
        const [term, ...classifiers] = content.split(/\s+:\s+/);
        const definitionTerm: DefinitionTerm = {
          type: 'definitionTerm',
          children: ctx.parseMyST(term, offset).children,
        };

        definitionChildren.push(definitionTerm, definitionDescription);
      }
    }
    const definitionList: DefinitionList = {
      type: 'definitionList',
      children: definitionChildren,
    };

    // Clean-up AST (lift redundant paragraphs)
    selectAll(
      ':matches(definitionTerm, definitionDescription) > paragraph',
      definitionList,
    ).forEach((node) => {
      (node as GenericNode).type = '__lift__';
    });
    liftChildren(definitionList, '__lift__');
    return [
      {
        type: 'glossary',
        children: [definitionList],
      },
    ];
  },
};

export const glossaryDirective: DirectiveSpec = {
  name: 'glossary',
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'glossary',
        children: data.body as GenericNode[],
      },
    ];
  },
};
