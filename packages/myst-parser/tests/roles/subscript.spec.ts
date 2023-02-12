import { mystParse } from '../../src';
import { position } from '../position';

describe('subscript role default', () => {
  it('subscript role parses', async () => {
    const content = '{subscript}`test`';
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
              name: 'subscript',
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
