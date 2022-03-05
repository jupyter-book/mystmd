import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import mdastSchema from './mdast.schema.json';
import commonmarkSchema from './commonmark/commonmark.schema.json';

const ajv = new Ajv();
addFormats(ajv); // allows {"format": "uri"}
ajv.addSchema(mdastSchema);
ajv.addSchema(commonmarkSchema);

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

const directory = 'schema';
let subdirs: string[] = fs
  .readdirSync(directory)
  .map((name) => path.join(directory, name))
  .filter((name) => fs.lstatSync(name).isDirectory());
subdirs = subdirs.concat(directory);

let files: string[] = [];
subdirs.forEach((directory) => {
  files = files.concat(
    fs
      .readdirSync(directory)
      .filter((name) => name.endsWith('.yml'))
      .map((name) => path.join(directory, name))
  );
});

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
    try {
      expect(ajv.validate(mdastSchema, mdast)).toBeTruthy();
    } catch (e) {
      throw new Error(JSON.stringify(ajv.errors, null, 2));
    }
  });
});

describe('Invalid Schema Tests', () => {
  test.each(invalid)('%s', (_, { mdast }) => {
    expect(ajv.validate(mdastSchema, mdast)).toBeFalsy();
  });
});

if (skipped.length) {
  describe(`Skipped Tests`, () => {
    test.skip.each(skipped)('%s', () => null);
  });
}
