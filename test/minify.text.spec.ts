import { minifyStreamOutput, minifyErrorOutput } from '../src/minify/text';
import {
  getLastFileWrite,
  makeNativeErrorOutput,
  makeNativeStreamOutput,
  TestFileObject,
} from './helpers';

const default_opts = {
  basepath: 'somepath',
  maxCharacters: 20,
  truncateTo: 10,
  randomPath: false,
};

describe('minify.text', () => {
  test.each([
    ['hello world', 'hello world', undefined],
    ['123456789012345678901', '12345', 'somepath-text_plain'],
    [['hello ', 'world'], 'hello \nworld', undefined],
    [['123', '456789012345678901'], '12345', 'somepath-text_plain'],
  ])(
    'minifyStreamOutput',
    async (content: string | string[], expected: string, path: string | undefined) => {
      const output = makeNativeStreamOutput(content);

      const minified = await minifyStreamOutput(
        (p: string) => new TestFileObject(p),
        output,
        default_opts,
      );

      expect(minified.output_type).toEqual('stream');
      expect(minified.metadata).toEqual({ meta: 'data' });

      if (path) {
        expect(minified.path).toEqual(path);
        expect(minified.text).toHaveLength(default_opts.truncateTo);
      } else {
        expect(minified.text).toEqual(expected);
      }
    },
  );
  test.each([
    [['hello ', 'world'], 20, 'hello \nworld', undefined],
    [['123', '456789012345678901'], 20, '12345', 'somepath-text_plain'],
    [
      [
        '\u001b[0;31m---------------------------------------------------------------------------\u001b[0m',
        '\u001b[0;31mNameError\u001b[0m                                 Traceback (most recent call last)',
        'Input \u001b[0;32mIn [5]\u001b[0m, in \u001b[0;36m<cell line: 1>\u001b[0;34m()\u001b[0m\n\u001b[0;32m----> 1\u001b[0m this \u001b[38;5;241m=\u001b[39m \u001b[43mnot_python\u001b[49m\n',
        "\u001b[0;31mNameError\u001b[0m: name 'not_python' is not defined",
      ],
      1000,
      "\u001b[0;31m---------------------------------------------------------------------------\u001b[0m\n\u001b[0;31mNameError\u001b[0m                                 Traceback (most recent call last)\nInput \u001b[0;32mIn [5]\u001b[0m, in \u001b[0;36m<cell line: 1>\u001b[0;34m()\u001b[0m\n\u001b[0;32m----> 1\u001b[0m this \u001b[38;5;241m=\u001b[39m \u001b[43mnot_python\u001b[49m\n\n\u001b[0;31mNameError\u001b[0m: name 'not_python' is not defined",
      undefined,
    ],
  ])(
    'minifyErrorOutput',
    async (
      traceback: string[],
      maxCharacters: number,
      expected: string,
      path: string | undefined,
    ) => {
      const output = makeNativeErrorOutput(traceback);

      const minified = await minifyErrorOutput((p: string) => new TestFileObject(p), output, {
        ...default_opts,
        maxCharacters,
      });

      expect(minified.output_type).toEqual('error');
      expect(minified.metadata).toEqual({ meta: 'data' });
      expect(minified.ename).toEqual(output.ename);
      expect(minified.evalue).toEqual(output.evalue);

      if (path) {
        expect(minified.path).toEqual(path);
        expect(minified.traceback).toHaveLength(default_opts.truncateTo);
      } else {
        expect(minified.traceback).toEqual(expected);
      }
    },
  );
});
