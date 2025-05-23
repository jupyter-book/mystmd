export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export interface IFile {
  version: number;
  mdast: any;
  frontmatter: Record<string, any>;
}

export type Options = {
  to: number;
  log?: Logger;
};

export interface Migration {
  /**
   * Description of the migration to be used in the documentation
   */
  description: string;
  /**
   * upgrade expects to transform the data from version N
   * to version N+1
   */
  upgrade: (data: IFile) => IFile | Promise<IFile>;

  /**
   * downgrade expects to transform the data from version N
   * to version N-1
   */
  downgrade: (data: IFile) => IFile | Promise<IFile>;
}
