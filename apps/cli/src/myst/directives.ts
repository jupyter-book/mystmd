import type { IDirectiveData, IDirective, Token } from 'mystjs';
import { Directive, directiveOptions } from 'mystjs';

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

const Mdast: IDirective = {
  myst: class Mdast extends Directive {
    public required_arguments = 1;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = false;

    public option_spec = {};

    run(data: IDirectiveData<keyof Mdast['option_spec']>) {
      const token = this.createToken('mdast', 'div', 0, {
        content: data.body,
        map: data.bodyMap,
        block: true,
        meta: { id: data.args[0] },
      });
      return [token];
    }
  },
  mdast: {
    type: 'mdast',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        id: t.meta.id,
      };
    },
  },
  hast: (h, node) => h(node, 'div', { id: node.id }),
};

const Include: IDirective = {
  myst: class Include extends Directive {
    public required_arguments = 1;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = false;

    public option_spec = {};

    run(data: IDirectiveData<keyof Include['option_spec']>) {
      const token = this.createToken('include', 'div', 0, {
        content: data.body,
        map: data.bodyMap,
        block: true,
        meta: { file: data.args[0] },
      });
      return [token];
    }
  },
  mdast: {
    type: 'include',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        file: t.meta.file,
      };
    },
  },
  hast: (h, node) => h(node, 'div', { file: node.file }),
};

const LinkBlock: IDirective = {
  myst: class LinkBlock extends Directive {
    public required_arguments = 1;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = true;

    public option_spec = {
      title: directiveOptions.unchanged,
      thumbnail: directiveOptions.unchanged,
    };

    run(data: IDirectiveData<keyof LinkBlock['option_spec']>) {
      const newTokens: Token[] = [];
      const openToken = this.createToken('linkBlock_open', 'a', 1, {
        map: data.map,
        block: true,
        meta: { url: data.args[0] },
      });
      newTokens.push(openToken);
      const bodyTokens = this.nestedParse(data.body, data.bodyMap[0]);
      newTokens.push(...bodyTokens);
      newTokens.push(this.createToken('linkBlock_close', 'a', -1, { block: true }));
      return newTokens;
    }
  },
  mdast: {
    type: 'linkBlock',
    noCloseToken: false,
    isLeaf: false,
    getAttrs(t) {
      return {
        url: t.meta.url,
        title: t.meta.title || undefined,
        thumbnail: t.meta.thumbnail || undefined,
      };
    },
  },
  hast: (h, node) => h(node, 'a'),
};

const TabSet: IDirective = {
  myst: class TabSet extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = true;

    public option_spec = {
      class: directiveOptions.class_option,
    };

    run(data: IDirectiveData<keyof TabSet['option_spec']>) {
      const newTokens: Token[] = [];
      // we create an overall container, then individual containers for the title and body
      const adToken = this.createToken('tabSet_open', 'div', 1, {
        map: data.map,
        block: true,
      });
      newTokens.push(adToken);
      const bodyTokens = this.nestedParse(data.body, data.bodyMap[0]);
      newTokens.push(...bodyTokens);
      newTokens.push(this.createToken('tabSet_close', 'div', -1, { block: true }));
      return newTokens;
    }
  },
  mdast: {
    type: 'tabSet',
    getAttrs(t) {
      return {
        class: t.meta.class,
      };
    },
  },
  hast: (h, node) => h(node, 'div', { class: 'margin' }),
};

const TabItem: IDirective = {
  myst: class TabItem extends Directive {
    public required_arguments = 1;

    public optional_arguments = 0;

    public final_argument_whitespace = true;

    public has_content = true;

    public option_spec = {
      sync: directiveOptions.unchanged,
    };

    run(data: IDirectiveData<keyof TabItem['option_spec']>) {
      const newTokens: Token[] = [];
      const adToken = this.createToken('tabItem_open', 'div', 1, {
        map: data.map,
        block: true,
        meta: { title: data.args[0] },
      });
      newTokens.push(adToken);
      const bodyTokens = this.nestedParse(data.body, data.bodyMap[0]);
      newTokens.push(...bodyTokens);
      newTokens.push(this.createToken('tabItem_close', 'div', -1, { block: true }));
      return newTokens;
    }
  },
  mdast: {
    type: 'tabItem',
    getAttrs(t) {
      return {
        title: t.meta.title,
        sync: t.meta.sync,
      };
    },
  },
  hast: (h, node) => h(node, 'div', { class: 'margin' }),
};

const MystDemo: IDirective = {
  myst: class MystDemo extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = true;

    public option_spec = {};

    run(data: IDirectiveData<keyof MystDemo['option_spec']>) {
      const newTokens: Token[] = [];
      const adToken = this.createToken('myst', 'div', 1, {
        map: data.map,
        block: true,
        meta: { value: data.body },
      });
      newTokens.push(adToken);
      return newTokens;
    }
  },
  mdast: {
    type: 'myst',
    getAttrs(t) {
      return {
        value: t.meta.value,
      };
    },
    noCloseToken: true,
    isLeaf: true,
  },
  hast: (h, node) => h(node, 'div', { class: 'margin' }),
};

export const directives = {
  'r:var': RVar,
  mdast: Mdast,
  include: Include,
  bibliography: Bibliography,
  iframe: IFrame,
  margin: Margin,
  output: Output,
  'link-block': LinkBlock,
  linkBlock: LinkBlock,
  'tab-set': TabSet,
  tabSet: TabSet,
  'tab-item': TabItem,
  tabItem: TabItem,
  myst: MystDemo,
};
