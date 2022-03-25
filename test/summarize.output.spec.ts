import {
  CellOutputMimeTypes,
  CellOutputType,
  DisplayData,
  OutputSummaryKind,
  Traceback,
} from '@curvenote/blocks';
import { makeCellOutput } from './helpers';
import { StubFileObject, summarizeOutput } from '../src';

describe('summarize.output', () => {
  beforeAll(() => {});
  test.each([
    [
      'text/plain (short)',
      CellOutputType.DisplayData,
      CellOutputMimeTypes.TextPlain,
      'hello text!',
      OutputSummaryKind.text,
      undefined,
    ],
    [
      'text/html',
      CellOutputType.DisplayData,
      CellOutputMimeTypes.TextHtml,
      '<p>hello html!</p>',
      OutputSummaryKind.html,
      undefined,
    ],
  ])('%s', async (s, output_type, content_type, content, kind, path) => {
    const item = makeCellOutput(output_type, content_type, content);

    const dbo = await summarizeOutput((p: string) => new StubFileObject(p), item, 'storage/path', {
      truncate: true,
    });

    expect(Object.keys(dbo.items)).toHaveLength(1);
    expect(dbo.kind).toEqual(kind);
    expect(dbo.items[kind]).toEqual(
      expect.objectContaining({
        kind,
        content_type,
        content,
      }),
    );
    if (path) expect(dbo.items[kind]).toEqual(expect.objectContaining({ path }));
  });
  test('error', async () => {
    const item = {
      output_type: CellOutputType.Traceback,
      ename: 'error name',
      evalue: '404',
      traceback: ['Type Error: Call Stack: ...'],
    } as Traceback;

    const dbo = await summarizeOutput((p: string) => new StubFileObject(p), item, 'storage/path', {
      truncate: true,
    });

    expect(Object.keys(dbo.items)).toHaveLength(1);
    expect(dbo.items[OutputSummaryKind.error]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.error,
        content_type: CellOutputMimeTypes.TextPlain,
        content: 'Type Error: Call Stack: ...',
      }),
    );
    expect(dbo.items[OutputSummaryKind.error]?.path).toBeUndefined();
  });
  test('html', async () => {
    const item = {
      output_type: CellOutputType.DisplayData,
      data: {
        [CellOutputMimeTypes.TextHtml]: ['<h1>', 'hello world', '</h1>'],
        [CellOutputMimeTypes.TextPlain]: 'hello world',
      },
      metadata: {},
    } as DisplayData;
    const dbo = await summarizeOutput((p: string) => new StubFileObject(p), item, 'storage/path', {
      truncate: true,
    });

    expect(Object.keys(dbo.items)).toHaveLength(2);
    expect(dbo.items[OutputSummaryKind.html]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.html,
        content_type: CellOutputMimeTypes.TextHtml,
        content: '<h1>hello world</h1>',
      }),
    );
    expect(dbo.items[OutputSummaryKind.html]?.path).toBeUndefined();
    expect(dbo.items[OutputSummaryKind.text]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.text,
        content_type: CellOutputMimeTypes.TextPlain,
        content: 'hello world',
      }),
    );
    expect(dbo.items[OutputSummaryKind.text]?.path).toBeUndefined();
  });
  test('image (png)', async () => {
    const item = {
      output_type: CellOutputType.DisplayData,
      data: {
        [CellOutputMimeTypes.ImagePng]: 'iVBORw0KGgoAAAANSUhEUgAAA\n',
        [CellOutputMimeTypes.TextPlain]: '<Figure size 640x480 with 1 Axes>',
      },
      metadata: {},
    } as DisplayData;

    const dbo = await summarizeOutput(
      (p: string) => new StubFileObject(p),
      item,
      'storage/path.0',
      {
        truncate: true,
      },
    );

    expect(Object.keys(dbo.items)).toHaveLength(1);
    expect(dbo.items[OutputSummaryKind.image]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.image,
        content_type: CellOutputMimeTypes.ImagePng,
        path: 'storage/path.0.image_png',
      }),
    );
  });
  test('json', async () => {
    const item = {
      output_type: CellOutputType.DisplayData,
      data: {
        [CellOutputMimeTypes.AppJson]: { hello: 42 },
        [CellOutputMimeTypes.TextPlain]: '<IPython.core.display.JSON object>',
      },
      metadata: {},
    } as DisplayData;

    const dbo = await summarizeOutput((p: string) => new StubFileObject(p), item, 'storage/path', {
      truncate: true,
    });

    expect(Object.keys(dbo.items)).toHaveLength(1);
    expect(dbo.items[OutputSummaryKind.json]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.json,
        content_type: CellOutputMimeTypes.AppJson,
        content: '{"hello":42}',
      }),
    );
    expect(dbo.items[OutputSummaryKind.json]?.path).toBeUndefined();
  });
  test('stream', async () => {
    const item = {
      output_type: CellOutputType.Traceback,
      ename: 'error name',
      evalue: '404',
      traceback: ['Type Error: Call Stack: ...'],
    } as Traceback;

    const dbo = await summarizeOutput((p: string) => new StubFileObject(p), item, 'storage/path', {
      truncate: true,
    });

    expect(dbo.kind).toEqual(OutputSummaryKind.error);
    expect(Object.keys(dbo.items)).toHaveLength(1);
    expect(dbo.items[OutputSummaryKind.error]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.error,
        content_type: CellOutputMimeTypes.TextPlain,
        content: 'Type Error: Call Stack: ...',
      }),
    );
    expect(dbo.items[OutputSummaryKind.error]?.path).toBeUndefined();
  });
  test('latex (sympy)', async () => {
    const item = {
      output_type: CellOutputType.DisplayData,
      data: {
        [CellOutputMimeTypes.ImagePng]: 'iVBORw0KGgoAAAANSUhEUgAAAe\n',
        [CellOutputMimeTypes.TextLatex]: ['$', 'E=mc^2', '$'],
        [CellOutputMimeTypes.TextPlain]: ['E=', 'mc**2'],
      },
      metadata: {},
    } as DisplayData;

    const dbo = await summarizeOutput(
      (p: string) => new StubFileObject(p),
      item,
      'storage/path.0',
      {
        truncate: true,
      },
    );

    expect(Object.keys(dbo.items)).toHaveLength(2);
    expect(dbo.items[OutputSummaryKind.latex]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.latex,
        content_type: CellOutputMimeTypes.TextLatex,
        content: '$E=mc^2$',
      }),
    );
    expect(dbo.items[OutputSummaryKind.latex]?.path).toBeUndefined();

    expect(dbo.items[OutputSummaryKind.image]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.image,
        content_type: CellOutputMimeTypes.ImagePng,
        path: 'storage/path.0.image_png',
      }),
    );
  });
  test('svg', async () => {
    const item = {
      output_type: CellOutputType.DisplayData,
      data: {
        [CellOutputMimeTypes.ImageSvg]: ['<svg>', '<g>', '</svg>'],
        [CellOutputMimeTypes.TextPlain]: '<IPython.core.display.SVG object>',
      },
      metadata: {},
    } as DisplayData;

    const dbo = await summarizeOutput(
      (p: string) => new StubFileObject(p),
      item,
      'storage/path.0',
      {
        truncate: true,
      },
    );

    expect(dbo.kind).toEqual(OutputSummaryKind.svg);
    expect(Object.keys(dbo.items)).toHaveLength(2);
    expect(dbo.items[OutputSummaryKind.svg]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.svg,
        content_type: CellOutputMimeTypes.ImageSvg,
        path: 'storage/path.0.image_svg+xml',
      }),
    );
    expect(dbo.items[OutputSummaryKind.text]).toEqual(
      expect.objectContaining({
        kind: OutputSummaryKind.text,
        content_type: CellOutputMimeTypes.TextPlain,
        content: '<IPython.core.display.SVG object>',
      }),
    );
    expect(dbo.items[OutputSummaryKind.text]?.path).toBeUndefined();
  });
});
