import type { IDirectiveData, IDirective, Token } from 'mystjs';
import { Directive, directiveOptions } from 'mystjs';

function getColumns(columnString: string, defaultColumns = [1, 2, 2, 3]) {
  const columns = (columnString ?? '1 2 2 3')
    .split(/\s/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n))
    .map((n) => Math.min(Math.max(Math.floor(n), 1), 12)); // Integer between 1 and 12
  if (columns.length === 0 || columns.length > 4) return defaultColumns;
  return columns;
}

const Grid: IDirective = {
  myst: class Grid extends Directive {
    public required_arguments = 0;

    public optional_arguments = 1;

    public final_argument_whitespace = true;

    public has_content = true;

    public option_spec = {
      // https://sphinx-design.readthedocs.io/en/furo-theme/grids.html#grid-options
      'class-container': directiveOptions.class_option,
      'class-row': directiveOptions.class_option,
      gutter: directiveOptions.unchanged,
      margin: directiveOptions.unchanged,
      padding: directiveOptions.unchanged,
      reverse: directiveOptions.unchanged,
      outline: directiveOptions.unchanged,
    };

    run(data: IDirectiveData<keyof Grid['option_spec']>) {
      const newTokens: Token[] = [];
      // we create an overall container, then individual containers for the title and body
      const adToken = this.createToken('grid_open', 'div', 1, {
        map: data.map,
        block: true,
        meta: {
          columns: data.args[0] ?? '1 2 2 3',
        },
      });
      newTokens.push(adToken);
      const bodyTokens = this.nestedParse(data.body, data.bodyMap[0]);
      newTokens.push(...bodyTokens);
      newTokens.push(this.createToken('grid_close', 'div', -1, { block: true }));
      return newTokens;
    }
  },
  mdast: {
    type: 'grid',
    getAttrs(t) {
      return {
        columns: getColumns(t.meta.columns),
      };
    },
  },
  hast: (h, node) => h(node, 'div'),
};

const directives = {
  grid: Grid,
};

export default directives;
