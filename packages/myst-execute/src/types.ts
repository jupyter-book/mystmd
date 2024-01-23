import type * as nbformat from '@jupyterlab/nbformat';
import type { PartialJSONObject } from '@lumino/coreutils';

export interface IExpressionOutput {
  status: 'ok';
  data: nbformat.IMimeBundle;
  metadata: PartialJSONObject;
}

export interface IExpressionError {
  status: 'error';
  /**
   * Exception name
   */
  ename: string;
  /**
   * Exception value
   */
  evalue: string;
  /**
   * Traceback
   */
  traceback: string[];
}

export type IExpressionResult = IExpressionError | IExpressionOutput;
