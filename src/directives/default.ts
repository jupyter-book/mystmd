import admonitions from './admonition';
import figure from './figure';
import { Directives } from './types';

const directives: Directives = {
  ...admonitions,
  ...figure,
};

export default directives;
