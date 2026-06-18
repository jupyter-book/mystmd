import type { IExpressionResult } from 'myst-spec';

export const USER_EXPRESSIONS_FIELD = 'user_expressions';

export interface IUserExpressionMetadata {
  expression: string;
  result: IExpressionResult;
}

export interface IUserExpressionsMetadata {
  [USER_EXPRESSIONS_FIELD]: IUserExpressionMetadata[];
}
