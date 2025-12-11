import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { cardDirective, splitParagraphNode } from '../src';

describe('card directive', () => {
  it('card directive parses', async () => {
    const content = '```{card} Card Title\nHeader\n^^^\n\nCard content\n+++\nFooter\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'card',
          args: 'Card Title',
          value: 'Header\n^^^\n\nCard content\n+++\nFooter',
          position: {
            start: {
              line: 1,
              column: 1,
            },
            end: {
              line: 8,
              column: 1,
            },
          },
          children: [
            {
              type: 'card',
              children: [
                {
                  type: 'header',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Header',
                        },
                      ],
                      position: {
                        end: {
                          column: 1,
                          line: 3,
                        },
                        start: {
                          column: 1,
                          line: 2,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'cardTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'Card Title',
                      position: {
                        end: {
                          column: 1,
                          line: 1,
                        },
                        start: {
                          column: 1,
                          line: 1,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Card content',
                      position: {
                        end: {
                          column: 1,
                          line: 5,
                        },
                        start: {
                          column: 1,
                          line: 5,
                        },
                      },
                    },
                  ],
                  position: {
                    end: {
                      column: 1,
                      line: 5,
                    },
                    start: {
                      column: 1,
                      line: 5,
                    },
                  },
                },
                {
                  type: 'footer',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Footer',
                          position: {
                            end: {
                              column: 1,
                              line: 7,
                            },
                            start: {
                              column: 1,
                              line: 7,
                            },
                          },
                        },
                      ],
                      position: {
                        end: {
                          column: 1,
                          line: 7,
                        },
                        start: {
                          column: 1,
                          line: 7,
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
    };
    const output = mystParse(content, {
      directives: [cardDirective],
    });
    expect(output).toEqual(expected);
  });
  it('card directive parses with options', async () => {
    const content =
      '```{card} Card Title\n:header: Header\n:footer: Footer\n:link: my-url\nCard\n^^^\ncontent\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'card',
          args: 'Card Title',
          options: {
            header: 'Header',
            footer: 'Footer',
            link: 'my-url',
          },
          value: 'Card\n^^^\ncontent',
          position: {
            start: {
              line: 1,
              column: 1,
            },
            end: {
              line: 8,
              column: 1,
            },
          },
          children: [
            {
              type: 'card',
              url: 'my-url',
              children: [
                {
                  type: 'header',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Header',
                          position: {
                            end: {
                              column: 1,
                              line: 2,
                            },
                            start: {
                              column: 1,
                              line: 2,
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'cardTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'Card Title',
                      position: {
                        end: {
                          column: 1,
                          line: 1,
                        },
                        start: {
                          column: 1,
                          line: 1,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Card\n^^^\ncontent',
                      position: {
                        end: {
                          column: 1,
                          line: 5,
                        },
                        start: {
                          column: 1,
                          line: 5,
                        },
                      },
                    },
                  ],
                  position: {
                    end: {
                      column: 1,
                      line: 7,
                    },
                    start: {
                      column: 1,
                      line: 5,
                    },
                  },
                },
                {
                  type: 'footer',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Footer',
                          position: {
                            end: {
                              column: 1,
                              line: 3,
                            },
                            start: {
                              column: 1,
                              line: 3,
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
      directives: [cardDirective],
    });
    expect(output).toEqual(expected);
  });
  it('card directive parses with minimal content', async () => {
    const content = '```{card}\nCard content\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'card',
          value: 'Card content',
          position: {
            start: {
              line: 1,
              column: 1,
            },
            end: {
              line: 3,
              column: 1,
            },
          },
          children: [
            {
              type: 'card',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Card content',
                      position: {
                        end: {
                          column: 1,
                          line: 2,
                        },
                        start: {
                          column: 1,
                          line: 2,
                        },
                      },
                    },
                  ],
                  position: {
                    end: {
                      column: 1,
                      line: 2,
                    },
                    start: {
                      column: 1,
                      line: 2,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [cardDirective],
    });
    expect(output).toEqual(expected);
  });
});

describe('splitParagraphNode', () => {
  it('non-text nodes pass', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'emphasis',
          children: [
            {
              type: 'text',
              value: 'abc\n^^^\ndef',
            },
          ],
        },
      ],
    };
    expect(splitParagraphNode(input)).toEqual({ before: input, after: null, post: false });
  });
  it('middle delim node splits', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc\n^^^\ndef',
        },
      ],
    };
    const before = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc',
        },
      ],
    };
    const after = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'def',
        },
      ],
    };
    expect(splitParagraphNode(input)).toEqual({ before, after, post: true });
  });
  it('start delim node splits', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '^^^\ndef',
        },
      ],
    };
    const after = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'def',
        },
      ],
    };
    expect(splitParagraphNode(input)).toEqual({ before: null, after, post: true });
  });
  it('start delim node splits with extra whitespace', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '\n^^^\ndef',
        },
      ],
    };
    const after = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'def',
        },
      ],
    };
    expect(splitParagraphNode(input)).toEqual({ before: null, after, post: true });
  });
  it('end delim node splits with extra whitespace', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc\n^^^\n\n',
        },
      ],
    };
    const before = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc',
        },
      ],
    };
    expect(splitParagraphNode(input)).toEqual({ before, after: null, post: true });
  });
  it('end delim node splits', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc\n^^^',
        },
      ],
    };
    const before = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc',
        },
      ],
    };
    expect(splitParagraphNode(input)).toEqual({ before, after: null, post: true });
  });
  it('other nodes remain, including additional delim matches', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '123',
        },
        {
          type: 'text',
          value: 'abc\n^^^\n\ndef',
        },
        {
          type: 'text',
          value: '456\n^^^\n\n789',
        },
      ],
    };
    const before = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '123',
        },
        {
          type: 'text',
          value: 'abc',
        },
      ],
    };
    const after = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'def',
        },
        {
          type: 'text',
          value: '456\n^^^\n\n789',
        },
      ],
    };
    expect(splitParagraphNode(input)).toEqual({ before, after, post: true });
  });
});
