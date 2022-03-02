import { GenericNode } from 'mystjs';
import { createElement as e } from 'react';

export const RVar = (node: GenericNode) => {
  return e('r-var', {
    key: node.key,
    name: node.name,
    value: node.value,
    ':value': node.valueFunction,
    format: node.format,
  });
};

export const RDisplay = (node: GenericNode) => {
  return e('r-display', {
    key: node.key,
    name: node.name,
    value: node.value,
    ':value': node.valueFunction,
    format: node.format,
  });
};

export const RDynamic = (node: GenericNode) => {
  return e('r-dynamic', {
    key: node.key,
    name: node.name,
    value: node.value,
    ':value': node.valueFunction,
    max: node.max,
    ':max': node.maxFunction,
    min: node.min,
    ':min': node.minFunction,
    step: node.step,
    ':step': node.stepFunction,
    ':change': node.changeFunction,
    format: node.format,
  });
};

export const RRange = (node: GenericNode) => {
  return e('r-range', {
    key: node.key,
    name: node.name,
    value: node.value,
    ':value': node.valueFunction,
    max: node.max,
    ':max': node.maxFunction,
    min: node.min,
    ':min': node.minFunction,
    step: node.step,
    ':step': node.stepFunction,
    ':change': node.changeFunction,
  });
};

export const reactiveRenderers = {
  'r:var': RVar,
  'r:display': RDisplay,
  'r:dynamic': RDynamic,
  'r:range': RRange,
};
