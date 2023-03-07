import { unified } from 'unified';
import { u } from 'unist-builder';
import mystToMd from '../src';

describe('myst-to-md directives', () => {
  it('myst directive', () => {
    const tree = u(
      'root',
      u(
        'mystDirective',
        { name: 'abc', args: 'My Directive!', value: ':a: b\n:c: d\n\nMarkdown' },
        [u('text', { value: 'Some % ' }), u('emphasis', [u('text', 'markdown')])],
      ),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('```{abc} My Directive!\n:a: b\n:c: d\n\nMarkdown\n```');
  });
  it('myst directive - no args', () => {
    const tree = u(
      'root',
      u('mystDirective', { name: 'abc', value: ':a: b\n:c: d\n\nMarkdown' }, [
        u('text', { value: 'Some % ' }),
        u('emphasis', [u('text', 'markdown')]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('```{abc}\n:a: b\n:c: d\n\nMarkdown\n```');
  });
  it('myst directive - no value', () => {
    const tree = u(
      'root',
      u('mystDirective', { name: 'abc', args: 'My Directive!' }, [
        u('text', { value: 'Some % ' }),
        u('emphasis', [u('text', 'markdown')]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('```{abc} My Directive!\n```');
  });
  it('myst directive - no args or value', () => {
    const tree = u(
      'root',
      u('mystDirective', { name: 'abc' }, [
        u('text', { value: 'Some % ' }),
        u('emphasis', [u('text', 'markdown')]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('```{abc}\n```');
  });
  it('myst directive - nested code', () => {
    const tree = u(
      'root',
      u(
        'mystDirective',
        { name: 'abc', args: 'My Directive!', value: ':a: b\n:c: d\n\n```\nMarkdown\n```' },
        [u('text', { value: 'Some % ' }), u('emphasis', [u('text', 'markdown')])],
      ),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual(
      '````{abc} My Directive!\n:a: b\n:c: d\n\n```\nMarkdown\n```\n````',
    );
  });
});
