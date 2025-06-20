export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export interface IFile {
  version: number;
  mdast: any;
}

export type Options = {
  to: number;
  log?: Logger;
};

export interface Migration {
  /**
   * Description of the migration to be used in the documentation
   */
  DESCRIPTION: string;
  VERSION: number;
  DATE: Date;

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
