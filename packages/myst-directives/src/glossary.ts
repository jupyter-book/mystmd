import type { DirectiveSpec, DirectiveData, DirectiveContext, GenericNode } from 'myst-common';
import type { VFile } from 'vfile';

type GlossaryItem = {
  termLines: string[];
  definitionLines: string[];
};

export const glossaryDirective: DirectiveSpec = {
  name: 'glossary',
  body: {
    type: String,
    required: true,
  },

  run(data: DirectiveData, vfile: VFile, ctx: DirectiveContext): GenericNode[] {
    // Flag tracking whether the line-processor expects definition lines
    let inDefinition = false;
    let indentSize = 0;

    const entries: GlossaryItem[] = [];

    for (const line of (data.body as string).split('\n')) {
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

    const definitionChildren: GenericNode[] = [];

    for (const entry of entries) {
        const {termLines, definitionLines} = entry;

	for (const termLine of termLines) {
          const [term, ...classifiers] = termLine.split(/\s+:\s+/);
	}
    }

    console.log(JSON.stringify(entries));
    return [
      {
        type: 'glossary',
        children: data.body as GenericNode[],
      },
    ];
  },
};
