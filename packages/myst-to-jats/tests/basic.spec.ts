import { unified } from 'unified';
import type { JatsResult } from '../src';
import mystToJats from '../src';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  tree: string;
  jats: string;
  opts?: Record<string, boolean>;
};

const directory = path.join('tests');
const file = 'basic.yml';

const testYaml = fs.readFileSync(path.join(directory, file)).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('Basic JATS body', () => {
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))('%s', (_, { tree, jats }) => {
    const pipe = unified().use(mystToJats);
    pipe.runSync(tree as any);
    const vfile = pipe.stringify(tree as any);
    expect((vfile.result as JatsResult).value).toEqual(jats);
  });
});
