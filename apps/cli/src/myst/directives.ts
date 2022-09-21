import yaml from 'js-yaml';
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

    public option_spec = {
      numbering: directiveOptions.unchanged,
    };

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
      let numbering = {};
      if (t.meta.numbering) {
        try {
          numbering = yaml.load(t.meta.numbering) as any;
        } catch (err) {
          //pass
        }
      }
      return {
        value: t.meta.value,
        numbering: numbering,
      };
    },
    noCloseToken: true,
    isLeaf: true,
  },
  hast: (h, node) => h(node, 'div', { class: 'margin' }),
};

const Mermaid: IDirective = {
  myst: class Mermaid extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = true;

    public option_spec = {};

    run(data: IDirectiveData<keyof Mermaid['option_spec']>) {
      const newTokens: Token[] = [];
      const adToken = this.createToken('mermaid', 'div', 1, {
        map: data.map,
        block: true,
        meta: { value: data.body },
      });
      newTokens.push(adToken);
      return newTokens;
    }
  },
  mdast: {
    type: 'mermaid',
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

const Dropdown: IDirective = {
  myst: class Dropdown extends Directive {
    public required_arguments = 0;

    public optional_arguments = 1;

    public final_argument_whitespace = true;

    public has_content = true;

    public option_spec = {
      // https://sphinx-design.readthedocs.io/en/furo-theme/dropdowns.html
      open: directiveOptions.flag,
      color: directiveOptions.unchanged,
      icon: directiveOptions.unchanged,
      animate: directiveOptions.unchanged,
      margin: directiveOptions.unchanged,
      name: directiveOptions.unchanged,
      'class-container': directiveOptions.unchanged,
      'class-title': directiveOptions.unchanged,
      'class-body': directiveOptions.unchanged,
    };

    run(data: IDirectiveData<keyof Dropdown['option_spec']>) {
      const newTokens: Token[] = [];

      // we create an overall container, then individual containers for the title and body
      const adToken = this.createToken('dropdown_open', 'details', 1, {
        map: data.map,
        block: true,
      });
      newTokens.push(adToken);

      const tokenTitle = this.createToken('summary_open', 'summary', 1);
      newTokens.push(tokenTitle);

      // we want the title to be parsed as Markdown during the inline phase
      const title = data.args[0] || '';
      newTokens.push(
        this.createToken('inline', '', 0, {
          map: [data.map[0], data.map[0]],
          content: title,
          children: [],
        }),
      );

      newTokens.push(this.createToken('summary_close', 'summary', -1, { block: true }));

      // run a recursive parse on the content of the admonition upto this stage
      const bodyTokens = this.nestedParse(data.body, data.bodyMap[0]);
      newTokens.push(...bodyTokens);

      newTokens.push(this.createToken('dropdown_close', 'details', -1, { block: true }));

      return newTokens;
    }
  },
  mdast: {
    type: 'details',
    getAttrs(t) {
      return {
        // This is so silly. Flags are 'null'?
        link: t.meta.open === null || undefined, // Only add true, otherwise undefined.
      };
    },
  },
  hast: (h, node) => h(node, 'details'),
};

const Card: IDirective = {
  myst: class Card extends Directive {
    public required_arguments = 0;

    public optional_arguments = 1;

    public final_argument_whitespace = true;

    public has_content = true;

    public option_spec = {
      // https://sphinx-design.readthedocs.io/en/furo-theme/cards.html#card-options
      width: directiveOptions.unchanged,
      margin: directiveOptions.unchanged,
      padding: directiveOptions.unchanged,
      'text-align': directiveOptions.unchanged,
      'img-top': directiveOptions.unchanged,
      'img-background': directiveOptions.unchanged,
      'img-bottom': directiveOptions.unchanged,
      link: directiveOptions.unchanged,
      // This should be removed, it is picked up just as any other link that can also be a reference
      'link-type': directiveOptions.unchanged,
      'link-alt': directiveOptions.unchanged,
      // This should just be a class that is recognized (similar to dropdown)
      shadow: directiveOptions.unchanged,
      'class-card': directiveOptions.unchanged,
      // I feel like all of these should *not* be included.
      // Instead us a css selector on `class`: for example, `.card.my-class > header { customCss: prop; }`
      'class-header': directiveOptions.unchanged,
      'class-body': directiveOptions.unchanged,
      'class-title': directiveOptions.unchanged,
      'class-footer': directiveOptions.unchanged,
      'class-img-top': directiveOptions.unchanged,
      'class-img-bottom': directiveOptions.unchanged,
      // https://sphinx-design.readthedocs.io/en/furo-theme/grids.html#grid-item-card-options
      columns: directiveOptions.unchanged,
      'class-item': directiveOptions.unchanged, // This seems the same as `class-card`?
    };

    run(data: IDirectiveData<keyof Card['option_spec']>) {
      const newTokens: Token[] = [];

      // we create an overall container, then individual containers for the title and body
      const adToken = this.createToken('card_open', 'div', 1, {
        map: data.map,
        block: true,
      });
      newTokens.push(adToken);

      const headerSplit = '\n^^^\n';
      const footerSplit = '\n+++\n';
      let { body } = data;
      if (body.includes(headerSplit)) {
        const [header, ...rest] = body.split(headerSplit);
        body = rest.join(headerSplit);
        newTokens.push(this.createToken('header_open', 'header', 1, { block: true }));
        const headerTokens = this.nestedParse(header, data.bodyMap[0]);
        newTokens.push(...headerTokens);
        newTokens.push(this.createToken('header_close', 'header', -1, { block: true }));
      }

      const tokenTitle = this.createToken('card_title_open', 'div', 1);
      newTokens.push(tokenTitle);
      // we want the title to be parsed as Markdown during the inline phase
      const title = data.args[0] || '';
      newTokens.push(
        this.createToken('inline', '', 0, {
          map: [data.map[0], data.map[0]],
          content: title,
          children: [],
        }),
      );
      newTokens.push(this.createToken('card_title_close', 'div', -1, { block: true }));

      if (body.includes(footerSplit)) {
        const [content, ...below] = body.split(footerSplit);
        const footer = below.join(footerSplit);
        const bodyTokens = this.nestedParse(content, data.bodyMap[0]);
        newTokens.push(...bodyTokens);
        // Now parse the footer
        newTokens.push(this.createToken('footer_open', 'footer', 1, { block: true }));
        const footerTokens = this.nestedParse(footer, data.bodyMap[0]);
        newTokens.push(...footerTokens);
        newTokens.push(this.createToken('footer_close', 'footer', -1, { block: true }));
      } else {
        // run a recursive parse on the content of the admonition upto this stage
        const bodyTokens = this.nestedParse(body, data.bodyMap[0]);
        newTokens.push(...bodyTokens);
      }
      newTokens.push(this.createToken('card_close', 'div', -1, { block: true }));
      return newTokens;
    }
  },
  mdast: {
    type: 'card',
    getAttrs(t) {
      return {
        url: t.meta.link || undefined,
      };
    },
  },
  hast: (h, node) => h(node, 'details'),
};

// The extension is forcing us to add this as a full thing, we are just putting `false` in "myst".
const Summary: IDirective = {
  myst: false as any,
  mdast: {
    type: 'summary',
    getAttrs() {
      return {};
    },
  },
  hast: (h, node) => h(node, 'summary'),
};

// The extension is forcing us to add this as a full thing, we are just putting `false` in "myst".
const CardTitle: IDirective = {
  myst: false as any,
  mdast: {
    type: 'cardTitle',
    getAttrs() {
      return {};
    },
  },
  hast: (h, node) => h(node, 'div'),
};

// The extension is forcing us to add this as a full thing, we are just putting `false` in "myst".
const Footer: IDirective = {
  myst: false as any,
  mdast: {
    type: 'footer',
    getAttrs() {
      return {};
    },
  },
  hast: (h, node) => h(node, 'footer'),
};

// The extension is forcing us to add this as a full thing, we are just putting `false` in "myst".
const Header: IDirective = {
  myst: false as any,
  mdast: {
    type: 'header',
    getAttrs() {
      return {};
    },
  },
  hast: (h, node) => h(node, 'header'),
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
  mermaid: Mermaid,
  dropdown: Dropdown,
  summary: Summary,
  card: Card,
  card_title: CardTitle,
  footer: Footer,
  header: Header,
  grid: Grid,
  'grid-item-card': Card,
};
