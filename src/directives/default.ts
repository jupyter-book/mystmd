import admonitions from './admonition';
import figure from './figure';
import math from './math';
import { Directives } from './types';

const directives: Directives = {
  ...admonitions,
  ...figure,
  ...math,
};

export default directives;
