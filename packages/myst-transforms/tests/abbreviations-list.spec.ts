import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { abbreviationsListTransform } from '../src';
import { abbreviationListChildren } from '../src/abbreviations';

type TestFile = {
	cases: TestCase[];
};
type TestCase = {
	title: string;
	before: any;
	after: any;
	opts?: {
		abbreviations?: Record<string, string | null>;
	};
};

const fixtures = path.join('tests', 'abbreviations-list.yml');
const testYaml = fs.readFileSync(fixtures).toString();
const cases = (yaml.load(testYaml) as TestFile).cases;

describe('abbreviationListChildren', () => {
	test('returns no children without abbreviations', () => {
		expect(abbreviationListChildren()).toEqual([]);
		expect(abbreviationListChildren({})).toEqual([]);
	});

	test('creates a sorted definition list and omits null values', () => {
		expect(
			abbreviationListChildren({
				MyST: 'Markedly Structured Text',
				SHRILL: null,
				API: 'Application Programming Interface',
			}),
		).toEqual([
			{
				type: 'definitionList',
				children: [
					{
						type: 'definitionTerm',
						children: [{ type: 'text', value: 'API' }],
					},
					{
						type: 'definitionDescription',
						children: [
							{
								type: 'paragraph',
								children: [{ type: 'text', value: 'Application Programming Interface' }],
							},
						],
					},
					{
						type: 'definitionTerm',
						children: [{ type: 'text', value: 'MyST' }],
					},
					{
						type: 'definitionDescription',
						children: [
							{
								type: 'paragraph',
								children: [{ type: 'text', value: 'Markedly Structured Text' }],
							},
						],
					},
				],
			},
		]);
	});
});

describe('abbreviations list', () => {
	test.each(cases.map((c): [string, TestCase] => [c.title, c]))(
		'%s',
		(_, { before, after, opts }) => {
			abbreviationsListTransform(before, opts);
			expect(yaml.dump(before)).toEqual(yaml.dump(after));
		},
	);
});
