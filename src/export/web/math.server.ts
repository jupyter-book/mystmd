import katex from 'katex';

export function renderEquation(value: string | undefined, displayMode: boolean) {
  if (!value) return null;
  return katex.renderToString(value, { displayMode });
}
