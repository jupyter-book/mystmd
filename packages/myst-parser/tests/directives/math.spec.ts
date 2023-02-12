import { mystParse } from '../../src';
import { positionFn } from '../position';

describe('math directive default', () => {
  it('math directive parses', async () => {
    const content = '```{math}\n:label: addition\n1+2\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 4),
          name: 'math',
          options: {
            label: 'addition',
          },
          value: '1+2',
          children: [
            {
              type: 'math',
              identifier: 'addition',
              label: 'addition',
              value: '1+2',
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
});
