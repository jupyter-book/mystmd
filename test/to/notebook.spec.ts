import { Blocks } from '@curvenote/blocks';
import { toNotebook } from '../../src/to/notebook';

describe('to', () => {
  test('fails', () => {
    expect(toNotebook({} as Blocks.Notebook, [])).toBe({});
  });
});
