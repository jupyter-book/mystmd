import { Directive, IDirectiveData, directiveOptions, IDirective, Token } from 'mystjs';
import { JsonObject } from '@curvenote/blocks';

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

const IFrame: IDirective = {
  myst: class IFrame extends Directive {
    public required_arguments = 1;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = false;

    public option_spec = {
      label: directiveOptions.unchanged,
      width: directiveOptions.percentage,
      align: directiveOptions.create_choice(['left', 'center', 'right']),
    };

    run(data: IDirectiveData<keyof IFrame['option_spec']>) {
      const token = this.createToken('iframe', 'div', 0, {
        content: data.body,
        map: data.bodyMap,
        block: true,
        meta: { src: data.args[0] },
      });
      return [token];
    }
  },
  mdast: {
    type: 'iframe',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        src: t.meta.src,
        label: t.meta.label || undefined,
        width: t.meta.width || undefined,
        align: t.meta.align || undefined,
      };
    },
  },
  hast: (h, node) => h(node, 'div', { class: 'iframe' }),
};

const Output: IDirective = {
  myst: class Output extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = false;

    public option_spec = {
      id: directiveOptions.unchanged,
    };

    run(data: IDirectiveData<keyof Output['option_spec']>) {
      const token = this.createToken('output', 'div', 0, {
        map: data.map,
        block: true,
      });
      return [token];
    }
  },
  mdast: {
    type: 'output',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        id: t.meta.id,
        data: {},
      };
    },
  },
  hast: (h, node) => h(node, 'div', { class: 'output' }),
};

const Margin: IDirective = {
  myst: class Margin extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = true;

    public option_spec = {};

    run(data: IDirectiveData<keyof Margin['option_spec']>) {
      const newTokens: Token[] = [];
      // we create an overall container, then individual containers for the title and body
      const adToken = this.createToken('margin_open', 'aside', 1, {
        map: data.map,
        block: true,
      });
      newTokens.push(adToken);
      const bodyTokens = this.nestedParse(data.body, data.bodyMap[0]);
      newTokens.push(...bodyTokens);
      newTokens.push(this.createToken('margin_close', 'aside', -1, { block: true }));
      return newTokens;
    }
  },
  mdast: {
    type: 'margin',
    getAttrs() {
      return {};
    },
  },
  hast: (h, node) => h(node, 'aside', { class: 'margin' }),
};

export const directives = {
  'r:var': RVar,
  bibliography: Bibliography,
  iframe: IFrame,
  margin: Margin,
  output: Output,
};
