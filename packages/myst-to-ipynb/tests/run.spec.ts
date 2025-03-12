import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { unified } from 'unified';
import writeIpynb from '../src';

type TestCase = {
  title: string;
  ipynb: string;
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
      (_, { ipynb, mdast }) => {
        const pipe = unified().use(writeIpynb);
        pipe.runSync(mdast as any);
        const file = pipe.stringify(mdast as any);
        console.log(file.result);
        expect(file.result).toEqual(ipynb);
      },
    );
  });
});

describe('myst-to-ipynb frontmatter', () => {
  test('empty frontmatter passes', () => {
    const pipe = unified().use(writeIpynb, {});
    const mdast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello world!' }] }],
    };
    pipe.runSync(mdast as any);
    const file = pipe.stringify(mdast as any);
    console.log(file.result);
    expect(file.result).toEqual(`{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {},
      "source": "Hello world!"
    }
  ],
  "metadata": {
    "language_info": {
      "name": "python"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 2
}`
    );
  });


  // test('simple frontmatter passes', () => {
  //   const pipe = unified().use(writeIpynb, { title: 'My Title' });
  //   const mdast = {
  //     type: 'root',
  //     children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello world!' }] }],
  //   };
  //   pipe.runSync(mdast as any);
  //   const file = pipe.stringify(mdast as any);
  //   console.log(file.result);
  //   expect(file.result).toEqual('---\ntitle: My Title\n---\nHello world!');
  // });


  // test('frontmatter with licenses passes', () => {
  //   const pipe = unified().use(writeIpynb, {
  //     title: 'My Title',
  //     license: {
  //       content: {
  //         id: 'Apache-2.0',
  //         name: 'Apache License 2.0',
  //         url: 'https://opensource.org/licenses/Apache-2.0',
  //         free: true,
  //         osi: true,
  //       },
  //       code: {
  //         name: 'Creative Commons Attribution 3.0 Unported',
  //         id: 'CC-BY-3.0',
  //         CC: true,
  //         url: 'https://creativecommons.org/licenses/by/3.0/',
  //       },
  //     },
  //   });
  //   const mdast = {
  //     type: 'root',
  //     children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Hello world!' }] }],
  //   };
  //   pipe.runSync(mdast as any);
  //   const file = pipe.stringify(mdast as any);
  //   expect(file.result).toEqual(
  //     '---\ntitle: My Title\nlicense:\n  content: Apache-2.0\n  code: CC-BY-3.0\n---\nHello world!',
  //   );
  // });
});
