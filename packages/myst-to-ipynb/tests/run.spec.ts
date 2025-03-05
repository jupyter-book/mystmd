import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { unified } from 'unified';
import mystToMd from '../src';

type TestCase = {
  title: string;
  markdown: string;
  mdast: Record<string, any>;
};

type TestCases = {
  title: string;
  cases: TestCase[];
};

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

casesList.forEach(({ title, cases }) => {
  describe(title, () => {
    test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
      '%s',
      (_, { markdown, mdast }) => {
        const pipe = unified().use(mystToMd);
        pipe.runSync(mdast as any);
        const file = pipe.stringify(mdast as any);
        expect(file.result).toEqual(markdown);
      },
    );
  });
});

describe('myst-to-md frontmatter', () => {
  test('empty frontmatter passes', () => {
    const pipe = unified().use(mystToMd, {});
    const mdast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello world!' }] }],
    };
    pipe.runSync(mdast as any);
    const file = pipe.stringify(mdast as any);
    expect(file.result).toEqual('Hello world!');
  });
  test('simple frontmatter passes', () => {
    const pipe = unified().use(mystToMd, { title: 'My Title' });
    const mdast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello world!' }] }],
    };
    pipe.runSync(mdast as any);
    const file = pipe.stringify(mdast as any);
    expect(file.result).toEqual('---\ntitle: My Title\n---\nHello world!');
  });
  test('frontmatter with licenses passes', () => {
    const pipe = unified().use(mystToMd, {
      title: 'My Title',
      license: {
        content: {
          id: 'Apache-2.0',
          name: 'Apache License 2.0',
          url: 'https://opensource.org/licenses/Apache-2.0',
          free: true,
          osi: true,
        },
        code: {
          name: 'Creative Commons Attribution 3.0 Unported',
          id: 'CC-BY-3.0',
          CC: true,
          url: 'https://creativecommons.org/licenses/by/3.0/',
        },
      },
    });
    const mdast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello world!' }] }],
    };
    pipe.runSync(mdast as any);
    const file = pipe.stringify(mdast as any);
    expect(file.result).toEqual(
      '---\ntitle: My Title\nlicense:\n  content: Apache-2.0\n  code: CC-BY-3.0\n---\nHello world!',
    );
  });
});
