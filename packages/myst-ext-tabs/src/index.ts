import type { IDirectiveData, IDirective, Token } from 'mystjs';
import { Directive, directiveOptions } from 'mystjs';

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
      selected: directiveOptions.flag,
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
        selected: t.meta.selected === null || undefined,
      };
    },
  },
  hast: (h, node) => h(node, 'div', { class: 'margin' }),
};

const directives = {
  'tab-set': TabSet,
  tabSet: TabSet,
  'tab-item': TabItem,
  tabItem: TabItem,
};

export default directives;
