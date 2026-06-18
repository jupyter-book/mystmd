import type { DocumentExecutionResult, ExecutionResult, CodeResult } from './types.js';
import { isCodeResult } from './types.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { INotebookContent } from '@jupyterlab/nbformat';
import { isCode, isError, isDisplayData } from '@jupyterlab/nbformat';
import type { IExpressionError, IExpressionDisplay } from 'myst-spec';

export interface ICache<T> {
  test(key: string): boolean;

  get(key: string): T | undefined;

  set(key: string, result: T): void;
}

export type IDocumentExecutionCache = ICache<DocumentExecutionResult>;

/**
 * An implementation of a basic cache
 */
export class LocalDiskCache<T> implements ICache<T> {
  constructor(cachePath: string, extension: string) {
    this._cachePath = cachePath;
    this._extension = extension;

    if (!existsSync(cachePath)) {
      mkdirSync(cachePath, { recursive: true });
    }
  }

  private readonly _cachePath: string;
  private readonly _extension: string;

  private _makeKeyPath(key: string): string {
    return path.join(this._cachePath, `${key}${this._extension}`);
  }

  test(key: string): boolean {
    return existsSync(this._makeKeyPath(key));
  }

  get(key: string): T | undefined {
    const keyPath = this._makeKeyPath(key);
    if (!existsSync(keyPath)) {
      return undefined;
    }
    return JSON.parse(readFileSync(keyPath, { encoding: 'utf8' }));
  }

  set(key: string, document: T) {
    const keyPath = this._makeKeyPath(key);
    return writeFileSync(keyPath, JSON.stringify(document), { encoding: 'utf8' });
  }
}

export type LocalExecutionCache = LocalDiskCache<DocumentExecutionResult>;

type NotebookResultMetadata = {
  mystResultType: ExecutionResult['type'];
};

export class NotebookExecutionCache implements IDocumentExecutionCache {
  private baseCache: ICache<INotebookContent>;

  constructor(baseCache: ICache<INotebookContent>) {
    this.baseCache = baseCache;
  }

  test(key: string): boolean {
    return this.baseCache.test(key);
  }
  get(key: string): DocumentExecutionResult | undefined {
    const notebook = this.baseCache.get(key);
    if (notebook === undefined) {
      return undefined;
    }
    return {
      context: (notebook.metadata?.mystContext ?? {}) as Record<string, any>,
      results: notebook.cells.map((cell) => {
        if (!isCode(cell)) {
          throw new Error('Invalid cell in cache');
        } else {
          const resultType = (cell.metadata as NotebookResultMetadata).mystResultType;
          if (resultType === 'code') {
            return {
              type: 'code',
              responses: cell.outputs,
            } satisfies CodeResult;
          } else {
            return {
              type: 'inlineExpression',
              response: cell.outputs
                .map((output) => {
                  if (isError(output)) {
                    return {
                      status: 'error',
                      ename: output.ename,
                      evalue: output.evalue,
                      traceback: output.traceback,
                    } satisfies IExpressionError;
                  } else if (isDisplayData(output)) {
                    return {
                      status: 'ok',
                      data: output.data,
                      metadata: output.metadata,
                    } satisfies IExpressionDisplay;
                  } else {
                    throw new Error('Invalid cell for inlineExpression result');
                  }
                })
                .shift()!,
            };
          }
        }
      }),
    } satisfies DocumentExecutionResult;
  }
  set(key: string, document: DocumentExecutionResult) {
    const notebook: INotebookContent = {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        mystContext: document.context,
      },
      cells: document.results.map((result, index) => {
        if (isCodeResult(result)) {
          return {
            cell_type: 'code',
            source: [],
            metadata: {
              mystResultType: result.type,
            } satisfies NotebookResultMetadata,
            outputs: result.responses,
            execution_count: index,
          };
        } else {
          return {
            cell_type: 'code',
            source: [],
            metadata: {
              mystResultType: result.type,
            } satisfies NotebookResultMetadata,
            outputs: [result.response].map((response) => {
              switch (response.status) {
                case 'ok': {
                  return {
                    output_type: 'display_data',
                    data: response.data,
                    metadata: response.metadata,
                  };
                }
                case 'error': {
                  return {
                    output_type: 'error',
                    ename: response.ename,
                    evalue: response.evalue,
                    traceback: response.traceback,
                  };
                }
                default: {
                  throw new Error('This cannot happen');
                }
              }
            }),
            execution_count: index,
          };
        }
      }),
    };
    this.baseCache.set(key, notebook);
  }
}
