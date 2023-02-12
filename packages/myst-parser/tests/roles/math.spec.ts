import { mystParse } from '../../src';
import { position } from '../position';

describe('math role default', () => {
  it('math role parses', async () => {
    const content = '{math}`1+2`';
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
              name: 'math',
              value: '1+2',
              children: [
                {
                  type: 'inlineMath',
                  value: '1+2',
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
