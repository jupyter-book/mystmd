import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import myst from './myst.schema.json';
import unist from './unist.schema.json';
import abbreviations from './abbreviations.schema.json';
import admonitions from './admonitions.schema.json';
import blocks from './blocks.schema.json';
import comments from './comments.schema.json';
import commonmark from './commonmark.schema.json';
import containers from './containers.schema.json';
import directives from './directives.schema.json';
import footnotes from './footnotes.schema.json';
import math from './math.schema.json';
import references from './references.schema.json';
import roles from './roles.schema.json';
import styles from './styles.schema.json';
import tables from './tables.schema.json';

const ajv = new Ajv();
addFormats(ajv); // allows {"format": "uri-reference"}
ajv.addSchema(myst);
ajv.addSchema(unist);
ajv.addSchema(abbreviations);
ajv.addSchema(admonitions);
ajv.addSchema(blocks);
ajv.addSchema(comments);
ajv.addSchema(commonmark);
ajv.addSchema(containers);
ajv.addSchema(directives);
ajv.addSchema(footnotes);
ajv.addSchema(math);
ajv.addSchema(references);
ajv.addSchema(roles);
ajv.addSchema(styles);
ajv.addSchema(tables);

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  description?: string;
  skip?: boolean;
  invalid?: boolean;
  mdast: Record<string, any>;
  myst?: string;
  html?: string;
};

const directory = 'docs/examples';
const files: string[] = fs
  .readdirSync(directory)
  .filter((name) => name.endsWith('.yml'))
  .map((name) => path.join(directory, name));

// For prettier printing of test cases
const length = files
  .map((f) => path.basename(f).replace('.yml', ''))
  .reduce((a, b) => Math.max(a, b.length), 0);

const skipped: [string, TestCase][] = [];
const invalid: [string, TestCase][] = [];
const cases: [string, TestCase][] = files
  .map((file) => {
    const testYaml = fs.readFileSync(file).toString();
    const cases = yaml.load(testYaml) as TestFile;
    return cases.cases.map((testCase) => {
      const shortName = path.basename(file).replace('.yml', '');
      const section = `${shortName}:`.padEnd(length + 2, ' ');
      const name = `${section} ${testCase.title}`;
      return [name, testCase] as [string, TestCase];
    });
  })
  .flat()
  .filter(([f, t]) => {
    if (t.skip) skipped.push([f, t]);
    if (t.invalid) invalid.push([f, t]);
    return !t.skip && !t.invalid;
  });

describe('Valid Schema Tests', () => {
  test.each(cases)('%s', (_, { mdast }) => {
    expect(ajv.validate(myst, mdast)).toBeTruthy();
  });
});

describe('Invalid Schema Tests', () => {
  test.each(invalid)('%s', (_, { mdast }) => {
    expect(ajv.validate(myst, mdast)).toBeFalsy();
  });
});

if (skipped.length) {
  describe(`Skipped Tests`, () => {
    test.skip.each(skipped)('%s', () => null);
  });
}
