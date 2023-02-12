import { mystParse } from '../../src';
import { position } from '../position';

describe('abbreviation role default', () => {
  it('abbreviation role parses', async () => {
    const content = '{abbreviation}`CSS`';
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
              name: 'abbreviation',
              value: 'CSS',
              children: [
                {
                  type: 'abbreviation',
                  children: [
                    {
                      type: 'text',
                      value: 'CSS',
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
  it('abbr role parses', async () => {
    const content = '{abbr}`CSS (Cascading Style Sheets)`';
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
              name: 'abbr',
              value: 'CSS (Cascading Style Sheets)',
              children: [
                {
                  type: 'abbreviation',
                  title: 'Cascading Style Sheets',
                  children: [
                    {
                      type: 'text',
                      value: 'CSS',
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
