import type { File } from 'docx';
import type { Export, ExportArticle, ExportFormats } from 'myst-frontmatter';
import type { RendererDoc } from 'myst-templates';
import type { LinkTransformer } from 'myst-transforms';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import type { RendererData } from '../transforms/types.js';
import type { TransformFn } from '../process/mdast.js';

export type RendererFn = (
  session: ISession,
  data: RendererData,
  doc: RendererDoc,
  opts: Record<string, any>,
  staticPath: string,
  vfile: VFile,
) => File;

export type ExportWithFormat = Export & {
  format: ExportFormats;
};

export type ExportWithOutput = ExportWithFormat & {
  articles: ExportArticle[];
  output: string;
  /** renderer is only used for word exports */
  renderer?: RendererFn;
};

export type ExportWithInputOutput = ExportWithOutput & {
  $file: string;
  $project?: string;
};

export type ExportFnOptions = {
  projectPath?: string;
  clean?: boolean;
  extraLinkTransformers?: LinkTransformer[];
  extraTransforms?: TransformFn[];
  ci?: boolean;
  execute?: boolean;
};

export type ExportResults = {
  logFiles?: string[];
  tempFolders: string[];
  hasGlossaries?: boolean;
};

export type ExportFn = (
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
) => Promise<ExportResults>;
