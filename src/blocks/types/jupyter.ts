import { JsonObject } from '../../types';
import { VersionId } from './id';

export type CellId = { notebook: string; cell: string };

export enum CellOutputMimeTypes {
  TextPlain = 'text/plain',
  TextHtml = 'text/html',
  TextLatex = 'text/latex',
  ImagePng = 'image/png',
  ImageBmp = 'image/bmp',
  ImageJpeg = 'image/jpeg',
  ImageSvg = 'image/svg+xml',
  ImageGif = 'image/gif',
  AppJson = 'application/json',
  AppGeoJson = 'application/geo+json',
  AppPlotly = 'application/vnd.plotly.v1+json',
  AppVega = 'application/vnd.vega.v5+json',
  AppVegaLite = 'application/vnd.vegalite.v3+json',
  AppVirtualDom = 'application/vdom.v1+json',
  AppJavascript = 'application/javascript',
  AppWidgetView = 'application/vnd.jupyter.widget-view+json',
  AppWidgetState = 'application/vnd.jupyter.widget-state+json',
  AppBokehLoad = 'application/vnd.bokehjs_load.v0+json',
  AppBokehExec = 'application/vnd.bokehjs_exec.v0+json',
}

export type OutputDataValues = string | string[] | JsonObject;
export type OutputData = Partial<Record<CellOutputMimeTypes, OutputDataValues>>;

export enum CellOutputType {
  Stream = 'stream',
  DisplayData = 'display_data',
  ExecuteResult = 'execute_result',
  Traceback = 'error',
}

export type Stream = {
  output_type: 'stream';
  name: string;
  text: string[] | string;
};

export type DisplayData = {
  output_type: 'display_data';
  data: OutputData;
  metadata: JsonObject;
};

export type ExecuteResult = {
  output_type: 'execute_result';
  execution_count?: number | null;
  data: OutputData;
  metadata: JsonObject;
};

export type Traceback = {
  output_type: 'error';
  ename: string; // Exception name, as a string
  evalue: string; // Exception value, as a string
  traceback: string[]; // The traceback will contain a list of frames, represented each as a string.
};

export type CellOutput = Stream | DisplayData | ExecuteResult | Traceback;

export type NotebookKernelSpec = {
  display_name: string;
  language: string;
  name: string;
};

export type NotebookLanguageInfo = {
  codemirror_mode: {
    name: string;
    version: number;
  };
  file_extension: string;
  mimetype: string;
  name: string;
  nbconvert_exporter: string;
  pygments_lexer: string;
  version: string;
};

export interface JupyterNotebookMetadata {
  kernelspec: NotebookKernelSpec;
  language_info: NotebookLanguageInfo;
  iooxa?: JsonObject;
  [index: string]: any;
}

export type JupyterCellMetadata = {
  collapsed?: boolean | string;
  scrolled?: boolean | string;
  iooxa?: IooxaMetadata;
  [index: string]: any;
};

export type IooxaMetadata = {
  id: VersionId;
  outputId?: VersionId;
};

export enum CELL_TYPE {
  Raw = 'raw',
  Markdown = 'markdown',
  Code = 'code',
}

export type MarkdownCell = {
  cell_type: CELL_TYPE.Markdown;
  metadata: JsonObject;
  source: string | string[];
};

export type RawCell = {
  cell_type: CELL_TYPE.Raw;
  metadata: JsonObject;
  source: string | string[];
};

export type CodeCell = {
  cell_type: CELL_TYPE.Code;
  metadata: JsonObject;
  source: string | string[];
  execution_count?: number | null;
  outputs?: CellOutput[];
};

export type NotebookCell = MarkdownCell | CodeCell | RawCell;

export type JupyterNotebook = {
  nbformat: number;
  nbformat_minor: number;
  metadata: JupyterNotebookMetadata;
  cells: NotebookCell[];
};
