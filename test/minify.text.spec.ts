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
    [['hello ', 'world'], 'hello world', undefined],
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
    [['hello ', 'world'], 'hello world', undefined],
    [['123', '456789012345678901'], '12345', 'somepath-text_plain'],
  ])(
    'minifyErrorOutput',
    async (traceback: string[], expected: string, path: string | undefined) => {
      const output = makeNativeErrorOutput(traceback);

      const minified = await minifyErrorOutput(
        (p: string) => new TestFileObject(p),
        output,
        default_opts,
      );

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
