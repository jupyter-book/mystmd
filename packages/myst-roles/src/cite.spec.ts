import { describe, expect, it, beforeEach, vi } from 'vitest';
import { VFile } from 'vfile';
import { citeRole } from './cite';

describe('cite roles', () => {
  it.each([
    [
      'cite:t',
      '1987:nelson',
      [
        {
          type: 'citeGroup',
          kind: 'narrative',
          children: [{ type: 'cite', kind: 'narrative', label: '1987:nelson' }],
        },
      ],
    ],
    [
      'cite:p',
      '1987:nelson',
      [
        {
          type: 'citeGroup',
          kind: 'parenthetical',
          children: [{ type: 'cite', kind: 'parenthetical', label: '1987:nelson' }],
        },
      ],
    ],
    ['cite:alp', '1987:nelson', [{ type: 'cite', kind: 'parenthetical', label: '1987:nelson' }]],
    ['cite:alps', '1987:nelson', [{ type: 'cite', kind: 'parenthetical', label: '1987:nelson' }]],
    [
      'cite:authorpar',
      '1987:nelson',
      [
        {
          type: 'citeGroup',
          kind: 'parenthetical',
          children: [
            { type: 'cite', kind: 'parenthetical', label: '1987:nelson', partial: 'author' },
          ],
        },
      ],
    ],
    [
      'cite:p',
      '1987:nelson,2001:schechter',
      [
        {
          type: 'citeGroup',
          kind: 'parenthetical',
          children: [
            { type: 'cite', kind: 'parenthetical', label: '1987:nelson' },
            { type: 'cite', kind: 'parenthetical', label: '2001:schechter' },
          ],
        },
      ],
    ],
    [
      'cite',
      '{see}1977:nelson',
      [{ type: 'cite', kind: 'narrative', label: '1977:nelson', prefix: 'see' }],
    ],
    [
      'cite:p',
      '{see}1977:nelson{p. 1166}',
      [
        {
          type: 'citeGroup',
          kind: 'parenthetical',
          children: [
            {
              type: 'cite',
              kind: 'parenthetical',
              label: '1977:nelson',
              prefix: 'see',
              suffix: 'p. 1166',
            },
          ],
        },
      ],
    ],
    [
      'cite:yearpar',
      '{see}1977:nelson',
      [
        {
          type: 'citeGroup',
          kind: 'parenthetical',
          children: [
            {
              type: 'cite',
              kind: 'parenthetical',
              label: '1977:nelson',
              partial: 'year',
              prefix: 'see',
            },
          ],
        },
      ],
    ],
  ])('{%s}`%s`', async (name, body, nodes) => {
    const result = citeRole.run({ name, body }, new VFile());
    expect(result).containSubset(nodes);
  });
});
