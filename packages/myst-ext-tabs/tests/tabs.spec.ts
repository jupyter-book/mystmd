import { MyST } from 'mystjs';
import tabDirectives from 'myst-ext-tabs';

describe('tab directives', () => {
  it.each(['tab-set', 'tabSet'])('empty %s parses', async (name: string) => {
    const content = `\`\`\`{${name}}\n\`\`\``;
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name,
          children: [
            {
              type: 'tabSet',
              children: [],
              position: {
                start: {
                  line: 0,
                  column: 0,
                },
                end: {
                  line: 2,
                  column: 0,
                },
              },
            },
          ],
        },
      ],
    };
    const myst = new MyST({
      directives: { ...tabDirectives },
    });
    expect(myst.parse(content)).toEqual(expected);
  });
  it('tabSet class option parses', async () => {
    const content = '```{tab-set}\n:class: My Class\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'tab-set',
          options: {
            class: 'my class',
          },
          children: [
            {
              type: 'tabSet',
              class: ['my', 'class'],
              children: [],
              position: {
                start: {
                  line: 0,
                  column: 0,
                },
                end: {
                  line: 3,
                  column: 0,
                },
              },
            },
          ],
        },
      ],
    };
    const myst = new MyST({
      directives: { ...tabDirectives },
    });
    expect(myst.parse(content)).toEqual(expected);
  });
  it.each(['tab-item', 'tabItem'])('%s with title parses', async (name: string) => {
    const content = `\`\`\`{${name}} Tab One\n\`\`\``;
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name,
          args: 'Tab One',
          children: [
            {
              type: 'tabItem',
              title: 'Tab One',
              children: [],
              position: {
                start: {
                  line: 0,
                  column: 0,
                },
                end: {
                  line: 2,
                  column: 0,
                },
              },
            },
          ],
        },
      ],
    };
    const myst = new MyST({
      directives: { ...tabDirectives },
    });
    expect(myst.parse(content)).toEqual(expected);
  });
  it('tabItem sync and selected options parse', async () => {
    const content = '```{tab-item} Tab One\n:sync: tab1\n:selected:\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'tab-item',
          args: 'Tab One',
          options: {
            sync: 'tab1',
            selected: true,
          },
          children: [
            {
              type: 'tabItem',
              title: 'Tab One',
              sync: 'tab1',
              selected: true,
              children: [],
              position: {
                start: {
                  line: 0,
                  column: 0,
                },
                end: {
                  line: 4,
                  column: 0,
                },
              },
            },
          ],
        },
      ],
    };
    const myst = new MyST({
      directives: { ...tabDirectives },
    });
    expect(myst.parse(content)).toEqual(expected);
  });
  it('tabItem without title errors', async () => {
    const content = '```{tab-item}\n:sync: tab1\n:selected:\n```';
    const myst = new MyST({
      directives: { ...tabDirectives },
    });
    expect(myst.parse(content).children[0].type).toEqual('mystDirectiveError');
  });
  it('tabSet with tabItem children parses', async () => {
    const content =
      '````{tab-set}\n\n```{tab-item} Tab 1\n:sync: tab1\nTab one\n```\n\n```{tab-item} Tab 2\n:sync: tab2\nTab two\n```\n\n````';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'tab-set',
          value:
            '```{tab-item} Tab 1\n:sync: tab1\nTab one\n```\n\n```{tab-item} Tab 2\n:sync: tab2\nTab two\n```',
          children: [
            {
              type: 'tabSet',
              children: [
                {
                  type: 'mystDirective',
                  name: 'tab-item',
                  args: 'Tab 1',
                  options: {
                    sync: 'tab1',
                  },
                  value: 'Tab one',
                  children: [
                    {
                      type: 'tabItem',
                      title: 'Tab 1',
                      sync: 'tab1',
                      children: [
                        {
                          type: 'paragraph',
                          children: [
                            {
                              type: 'text',
                              value: 'Tab one',
                            },
                          ],
                          position: {
                            start: {
                              line: 4,
                              column: 0,
                            },
                            end: {
                              line: 5,
                              column: 0,
                            },
                          },
                        },
                      ],
                      position: {
                        start: {
                          line: 2,
                          column: 0,
                        },
                        end: {
                          line: 6,
                          column: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'mystDirective',
                  name: 'tab-item',
                  args: 'Tab 2',
                  options: {
                    sync: 'tab2',
                  },
                  value: 'Tab two',
                  children: [
                    {
                      type: 'tabItem',
                      title: 'Tab 2',
                      sync: 'tab2',
                      children: [
                        {
                          type: 'paragraph',
                          children: [
                            {
                              type: 'text',
                              value: 'Tab two',
                            },
                          ],
                          position: {
                            start: {
                              line: 9,
                              column: 0,
                            },
                            end: {
                              line: 10,
                              column: 0,
                            },
                          },
                        },
                      ],
                      position: {
                        start: {
                          line: 7,
                          column: 0,
                        },
                        end: {
                          line: 11,
                          column: 0,
                        },
                      },
                    },
                  ],
                },
              ],
              position: {
                start: {
                  line: 0,
                  column: 0,
                },
                end: {
                  line: 13,
                  column: 0,
                },
              },
            },
          ],
        },
      ],
    };
    const myst = new MyST({
      directives: { ...tabDirectives },
    });
    expect(myst.parse(content)).toEqual(expected);
  });
});
