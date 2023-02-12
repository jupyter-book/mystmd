import { mystParse } from '../../src';
import { positionFn } from '../position';

describe('image directive default', () => {
  it('image directive parses', async () => {
    const content =
      '```{image} my_image.png\n:class: my-class\n:width: 10px\n:alt: my image\n:align: left\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 6),
          name: 'image',
          args: 'my_image.png',
          options: {
            class: 'my-class',
            width: '10px',
            alt: 'my image',
            align: 'left',
          },
          children: [
            {
              type: 'image',
              url: 'my_image.png',
              class: 'my-class',
              width: '10px',
              alt: 'my image',
              align: 'left',
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
});
