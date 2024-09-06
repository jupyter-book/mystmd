import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { reactiveDirective, reactiveRole } from '../src';

describe('reactive tests', () => {
  it('r:var directive parses', async () => {
    const content = '```{r:var}\n:name: visitors\n:value: 5\n:format: .0f\n```';
    const expected = {
      type: 'root',
      children: [
        {
          name: 'r:var',
          type: 'mystDirective',
          options: {
            name: 'visitors',
            value: '5',
            format: '.0f',
          },
          children: [
            {
              type: 'r:var',
              name: 'visitors',
              value: '5',
              format: '.0f',
            },
          ],
          position: {
            start: {
              column: 1,
              line: 1,
            },
            end: {
              column: 1,
              line: 5,
            },
          },
        },
      ],
    };
    const output = mystParse(content, {
      roles: [reactiveRole],
      directives: [reactiveDirective],
    });
    expect(output).toEqual(expected);
  });
  it('r:dynamic role parses', async () => {
    const content = '{r:dynamic}`rValue="visitors", rChange="{visitors: value}", value="5"`';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position: {
            start: {
              column: 1,
              line: 1,
            },
            end: {
              column: 1,
              line: 1,
            },
          },
          children: [
            {
              name: 'r:dynamic',
              type: 'mystRole',
              value: 'rValue="visitors", rChange="{visitors: value}", value="5"',
              children: [
                {
                  type: 'r:dynamic',
                  valueFunction: 'visitors',
                  changeFunction: '{visitors: value}',
                  value: '5',
                },
              ],
              position: {
                start: {
                  column: 1,
                  line: 1,
                },
                end: {
                  column: 71,
                  line: 1,
                },
              },
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      roles: [reactiveRole],
      directives: [reactiveDirective],
    });
    expect(output).toEqual(expected);
  });
});
