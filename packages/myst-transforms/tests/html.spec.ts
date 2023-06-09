import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Root } from 'mdast';
import { htmlTransform } from '../src';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  before: Root;
  after: Root;
  opts?: Record<string, boolean>;
};

const fixtures = path.join('tests', 'html.yml');

const testYaml = fs.readFileSync(fixtures).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('convertHtmlToMdast', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { before, after, opts }) => {
      const transformed = htmlTransform(before as Root, opts || {});
      expect(yaml.dump(transformed)).toEqual(yaml.dump(after));
    },
  );
});
