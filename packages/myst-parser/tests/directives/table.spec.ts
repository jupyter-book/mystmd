import { mystParse } from '../../src';
import { positionFn } from '../position';

describe('table directive default', () => {
  it('list-table directive parses', async () => {
    const content =
      '```{list-table} This table is cool\n---\nname: my-table\nheader-rows: 2\nclass: my-class\nalign: right\n---\n- - a\n  - b\n  - c\n- - 1\n  - 2\n  - 3\n- - 4\n  - 5\n  - 6\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(0, 17),
          name: 'list-table',
          args: 'This table is cool',
          options: {
            name: 'my-table',
            'header-rows': 2,
            class: 'my-class',
            align: 'right',
          },
          value: '- - a\n  - b\n  - c\n- - 1\n  - 2\n  - 3\n- - 4\n  - 5\n  - 6',
          children: [
            {
              type: 'container',
              kind: 'table',
              identifier: 'my-table',
              label: 'my-table',
              class: 'my-class',
              children: [
                {
                  type: 'caption',
                  children: [
                    {
                      type: 'paragraph',
                      children: [{ type: 'text', value: 'This table is cool' }],
                    },
                  ],
                },
                {
                  type: 'table',
                  align: 'right',
                  children: [
                    {
                      type: 'tableRow',
                      children: [
                        {
                          type: 'tableCell',
                          header: true,
                          children: [
                            {
                              type: 'text',
                              value: 'a',
                            },
                          ],
                        },
                        {
                          type: 'tableCell',
                          header: true,
                          children: [
                            {
                              type: 'text',
                              value: 'b',
                            },
                          ],
                        },
                        {
                          type: 'tableCell',
                          header: true,
                          children: [
                            {
                              type: 'text',
                              value: 'c',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'tableRow',
                      children: [
                        {
                          type: 'tableCell',
                          header: true,
                          children: [
                            {
                              type: 'text',
                              value: '1',
                            },
                          ],
                        },
                        {
                          type: 'tableCell',
                          header: true,
                          children: [
                            {
                              type: 'text',
                              value: '2',
                            },
                          ],
                        },
                        {
                          type: 'tableCell',
                          header: true,
                          children: [
                            {
                              type: 'text',
                              value: '3',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'tableRow',
                      children: [
                        {
                          type: 'tableCell',
                          children: [
                            {
                              type: 'text',
                              value: '4',
                            },
                          ],
                        },
                        {
                          type: 'tableCell',
                          children: [
                            {
                              type: 'text',
                              value: '5',
                            },
                          ],
                        },
                        {
                          type: 'tableCell',
                          children: [
                            {
                              type: 'text',
                              value: '6',
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
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
});
