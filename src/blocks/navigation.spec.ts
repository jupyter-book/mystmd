import { fromDTO } from './navigation';
import { NavListItemKindEnum } from './types';

const emptyDto = {
  items: [{}],
};

const defaultVersion = {
  items: [
    {
      id: '',
      parentId: null,
      kind: NavListItemKindEnum.Item,
      title: '',
      blockId: null,
    },
  ],
};

const dto1 = {
  items: [
    {
      id: 'qwerty',
      parentId: null,
      kind: NavListItemKindEnum.Item,
      title: 'Untitled',
      blockId: null,
    },
  ],
};

const dto2 = {
  items: [
    {
      id: 'qwerty',
      parentId: 'abcdef',
      title: 'Untitled',
      blockId: {
        projct: 'abc',
        block: 'xyz',
        draft: 'null',
      },
    },
  ],
};

describe('Navigation Blocks', () => {
  test.each([
    ['empty', emptyDto, defaultVersion],
    [
      'no block id',
      dto1,
      {
        items: [
          {
            id: 'qwerty',
            title: 'Untitled',
            kind: NavListItemKindEnum.Item,
            parentId: null,
            blockId: null,
          },
        ],
      },
    ],
    [
      'with block id',
      dto2,
      {
        items: [
          {
            parentId: 'abcdef',
            id: 'qwerty',
            title: 'Untitled',
            kind: NavListItemKindEnum.Item,
            blockId: {
              projct: 'abc',
              block: 'xyz',
              draft: 'null',
            },
          },
        ],
      },
    ],
  ])('fromDTO %s', (s, dto, expected) => {
    expect(fromDTO(dto)).toEqual(expected);
  });
});
