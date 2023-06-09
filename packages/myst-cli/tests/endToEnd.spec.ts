import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { exec } from 'myst-cli-utils';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  cwd: string;
  command: string;
  outputs: {
    path: string;
    content: string;
  }[];
};

const directory = path.join('tests');

function loadCases(file: string) {
  const testYaml = fs.readFileSync(path.join(directory, file)).toString();
  return (yaml.load(testYaml) as TestFile).cases;
}

function resolve(relative: string) {
  return path.resolve(__dirname, relative);
}

describe('End-to-end cli export tests', () => {
  const cases = loadCases('exports.yml');
  test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
    '%s',
    async (_, { cwd, command, outputs }) => {
      // Clean expected outputs if they already exist
      await Promise.all(
        outputs.map(async (output) => {
          if (fs.existsSync(resolve(output.path))) {
            await exec(`rm ${resolve(output.path)}`, { cwd: resolve(cwd) });
          }
        }),
      );
      // Run CLI command
      await exec(command, { cwd: resolve(cwd) });
      // Expect correct output
      outputs.forEach((output) => {
        expect(fs.existsSync(resolve(output.path))).toBeTruthy();
        expect(fs.readFileSync(resolve(output.path), { encoding: 'utf-8' })).toEqual(
          fs.readFileSync(resolve(output.content), { encoding: 'utf-8' }),
        );
      });
    },
  );
});
