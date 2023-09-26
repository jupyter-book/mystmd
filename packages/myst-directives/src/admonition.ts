import type { Admonition } from 'myst-spec-ext';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const admonitionDirective: DirectiveSpec = {
  name: 'admonition',
  doc: 'Callouts, or "admonitions", highlight a particular block of text that exists slightly apart from the narrative of your page, such as a note or a warning. \n\n The admonition kind can be determined by the directive name used (e.g. `:::{tip}` or `:::{note}`).',
  alias: [
    'attention',
    'caution',
    'danger',
    'error',
    'important',
    'hint',
    'note',
    'seealso',
    'tip',
    'warning',
    '.callout-note',
    '.callout-warning',
    '.callout-important',
    '.callout-tip',
    '.callout-caution',
  ],
  arg: {
    type: ParseTypesEnum.parsed,
    doc: 'The optional title of the admonition, if not supplied the admonition kind will be used.\n\nNote that the argument parsing is different from Sphinx, which does not allow named admonitions to have custom titles.',
  },
  options: {
    // label: {
    //   type: String,
    //   alias: ['name'],
    // },
    class: {
      type: String,
      doc: `CSS classes to add to your admonition. Special classes include:

- \`dropdown\`: turns the admonition into a \`<details>\` html element
- \`simple\`: an admonition with "simple" styles
- the name of an admonition, the first valid admonition name encountered will be used (e.g. \`tip\`). Note that if you provide conflicting class names, the first valid admonition name will be used.`,
    },
    icon: {
      type: Boolean,
      doc: 'Setting icon to false will hide the icon.',
      // class_option: list of strings?
    },
  },
  body: {
    type: ParseTypesEnum.parsed,
    doc: 'The body of the admonition. If there is no title and the body starts with bold text or a heading, that content will be used as the admonition title.',
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      // TODO: We should potentially raise a compatibility warning here with the python side
      // TODO: We should have this ALWAYS be admonition title.
      children.push({
        type: data.body ? 'admonitionTitle' : 'paragraph',
        children: data.arg as GenericNode[],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }
    const admonition: Admonition = {
      type: 'admonition',
      kind:
        data.name !== 'admonition'
          ? (data.name.replace('.callout-', '') as Admonition['kind'])
          : undefined,
      class: data.options?.class as string,
      children: children as any[],
    };
    if (data.options?.icon === false) {
      admonition.icon = false;
    }
    return [admonition];
  },
};
