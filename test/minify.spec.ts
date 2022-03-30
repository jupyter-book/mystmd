import { minifyCellOutput } from '../src/minify';
import {
  makeNativeErrorOutput,
  makeNativeMimeOutput,
  makeNativeStreamOutput,
  TestFileObject,
} from './helpers';

describe('minify', () => {
  test.each([[[{} as any]], [[{} as any, {} as any]]])('unrecognized', async (outputs: any[]) => {
    expect(
      await minifyCellOutput((p: string) => new TestFileObject(p), outputs, {
        randomPath: true,
      }),
    ).toEqual([]);
  });
  test.each([
    [[makeNativeStreamOutput('hello')]],
    [[makeNativeStreamOutput('hello'), makeNativeStreamOutput('hello')]],
  ])('outputs', async (outputs: any[]) => {
    expect(
      await minifyCellOutput((p: string) => new TestFileObject(p), outputs, {
        randomPath: true,
      }),
    ).toHaveLength(outputs.length);
  });

  test('outputs', async () => {
    const outputs = await minifyCellOutput(
      (p: string) => new TestFileObject(p),
      [makeNativeStreamOutput('hello'), makeNativeErrorOutput(['oh no']), makeNativeMimeOutput()],
      {
        randomPath: true,
      },
    );

    expect(outputs).toHaveLength(3);
    expect(outputs[0]).toHaveProperty('output_type', 'stream');
    expect(outputs[0]).toHaveProperty('name', 'stdout');
    expect(outputs[0]).toHaveProperty('text', 'hello');
    expect(outputs[1]).toHaveProperty('output_type', 'error');
    expect(outputs[1]).toHaveProperty('traceback', 'oh no');
    expect(outputs[2]).toHaveProperty('output_type', 'execute_result');
    expect(outputs[2]).toHaveProperty('data');
    expect(outputs[2]).toHaveProperty('metadata');
  });
});
