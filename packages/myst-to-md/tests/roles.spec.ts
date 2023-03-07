import { unified } from 'unified';
import { u } from 'unist-builder';
import mystToMd from '../src';

describe('myst-to-md roles', () => {
  it('subscript', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('subscript', [u('emphasis', [u('text', 'markdown')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {sub}`*markdown*`');
  });
  it('superscript', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('superscript', [u('emphasis', [u('text', 'markdown')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {sup}`*markdown*`');
  });
  it('delete', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('delete', [u('emphasis', [u('text', 'markdown')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {del}`*markdown*`');
  });
  it('underline', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('underline', [u('emphasis', [u('text', 'markdown')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {u}`*markdown*`');
  });
  it('smallcaps', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('smallcaps', [u('emphasis', [u('text', 'markdown')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {sc}`*markdown*`');
  });
  it('inline math', () => {
    const tree = u(
      'root',
      u('paragraph', [u('text', { value: 'Some % ' }), u('inlineMath', 'markdown math')]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {math}`markdown math`');
  });
  it('abbreviation - no title', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('abbreviation', [u('emphasis', [u('text', 'md')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {abbr}`*md*`');
  });
  it('abbreviation - title', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('abbreviation', { title: 'markdown' }, [u('emphasis', [u('text', 'md')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {abbr}`*md* (markdown)`');
  });
  it('nested roles', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('smallcaps', [
          u('text', 'nested '),
          u('subscript', [u('text', 'markdown')]),
          u('text', ' content'),
        ]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {sc}`nested {sub}``markdown`` content`');
  });
  it('nested roles requiring trailing space', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('smallcaps', [u('subscript', [u('text', 'markdown')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {sc}`{sub}``markdown`` `');
  });
  it('nested roles with inline code', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('abbreviation', { title: 'markdown' }, [
          u('emphasis', [u('text', 'md')]),
          u('text', ' '),
          u('inlineCode', 'and code'),
        ]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {abbr}`*md* ``and code`` (markdown)`');
  });
  it('nested roles with math', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('abbreviation', { title: 'markdown' }, [
          u('emphasis', [u('text', 'md')]),
          u('text', ' '),
          u('inlineMath', 'and math'),
        ]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {abbr}`*md* {math}``and math`` (markdown)`');
  });
  it('myst role', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('mystRole', { name: 'strike', value: 'markdown' }, [u('del', [u('text', 'markdown')])]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % {strike}`markdown`');
  });
  it('cite', () => {
    const tree = u(
      'root',
      u('paragraph', [u('cite', { label: 'Smith_2023', identifier: 'smith_2023' })]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('{cite}`Smith_2023`');
  });
  it('cite group - narrative', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('citeGroup', { kind: 'narrative' }, [
          u('cite', { label: 'Doe_2000', identifier: 'doe_2000' }),
          u('cite', { label: 'Smith_2023', identifier: 'smith_2023' }),
        ]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('{cite:t}`Doe_2000,Smith_2023`');
  });
  it('cite group - parenthetical', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('citeGroup', { kind: 'parenthetical' }, [
          u('cite', { label: 'Doe_2000', identifier: 'doe_2000' }),
          u('cite', { label: 'Smith_2023', identifier: 'smith_2023' }),
        ]),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('{cite:p}`Doe_2000,Smith_2023`');
  });
});
