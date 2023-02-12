import { mystParse } from '../../src';
import { position } from '../position';

describe('superscript role default', () => {
  it('superscript role parses', async () => {
    const content = '{superscript}`test`';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'superscript',
              value: 'test',
              children: [
                {
                  type: 'superscript',
                  children: [
                    {
                      type: 'text',
                      value: 'test',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
  it('sub role parses', async () => {
    const content = '{sub}`test`';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'sub',
              value: 'test',
              children: [
                {
                  type: 'subscript',
                  children: [
                    {
                      type: 'text',
                      value: 'test',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
});
