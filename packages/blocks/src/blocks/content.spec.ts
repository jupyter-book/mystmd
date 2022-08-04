import { fromDTO } from './content';
import { TARGET } from './types';

describe('Content Blocks', () => {
  describe('fromDTO', () => {
    it('adds empty string is content missing', () => {
      expect(fromDTO({})).toEqual(
        expect.objectContaining({
          content: '',
          metadata: {},
        }),
      );
    });

    it('copies content if present', () => {
      expect(
        fromDTO({
          content: 'hello iooxa!',
          targets: [TARGET.JupyterRaw],
          metadata: { jupyter: { a: 'b' } },
        }),
      ).toEqual(
        expect.objectContaining({
          content: 'hello iooxa!',
          targets: [TARGET.JupyterRaw],
          metadata: { jupyter: { a: 'b' } },
        }),
      );
    });
  });
});
