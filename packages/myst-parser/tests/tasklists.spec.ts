import { describe, expect, test } from 'vitest';
import type { List } from 'myst-spec';
import type { ListItem } from 'myst-spec-ext';
import { mystParse } from '../src';

describe('Parses GFM Tasklists', () => {
  test('Parse tasklist', () => {
    const mdast = mystParse(`- [ ] task 1\n- [x] task 2\n - not a task`);
    expect(mdast.children[0].type).toBe('list');
    const task1 = (mdast.children[0] as List).children[0] as ListItem;
    const task2 = (mdast.children[0] as List).children[1] as ListItem;
    const task3 = (mdast.children[0] as List).children[2] as ListItem;
    expect(task1.type).toBe('listItem');
    expect(task1.checked).toBe(false);
    expect((task1.children[0] as any).value).toBe('task 1');
    expect(task2.type).toBe('listItem');
    expect(task2.checked).toBe(true);
    expect((task2.children[0] as any).value).toBe('task 2');
    expect(task3.type).toBe('listItem');
    expect(task3.checked).toBe(undefined);
    expect((task3.children[0] as any).value).toBe('not a task');
  });
});
