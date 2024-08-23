import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { abbreviationTransform } from '../src';
import type { Root } from 'myst-spec';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  before: Root;
  after: Root;
  opts?: Record<string, boolean>;
};

const fixtures = path.join('tests', 'abbreviations.yml');

const testYaml = fs.readFileSync(fixtures).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('abbreviate', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { before, after, opts }) => {
      abbreviationTransform(before, opts);
      expect(yaml.dump(before)).toEqual(yaml.dump(after));
    },
  );
});
