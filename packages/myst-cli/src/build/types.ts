import type { File } from 'docx';
import type { Export } from 'myst-frontmatter';
import type { RendererDoc } from 'myst-templates';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types';
import type { RendererData } from '../transforms/types';

export type ExportWithOutput = Export & {
  article: string;
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
  zip?: boolean;
  force?: boolean;
  projectPath?: string;
  throwOnFailure?: boolean;
  renderer?: (
    session: ISession,
    data: RendererData,
    doc: RendererDoc,
    opts: Record<string, any>,
    staticPath: string,
    vfile: VFile,
  ) => File;
};
