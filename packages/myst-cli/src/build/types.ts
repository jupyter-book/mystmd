import type { File } from 'docx';
import type { Export, ExportArticle, ExportFormats } from 'myst-frontmatter';
import type { RendererDoc } from 'myst-templates';
import type { LinkTransformer } from 'myst-transforms';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import type { RendererData } from '../transforms/types.js';

export type ExportWithOutput = Export & {
  format: ExportFormats;
  articles: ExportArticle[];
  output: string;
};

export type ExportWithInputOutput = ExportWithOutput & {
  $file: string;
  $project?: string;
};

export type ExportOptions = {
  filename?: string;
  template?: string | null;
  disableTemplate?: boolean;
  templateOptions?: Record<string, any>;
  clean?: boolean;
  glossaries?: boolean;
  zip?: boolean;
  force?: boolean;
  projectPath?: string;
  watch?: boolean;
  throwOnFailure?: boolean;
  ci?: boolean;
  renderer?: (
    session: ISession,
    data: RendererData,
    doc: RendererDoc,
    opts: Record<string, any>,
    staticPath: string,
    vfile: VFile,
  ) => File;
};

export type ExportFnOptions = {
  projectPath?: string;
  clean?: boolean;
  extraLinkTransformers?: LinkTransformer[];
  ci?: boolean;
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
