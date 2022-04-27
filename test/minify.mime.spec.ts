import { minifyMimeOutput } from '../src/minify/mime';
import { getLastFileWrite, makeNativeMimeOutput, TestFileObject } from './helpers';

const default_opts = {
  basepath: 'somepath',
  maxCharacters: 20,
  truncateTo: 10,
  randomPath: false,
};

describe('minify.mime', () => {
  test.each([
    ['text/plain', 'execute_result', 'hello world', undefined], // undefined path means conetnt is not truncated
    [
      'text/plain',
      'execute_result',
      'more than twenty characters here for sure',
      'somepath-text-plain',
    ], // undefined path means conetnt is not truncated
    ['text/latex', 'execute_result', '\\LaTeX rules wtf', undefined],
    ['text/html', 'execute_result', '<p>very short</p>', undefined],
    [
      'text/html',
      'execute_result',
      '<div><article><h1>Hello World</h1><p>Welcome to the future</p></article></div>',
      'somepath-text-html',
    ],
    [
      'image/gif',
      'execute_result',
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'somepath-image-gif',
    ],
    [
      'image/png',
      'execute_result',
      'data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'somepath-image-png',
    ],
    [
      'image/png',
      'execute_result',
      'data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'somepath-image-png',
    ],
    [
      'application/json',
      'execute_result',
      { some: { json: 'object' } },
      'somepath-application-json',
    ],
  ])(
    'minifyMimeOutput - single %s',
    async (mimetype: string, output_type: string, content: any, path: string | undefined) => {
      const output = makeNativeMimeOutput(output_type, mimetype, content);

      const minified = await minifyMimeOutput(
        (p: string) => new TestFileObject(p),
        output,
        default_opts,
      );

      expect(minified.output_type).toEqual(output_type);
      expect(minified.data).toHaveProperty(mimetype);
      expect(minified.data[mimetype].content_type).toEqual(mimetype);
      expect(minified.metadata).toEqual({ meta: 'data' });
      expect(minified.data[mimetype].path).toEqual(path);

      if (path) {
        expect(minified.data[mimetype].content).toHaveLength(path.length);
        if (mimetype.startsWith('image/')) {
          expect(getLastFileWrite()).toEqual('writeBase64');
        } else {
          expect(getLastFileWrite()).toEqual('writeString');
        }
      } else {
        expect(minified.data[mimetype].content).toEqual(content);
      }
    },
  );
  test('minifyMimeOutput - multiple %s', () => {});
});
