import { describe, expect, test } from 'vitest';
import type { Name } from '../frontmatter/types.js';
import { formatName, parseName, startsWithUpperCase } from './parseName.js';

describe('Test name parsing', () => {
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
  test.each<[string, Name, string?]>([
    ['aa', { literal: 'aa', family: 'aa' }],
    ['AA', { literal: 'AA', family: 'AA' }],
    ['AA BB', { literal: 'AA BB', family: 'BB', given: 'AA' }],
    [' AA \t BB  ', { literal: ' AA \t BB  ', family: 'BB', given: 'AA' }, 'AA BB'],
    ['AA bb', { literal: 'AA bb', family: 'bb', given: 'AA' }],
    ['AA bb CC', { literal: 'AA bb CC', family: 'CC', given: 'AA', non_dropping_particle: 'bb' }],
    [
      'AA bb CC dd EE',
      { literal: 'AA bb CC dd EE', family: 'EE', given: 'AA', non_dropping_particle: 'bb CC dd' },
    ],
    [
      'AA 1B cc dd',
      { literal: 'AA 1B cc dd', family: 'dd', given: 'AA 1B', non_dropping_particle: 'cc' },
    ],
    [
      'AA 1b cc dd',
      { literal: 'AA 1b cc dd', family: 'dd', given: 'AA', non_dropping_particle: '1b cc' },
    ],
    [
      'AA bb CC DD',
      { literal: 'AA bb CC DD', family: 'CC DD', given: 'AA', non_dropping_particle: 'bb' },
    ],
    [
      'AA bb CC dd',
      { literal: 'AA bb CC dd', family: 'CC dd', given: 'AA', non_dropping_particle: 'bb' },
    ],
    [
      'bb CC, AA',
      { literal: 'bb CC, AA', family: 'CC', given: 'AA', non_dropping_particle: 'bb' },
      'AA bb CC',
    ],
    [
      'bb CC, aa',
      { literal: 'bb CC, aa', family: 'CC', given: 'aa', non_dropping_particle: 'bb' },
      'aa bb CC',
    ],
    [
      'bb CC dd EE, AA',
      {
        literal: 'bb CC dd EE, AA',
        family: 'EE',
        given: 'AA',
        non_dropping_particle: 'bb CC dd',
      },
      'AA bb CC dd EE',
    ],
    ['CC dd EE, AA', { literal: 'CC dd EE, AA', family: 'CC dd EE', given: 'AA' }],
    ['CC dd EE,', { literal: 'CC dd EE,', family: 'CC dd EE' }],
    ['bb, AA', { literal: 'bb, AA', family: 'bb', given: 'AA' }, 'AA bb'],
    ['BB, ', { literal: 'BB, ', family: 'BB' }, 'BB'],
    [
      'bb CC, XX, AA ',
      {
        literal: 'bb CC, XX, AA ',
        family: 'CC',
        given: 'AA',
        non_dropping_particle: 'bb',
        suffix: 'XX',
      },
      'bb CC, XX, AA',
    ],
    [
      'bb CC, xx, AA ',
      {
        literal: 'bb CC, xx, AA ',
        family: 'CC',
        given: 'AA',
        non_dropping_particle: 'bb',
        suffix: 'xx',
      },
      'bb CC, xx, AA',
    ],
    ['BB, , AA ', { literal: 'BB, , AA ', family: 'BB', given: 'AA' }, 'AA BB'],
    [
      'bb, , ,, CC, XX, AA',
      {
        literal: 'bb, , ,, CC, XX, AA',
        family: ', ,, CC',
        given: 'AA',
        non_dropping_particle: 'bb,',
        suffix: 'XX',
      },
    ],
    [
      'bb CC, AA ee',
      {
        literal: 'bb CC, AA ee',
        family: 'CC',
        given: 'AA',
        dropping_particle: 'ee',
        non_dropping_particle: 'bb',
      },
    ],
    [
      'bb CC, xx, AA ee',
      {
        literal: 'bb CC, xx, AA ee',
        family: 'CC',
        given: 'AA',
        dropping_particle: 'ee',
        non_dropping_particle: 'bb',
        suffix: 'xx',
      },
    ],
    [',,,,,,', { literal: ',,,,,,', family: ',,,,' }, ',,,,,,'],
    [',AA', { literal: ',AA', given: 'AA' }, ', AA'],
    [',XX,AA', { literal: ',XX,AA', given: 'AA', suffix: 'XX' }, ', XX, AA'],
    ['', { literal: '' }],
  ])('string names parse and render correctly: %s', async (name, parsedName, renderedName?) => {
    expect(parseName(name)).toEqual(parsedName);
    delete parsedName.literal;
    renderedName = renderedName ?? name;
    expect(formatName(parsedName)).toEqual(renderedName);
    expect(parseName(renderedName)).toEqual({ literal: renderedName, ...parsedName });
  });
});
