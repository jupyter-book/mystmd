import admonitions from './admonition';
import figure from './figure';
import math from './math';
import { Directives } from './types';

export { plugin } from './plugin';

export const directives: Directives = {
  ...admonitions,
  ...figure,
  ...math,
};
