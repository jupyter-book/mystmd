import { mystParse } from '../../src';
import { positionFn } from '../position';

describe('figure directive default', () => {
  it('figure directive parses, no caption', async () => {
    const content =
      '```{figure} my_image.png\n:name: my-fig\n:class: my-class\n:alt: my image\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 5),
          name: 'figure',
          args: 'my_image.png',
          options: {
            name: 'my-fig',
            class: 'my-class',
            alt: 'my image',
          },
          children: [
            {
              type: 'container',
              kind: 'figure',
              identifier: 'my-fig',
              label: 'my-fig',
              class: 'my-class',
              children: [
                {
                  type: 'image',
                  url: 'my_image.png',
                  alt: 'my image',
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
  it('figure directive parses, caption', async () => {
    const content =
      '```{figure} my_image.png\n:name: my-fig\n:class: my-class\n:alt: my image\nCool caption!\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 6),
          name: 'figure',
          args: 'my_image.png',
          options: {
            name: 'my-fig',
            class: 'my-class',
            alt: 'my image',
          },
          value: 'Cool caption!',
          children: [
            {
              type: 'container',
              kind: 'figure',
              identifier: 'my-fig',
              label: 'my-fig',
              class: 'my-class',
              children: [
                {
                  type: 'image',
                  url: 'my_image.png',
                  alt: 'my image',
                },
                {
                  type: 'caption',
                  children: [
                    {
                      type: 'paragraph',
                      position: positionFn(4, 5),
                      children: [
                        {
                          type: 'text',
                          value: 'Cool caption!',
                        },
                      ],
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
  it('figure directive parses, caption and legend', async () => {
    const content =
      '```{figure} my_image.png\nCool caption!\n\nMore info!!\n\nWait and more??\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 7),
          name: 'figure',
          args: 'my_image.png',
          value: 'Cool caption!\n\nMore info!!\n\nWait and more??',
          children: [
            {
              type: 'container',
              kind: 'figure',
              children: [
                {
                  type: 'image',
                  url: 'my_image.png',
                },
                {
                  type: 'caption',
                  children: [
                    {
                      type: 'paragraph',
                      position: positionFn(1, 2),
                      children: [
                        {
                          type: 'text',
                          value: 'Cool caption!',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'legend',
                  children: [
                    {
                      type: 'paragraph',
                      position: positionFn(3, 4),
                      children: [
                        {
                          type: 'text',
                          value: 'More info!!',
                        },
                      ],
                    },
                    {
                      type: 'paragraph',
                      position: positionFn(5, 6),
                      children: [
                        {
                          type: 'text',
                          value: 'Wait and more??',
                        },
                      ],
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
