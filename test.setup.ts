/* eslint-disable import/no-extraneous-dependencies */
import 'jest-extended';
import { toMatchOneOf, toMatchShapeOf } from 'jest-to-match-shape-of';
import 'jest-to-match-shape-of/dist/toMatchOneOf';
import 'jest-to-match-shape-of/dist/toMatchShapeOf';

expect.extend({
  toMatchOneOf,
  toMatchShapeOf,
});
