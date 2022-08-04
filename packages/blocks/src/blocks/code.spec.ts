import { fromDTO } from './code';
import { VersionId } from './types';

describe('Code Blocks', () => {
  let outputBlockId: VersionId;

  beforeAll(() => {
    outputBlockId = {
      project: 'x',
      block: 'y',
      version: 2,
    };
  });

  describe('fromDTO', () => {
    it('given empty json object, create an empty Code block', () => {
      expect(fromDTO({})).toEqual(
        expect.objectContaining({
          content: '',
          language: '',
          metadata: {},
          execution_count: 0,
          output: null,
        }),
      );
    });

    it('given json, create a populated object', () => {
      const jsonObject = {
        content: 'df = pd.Dataframe({"a":[0,1,2,3], "b":[4,5,6,7]})',
        language: 'python',
        metadata: { 'some object': 1 },
        execution_count: 42,
        output: { ...outputBlockId },
      };

      expect(fromDTO(jsonObject)).toEqual(
        // i.e. no property value conversions so far
        expect.objectContaining({ ...jsonObject }),
      );
    });
  });
});
