import { Directive, IDirectiveData, directiveOptions, IDirective } from 'mystjs';

const RVar: IDirective = {
  myst: class RVariable extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = false;

    public option_spec = {
      name: directiveOptions.unchanged_required,
      value: directiveOptions.unchanged,
      rValue: directiveOptions.unchanged,
      format: directiveOptions.unchanged,
    };

    run(data: IDirectiveData<keyof RVariable['option_spec']>) {
      const token = this.createToken('r:var', 'r-var', 0, {
        content: data.body,
        map: data.bodyMap,
        block: true,
      });
      return [token];
    }
  },
  mdast: {
    type: 'r:var',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        name: t.meta.name || undefined,
        value: t.meta.value || undefined,
        valueFunction: t.meta.rValue || undefined,
        format: t.meta.format || undefined,
      };
    },
  },
  hast: (h, node) => h(node, 'r-var'),
};

const Bibliography: IDirective = {
  myst: class Bibliography extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = false;

    public option_spec = {
      filter: directiveOptions.unchanged,
    };

    run(data: IDirectiveData<keyof Bibliography['option_spec']>) {
      const token = this.createToken('bibliography', 'div', 0, {
        content: data.body,
        map: data.bodyMap,
        block: true,
      });
      return [token];
    }
  },
  mdast: {
    type: 'bibliography',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        filter: t.meta.filter || undefined,
      };
    },
  },
  hast: (h, node) => h(node, 'div', { class: 'bibliography' }),
};

export const reactiveDirectives = {
  'r:var': RVar,
  bibliography: Bibliography,
};
