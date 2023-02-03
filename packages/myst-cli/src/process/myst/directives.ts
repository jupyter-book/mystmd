import yaml from 'js-yaml';
import type { IDirectiveData, IDirective, Token } from 'mystjs';
import { Directive, directiveOptions, directivesDefault } from 'mystjs';
import cardDirectives from 'myst-ext-card';
import gridDirectives from 'myst-ext-grid';
import tabsDirectives from 'myst-ext-tabs';

// We are overriding image so we can use height here
const Image: IDirective = {
  myst: directivesDefault.image,
  mdast: {
    type: 'image',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(token) {
      const alt = token.attrGet('alt') || token.children?.reduce((i, t) => i + t?.content, '');
      const align = 'center';
      return {
        url: token.attrGet('src'),
        alt: alt || undefined,
        title: token.attrGet('title') || undefined,
        class: undefined,
        width: token.attrGet('width') || undefined,
        height: token.attrGet('height') || undefined,
        align,
      };
    },
  },
  hast: (h, node) =>
    h(node, 'img', {
      src: node.url,
      alt: node.alt,
      title: node.title,
      // class,
      height: node.height,
      width: node.width,
    }),
};

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

const EmbedOutput: IDirective = {
  myst: class EmbedOutput extends Directive {
    public required_arguments = 0;

    public optional_arguments = 0;

    public final_argument_whitespace = false;

    public has_content = false;

    public option_spec = {
      label: directiveOptions.unchanged,
      'remove-input': directiveOptions.flag,
      'remove-output': directiveOptions.flag,
    };

    run(data: IDirectiveData<keyof EmbedOutput['option_spec']>) {
      const token = this.createToken('embed', 'div', 0, {
        content: data.body,
        map: data.bodyMap,
        block: true,
        meta: {
          label: data.options.label,
          'remove-input': data.options['remove-input'] === null,
          'remove-output': data.options['remove-output'] === null,
        },
      });
      return [token];
    }
  },
  mdast: {
    type: 'embed',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        label: t.meta.label,
        'remove-input': t.meta['remove-input'],
        'remove-output': t.meta['remove-output'],
      };
    },
  },
  hast: (h, node) => h(node, 'div'),
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

function aliasDirectiveHack(directive: IDirective['myst']): IDirective {
  return {
    myst: directive,
    mdast: { type: '_' },
    hast: (h, node) => h(node, '_'),
  };
}

export const directives = {
  ...cardDirectives,
  ...gridDirectives,
  ...tabsDirectives,
  image: Image,
  'r:var': RVar,
  mdast: Mdast,
  include: Include,
  bibliography: Bibliography,
  iframe: IFrame,
  margin: Margin,
  output: Output,
  'link-block': LinkBlock,
  linkBlock: LinkBlock,
  myst: MystDemo,
  mermaid: Mermaid,
  dropdown: Dropdown,
  summary: Summary,
  embed: EmbedOutput,
  '.callout-note': aliasDirectiveHack(directivesDefault.note),
  '.callout-warning': aliasDirectiveHack(directivesDefault.warning),
  '.callout-important': aliasDirectiveHack(directivesDefault.important),
  '.callout-tip': aliasDirectiveHack(directivesDefault.tip),
  '.callout-caution': aliasDirectiveHack(directivesDefault.caution),
};
