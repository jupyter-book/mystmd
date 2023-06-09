import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { tabDirectives } from '../src';

describe('tab directives', () => {
  it.each(['tab-set', 'tabSet'])('empty %s parses', async (name: string) => {
    const content = `\`\`\`{${name}}\n\`\`\``;
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name,
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
          children: [
            {
              type: 'tabSet',
              children: [],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [...tabDirectives],
    });
    expect(output).toEqual(expected);
  });
  it('tabSet class option parses', async () => {
    const content = '```{tab-set}\n:class: my-class\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'tab-set',
          options: {
            class: 'my-class',
          },
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
          children: [
            {
              type: 'tabSet',
              class: 'my-class',
              children: [],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [...tabDirectives],
    });
    expect(output).toEqual(expected);
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
          children: [
            {
              type: 'tabItem',
              title: 'Tab One',
              children: [],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [...tabDirectives],
    });
    expect(output).toEqual(expected);
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
          children: [
            {
              type: 'tabItem',
              title: 'Tab One',
              sync: 'tab1',
              selected: true,
              children: [],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [...tabDirectives],
    });
    expect(output).toEqual(expected);
  });
  // TODO: enable when we have a better required/fallback/default pattern
  it.skip('tabItem without title errors', async () => {
    const content = '```{tab-item}\n:sync: tab1\n:selected:\n```';
    const output = mystParse(content, {
      directives: [...tabDirectives],
    });
    expect(output.children[0].type).toEqual('mystDirectiveError');
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
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [...tabDirectives],
    });
    expect(output).toEqual(expected);
  });
});
