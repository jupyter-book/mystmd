import type { File } from 'docx';
import type { Export } from 'myst-frontmatter';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types';
import type { RendererData } from '../transforms/types';

export type ExportWithOutput = Export & {
  output: string;
};

export type ExportWithInputOutput = ExportWithOutput & {
  $file: string;
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
  renderer?: (
    session: ISession,
    data: RendererData,
    vfile: VFile,
    opts: Record<string, any>,
  ) => File;
};
