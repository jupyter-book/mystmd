import { convertToIOutputs, minifyCellOutput } from '../src/minify';
import { makeNativeErrorOutput, TestFileObject } from './helpers';

describe('minify.convert', () => {
  test.each([[[{} as any]], [[{} as any, {} as any]]])('unrecognized', async (outputs: any[]) => {
    expect(await minifyCellOutput((p: string) => new TestFileObject(p), outputs, {})).toEqual([]);
  });

  test('outputs', async () => {
    const iOutputs = await convertToIOutputs([
      { ...(makeNativeErrorOutput(['oh no']) as any), traceback: 'oh no' },
    ]);

    expect(iOutputs).toHaveLength(1);
    expect(iOutputs[0]).toHaveProperty('output_type', 'error');
    expect(iOutputs[0]).toHaveProperty('traceback', ['oh no']);
  });
});
