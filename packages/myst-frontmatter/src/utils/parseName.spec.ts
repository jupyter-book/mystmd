import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, test } from 'vitest';
import type { Name } from '../frontmatter/types.js';
import { formatName, parseName, startsWithUpperCase } from './parseName.js';

type TestCase = {
  // Formatted name - result of calling formatName on parsed name
  formatted: string;
  // Parsed name - result of calling parseName on formatted name
  parsed: Name;
  // Alternatives - other names that parse to the same parsed name
  alternatives?: string[];
};

type TestCases = {
  title: string;
  cases: TestCase[];
};

const casesList: TestCases[] = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => {
    const content = fs.readFileSync(path.join(__dirname, file), { encoding: 'utf-8' });
    return yaml.load(content) as TestCases;
  });

casesList.forEach(({ title, cases }) => {
  describe(title, () => {
    test.each(cases.map((c): [string, TestCase] => [c.formatted, c]))(
      '%s',
      (_, { formatted, parsed, alternatives }) => {
        [formatted, ...(alternatives ?? [])].forEach((name) => {
          expect(parseName(name)).toEqual({ literal: name, ...parsed });
        });
        expect(formatName(parsed)).toEqual(formatted);
      },
    );
  });
});

describe('Parsing utilities', () => {
  test.each([
    ['Abc', true],
    ['ABC', true],
    ['aBC', false],
    ['abc', false],
    ['àbc', false],
    ['àBC', false],
    ['Àbc', true],
    ['1Abc', true],
    ['1aBC', false],
    ['123', true],
  ])('test startsWithUpperCase: %s', async (word, upper) => {
    expect(startsWithUpperCase(word)).toEqual(upper);
  });
});
