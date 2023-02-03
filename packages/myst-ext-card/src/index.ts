import type { IDirectiveData, IDirective, Token } from 'mystjs';
import { Directive, directiveOptions } from 'mystjs';

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

      // we want the title to be parsed as Markdown during the inline phase
      const title = data.args[0] || '';
      if (title) {
        const tokenTitle = this.createToken('card_title_open', 'div', 1);
        newTokens.push(tokenTitle);
        newTokens.push(
          this.createToken('inline', '', 0, {
            map: [data.map[0], data.map[0]],
            content: title,
            children: [],
          }),
        );
        newTokens.push(this.createToken('card_title_close', 'div', -1, { block: true }));
      }

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

const directives = {
  card: Card,
  'grid-item-card': Card,
  card_title: CardTitle,
  footer: Footer,
  header: Header,
};

export default directives;
