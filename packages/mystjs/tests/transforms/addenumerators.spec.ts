import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Root } from 'mdast';
import { enumerateTargets, State } from '../../src';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  before: Root;
  after: Root;
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
      const transformed = enumerateTargets(new State(), before as Root, opts || {});
      expect(yaml.dump(transformed)).toEqual(yaml.dump(after));
    },
  );
});
