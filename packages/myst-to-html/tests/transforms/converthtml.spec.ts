import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { convertHtmlToMdast } from '../../src/transforms';
import type { GenericParent } from 'myst-common';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  before: GenericParent;
  after: GenericParent;
  opts?: Record<string, boolean>;
};

const directory = path.join('tests', 'transforms');
const file = 'converthtml.yml';

const testYaml = fs.readFileSync(path.join(directory, file)).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('convertHtmlToMdast', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { before, after, opts }) => {
      const transformed = convertHtmlToMdast(before as GenericParent, opts || {});
      expect(yaml.dump(transformed)).toEqual(yaml.dump(after));
    },
  );
});
