import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { enumerateTargets, State } from '../../src/state';
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
const file = 'addenumerators.yml';

const testYaml = fs.readFileSync(path.join(directory, file)).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('enumerateTargets', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { before, after, opts }) => {
      const transformed = enumerateTargets(new State(), before as GenericParent, opts || {});
      expect(yaml.dump(transformed)).toEqual(yaml.dump(after));
    },
  );
});
