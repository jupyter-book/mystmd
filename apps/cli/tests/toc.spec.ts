import { NavListItemKindEnum } from '@curvenote/blocks';
import { unflattenNavBlocks } from '../src/export/jupyter-book/toc';
import { Block } from '../src/models';

describe('Writing JB TOC', () => {
  test('empty', () => {
    const { items, totalDocuments } = unflattenNavBlocks([]);
    expect(items).toHaveLength(0);
    expect(totalDocuments).toEqual(0);
  });
  test('only groups', () => {
    const { items, hasParts, skipCounter, totalDocuments } = unflattenNavBlocks([
      {
        id: '1',
        kind: NavListItemKindEnum.Group,
        title: 'one',
      },
      {
        id: '2',
        kind: NavListItemKindEnum.Group,
        title: 'two',
      },
    ]);
    expect(items).toHaveLength(2);
    expect(totalDocuments).toEqual(0);
    expect(hasParts).toEqual(true);
    expect(skipCounter).toEqual(0);
  });
  test('flat items', () => {
    const { items, hasParts, skipCounter, totalDocuments } = unflattenNavBlocks([
      {
        id: '1',
        kind: NavListItemKindEnum.Item,
        parentId: null,
        block: { data: { hidden: false } } as Block,
      },
      {
        id: '2',
        kind: NavListItemKindEnum.Item,
        parentId: null,
        block: { data: { hidden: false } } as Block,
      },
    ]);
    expect(items).toHaveLength(2);
    expect(totalDocuments).toEqual(2);
    expect(hasParts).toEqual(false);
    expect(skipCounter).toEqual(0);
  });
  test('hidden item', () => {
    const { items, hasParts, skipCounter, totalDocuments } = unflattenNavBlocks([
      {
        id: '1',
        kind: NavListItemKindEnum.Item,
        parentId: null,
        block: { data: { hidden: true } } as Block,
      },
      {
        id: '2',
        kind: NavListItemKindEnum.Item,
        parentId: null,
        block: { data: { hidden: false } } as Block,
      },
    ]);
    expect(items).toHaveLength(1);
    expect(totalDocuments).toEqual(2);
    expect(hasParts).toEqual(false);
    expect(skipCounter).toEqual(1);
  });
  test('items in group', () => {
    const { items, hasParts, skipCounter, totalDocuments } = unflattenNavBlocks([
      {
        id: '1',
        kind: NavListItemKindEnum.Group,
        title: 'one',
      },
      {
        id: '2',
        kind: NavListItemKindEnum.Item,
        parentId: '1',
        block: { data: { hidden: false } } as Block,
      },
      {
        id: '3',
        kind: NavListItemKindEnum.Item,
        parentId: '1',
        block: { data: { hidden: false } } as Block,
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].children).toHaveLength(2);
    expect(totalDocuments).toEqual(2);
    expect(hasParts).toEqual(true);
    expect(skipCounter).toEqual(0);
  });
  test('nested items in group', () => {
    const { items, hasParts, skipCounter, totalDocuments } = unflattenNavBlocks([
      {
        id: '1',
        kind: NavListItemKindEnum.Group,
        title: 'one',
      },
      {
        id: '2',
        kind: NavListItemKindEnum.Item,
        parentId: '1',
        block: { data: { hidden: false } } as Block,
      },
      {
        id: '3',
        kind: NavListItemKindEnum.Item,
        parentId: '2',
        block: { data: { hidden: false } } as Block,
      },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].children).toHaveLength(1);
    expect(items[0].children[0].children).toHaveLength(1);
    expect(items[0].children[0].children[0].id).toEqual('3');
    expect(totalDocuments).toEqual(2);
    expect(hasParts).toEqual(true);
    expect(skipCounter).toEqual(0);
  });
  test('ignore missing/orphaned parentIds', () => {
    const { items, hasParts, skipCounter, totalDocuments } = unflattenNavBlocks([
      {
        id: '2',
        kind: NavListItemKindEnum.Item,
        parentId: '1',
        block: { data: { hidden: false } } as Block,
      },
      {
        id: '3',
        kind: NavListItemKindEnum.Item,
        parentId: '99',
        block: { data: { hidden: false } } as Block,
      },
    ]);
    expect(items).toHaveLength(2);
    expect(items[1].id).toEqual('3');
    expect(totalDocuments).toEqual(2);
    expect(hasParts).toEqual(false);
    expect(skipCounter).toEqual(0);
  });
});
