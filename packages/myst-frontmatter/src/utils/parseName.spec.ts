import { describe, expect, test } from 'vitest';
import type { Name } from '../frontmatter/types.js';
import { parseName, renderName, startsWithUpperCase } from './parseName.js';

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
    ['aa', { display: 'aa', family: 'aa' }, 'aa,'],
    ['AA', { display: 'AA', family: 'AA' }, 'AA,'],
    ['AA BB', { display: 'AA BB', family: 'BB', given: 'AA' }, 'BB, AA'],
    [' AA \t BB  ', { display: ' AA \t BB  ', family: 'BB', given: 'AA' }, 'BB, AA'],
    ['AA bb', { display: 'AA bb', family: 'bb', given: 'AA' }, 'bb, AA'],
    ['AA bb CC', { display: 'AA bb CC', family: 'CC', given: 'AA', particle: 'bb' }, 'bb CC, AA'],
    [
      'AA bb CC dd EE',
      { display: 'AA bb CC dd EE', family: 'EE', given: 'AA', particle: 'bb CC dd' },
      'bb CC dd EE, AA',
    ],
    [
      'AA 1B cc dd',
      { display: 'AA 1B cc dd', family: 'dd', given: 'AA 1B', particle: 'cc' },
      'cc dd, AA 1B',
    ],
    [
      'AA 1b cc dd',
      { display: 'AA 1b cc dd', family: 'dd', given: 'AA', particle: '1b cc' },
      '1b cc dd, AA',
    ],
    [
      'AA bb CC DD',
      { display: 'AA bb CC DD', family: 'CC DD', given: 'AA', particle: 'bb' },
      'bb CC DD, AA',
    ],
    [
      'AA bb CC dd',
      { display: 'AA bb CC dd', family: 'CC dd', given: 'AA', particle: 'bb' },
      'bb CC dd, AA',
    ],
    ['bb CC, AA', { display: 'bb CC, AA', family: 'CC', given: 'AA', particle: 'bb' }, 'bb CC, AA'],
    ['bb CC, aa', { display: 'bb CC, aa', family: 'CC', given: 'aa', particle: 'bb' }, 'bb CC, aa'],
    [
      'bb CC dd EE, AA',
      { display: 'bb CC dd EE, AA', family: 'EE', given: 'AA', particle: 'bb CC dd' },
    ],
    ['CC dd EE, AA', { display: 'CC dd EE, AA', family: 'CC dd EE', given: 'AA' }],
    ['CC dd EE,', { display: 'CC dd EE,', family: 'CC dd EE' }],
    ['bb, AA', { display: 'bb, AA', family: 'bb', given: 'AA' }],
    ['BB, ', { display: 'BB, ', family: 'BB' }, 'BB,'],
    [
      'bb CC, XX, AA ',
      { display: 'bb CC, XX, AA ', family: 'CC', given: 'AA', particle: 'bb', suffix: 'XX' },
      'bb CC, XX, AA',
    ],
    [
      'bb CC, xx, AA ',
      { display: 'bb CC, xx, AA ', family: 'CC', given: 'AA', particle: 'bb', suffix: 'xx' },
      'bb CC, xx, AA',
    ],
    ['BB, , AA ', { display: 'BB, , AA ', family: 'BB', given: 'AA' }, 'BB, AA'],
    [
      'bb, , ,, CC, XX, AA',
      {
        display: 'bb, , ,, CC, XX, AA',
        family: ', ,, CC',
        given: 'AA',
        particle: 'bb,',
        suffix: 'XX',
      },
    ],
    [',,,,,,', { display: ',,,,,,', family: ',,,,' }, ' ,,,,, , '],
    [',AA', { display: ',AA', given: 'AA' }, ', AA'],
    [',XX,AA', { display: ',XX,AA', given: 'AA', suffix: 'XX' }, ', XX, AA'],
    ['', { display: '' }],
  ])('string names parse and render correctly: %s', async (name, parsedName, renderedName?) => {
    expect(parseName(name)).toEqual(parsedName);
    delete parsedName.display;
    renderedName = renderedName ?? name;
    expect(renderName(parsedName)).toEqual(renderedName);
    expect(parseName(renderedName)).toEqual({ display: renderedName, ...parsedName });
  });
});
