import { MIGRATIONS } from 'myst-migrate';
import { select } from 'unist-util-select';

function isoDate(date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
/**
 * Create a documentation section for a template
 *
 * This directive simply passes-through the options into an AST node,
 * because we can't (shouldn't) perform any async / blocking work here.
 *
 * @type {import('myst-common').DirectiveSpec}
 */
const mystVersionsDirective = {
  name: 'myst:versions',
  options: {
    'heading-depth': {
      type: Number,
    },
  },
  run(data, vfile, ctx) {
    const sections = MIGRATIONS.map((migration) => {
      const { DATE, DESCRIPTION, VERSION } = migration;
      const descriptionNodes = select('root', ctx.parseMyst(DESCRIPTION)).children;
      return [
        {
          type: 'heading',
          depth: data.options?.['heading-depth'] ?? 2,
          children: [{ type: 'text', value: `Version ${VERSION} — ${isoDate(DATE)}` }],
        },
        ...descriptionNodes,
      ];
    });
    sections.reverse();
    return sections.flat();
  },
};
/**
 * @type {import('myst-common').MystPlugin}
 */
const plugin = {
  name: 'MyST Versions Documentation Plugins',
  author: 'Angus Hollands',
  license: 'MIT',
  directives: [mystVersionsDirective],
};

export default plugin;
