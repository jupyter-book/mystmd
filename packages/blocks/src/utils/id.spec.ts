import { BlockId } from '../blocks/types';

import { projectIdToString, blockListToString, blockIdToString } from './id';
import { ProjectId } from '../projects';

describe('Utils', () => {
  describe('URI mutators', () => {
    it('projectIdToString', () => {
      expect(projectIdToString('abcdef' as ProjectId)).toEqual('abcdef');
    });

    it('blockListToString', () => {
      expect(blockListToString('abcdef' as ProjectId)).toEqual('abcdef/blocks');
    });

    it('blockIdToString', () => {
      expect(blockIdToString({ project: 'a', block: 'b' } as BlockId)).toEqual('a/b');
    });
  });
});
