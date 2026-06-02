import { describe, expect, test } from 'vitest';
import type { DirectiveData } from 'myst-common';
import { abbreviationsDirective } from './abbreviations.js';
import { defaultDirectives } from './index.js';

function run(data: Partial<DirectiveData> = {}) {
	return abbreviationsDirective.run!({
		name: 'abbreviations',
		node: {} as any,
		options: {},
		...data,
	});
}

function log(arg: any) {
	console.dir(arg, { depth: null });
	return arg
}
describe('abbreviations directive', () => {
	test('creates a placeholder node', () => {
		expect(run()).toEqual([{ type: 'abbreviations', children: [] }]);
	});

	test('wraps argument content in a heading', () => {
		expect(run({ arg: [{ type: 'text', value: 'Abbreviations' }] })).toEqual([
			{
				type: 'abbreviations',
				children: [
					{
						type: 'heading',
						depth: 2,
						enumerated: false,
						children: [{ type: 'text', value: 'Abbreviations' }],
					},
				],
			},
		]);
	});

	test('preserves heading arguments', () => {
		const heading = {
			type: 'heading',
			depth: 3,
			children: [{ type: 'text', value: 'Terms' }],
		};
		expect(run({ arg: [heading] })).toEqual([{ type: 'abbreviations', children: [heading] }]);
	});

	test('preserves common directive options', () => {
		expect(
			run({
				options: {
					class: 'compact',
					label: 'abbreviations-list',
				},
			}),
		).toEqual([
			{
				type: 'abbreviations',
				children: [],
				class: 'compact',
				label: 'abbreviations-list',
				identifier: 'abbreviations-list',
			},
		]);
	});

	test('is registered by default', () => {
		expect(defaultDirectives).toContain(abbreviationsDirective);
	});
});
