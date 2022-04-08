import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Root } from 'mdast';
import { addNumbersToNodes, State } from '../../src';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  before: Root;
  after: Root;
};

const directory = path.join('tests', 'transforms');
const file = 'addnumbers.yml';

const testYaml = fs.readFileSync(path.join(directory, file)).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('addNumbersToNodes', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    (_, { before, after }) => {
      const transformed = addNumbersToNodes(new State(), before as Root);
      expect(yaml.dump(transformed)).toEqual(yaml.dump(after));
    },
  );
});
