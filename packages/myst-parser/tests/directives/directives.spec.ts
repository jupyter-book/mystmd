import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { selectAll } from 'unist-util-select';
import { mystParse } from '../../src';
import { VFile } from 'vfile';

type TestCase = {
  title: string;
  markdown: string;
  mdast: Record<string, any>;
  warnings?: number;
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
      (_, { markdown, mdast, warnings = 0 }) => {
        const vfile = new VFile();
        const output = mystParse(markdown, { vfile });
        // Dont worry about position
        selectAll('[position]', output).forEach((node) => {
          delete node.position;
        });
        expect(output).toEqual(mdast);
        if (vfile.messages.length !== warnings) {
          console.log(vfile.messages);
        }
        expect(vfile.messages.length).toBe(warnings);
      },
    );
  });
});
