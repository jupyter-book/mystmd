import { Root } from 'mdast';
import {
  MyST,
  Directive,
  IDirective,
  directiveOptions,
  IDirectiveData,
  GenericNode,
} from '../src';

const custom: IDirective = {
  myst: class Custom extends Directive {
    public required_arguments = 0;
    public optional_arguments = 0;
    public final_argument_whitespace = false;
    public has_content = true;
    public option_spec = {
      name: directiveOptions.unchanged,
    };
    run(data: IDirectiveData<keyof Custom['option_spec']>) {
      const token = this.createToken('custom', 'div', 0, {
        content: data.body,
        map: data.bodyMap,
        block: true,
      });
      if (data.options.name) {
        token.attrSet('name', data.options.name);
      }
      return [token];
    }
  },
  mdast: {
    type: 'custom',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(t) {
      return {
        name: t.attrGet('name'),
        value: t.content,
      };
    },
  },
  hast: (h, node) =>
    h(node, 'div', { id: node.name }, [{ type: 'text', value: node.value }]),
};

describe('Extensions', () => {
  test('', () => {
    const parser = new MyST({ directives: { custom } });
    const myst = '```{custom}\n:name: hello\nworld\n```';
    const ast = parser.parse(myst) as GenericNode;
    expect(ast.children?.[0].type).toEqual('directive');
    expect(ast.children?.[0].kind).toEqual('custom');
    expect(ast.children?.[0].children?.[0].type).toEqual('custom');
    expect(ast.children?.[0].children?.[0].name).toEqual('hello');
    expect(ast.children?.[0].children?.[0].value).toEqual('world\n');
    const html = parser.renderMdast(ast as Root);
    expect(html).toBe('<div id="hello">world</div>');
  });
});
