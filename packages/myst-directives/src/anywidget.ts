import type { DirectiveSpec } from 'myst-common';
import type { AnyWidget } from 'myst-spec-ext';
import type { VFile } from 'vfile';
import JSON5 from 'json5';

export function validateStringOptions(
  vfile: VFile,
  fieldName: string,
  field: unknown,
  validValues?: string[],
) {
  const notString = typeof field !== 'string';
  const invalidValues = validValues && typeof field === 'string' && !validValues.includes(field);
  if (notString) vfile.message(`Invalid ${fieldName} supplied.`);
  if (invalidValues)
    vfile.message(`Invalid ${fieldName} supplied must be one of (${validValues.join(' | ')}).`);
}

export const widgetDirective: DirectiveSpec = {
  name: 'anywidget',
  doc: 'Embed a MyST Widget (AnyWidget) component with data in the body',
  arg: {
    type: String,
    required: true,
    doc: 'Path or URL to the ESM JS module for the widget',
  },
  options: {
    // TODO: use commonDirectiveOptions when we're confident
    class: {
      type: String,
      required: false,
      doc: 'Annotate the anywidget with a set of space-delimited class names.',
    },
    css: {
      type: String,
      required: false,
      doc: 'Path or URL to a CSS file',
    },
  },
  body: {
    doc: 'JSON5 (or JSON) object with props to pass down to the component',
    type: String,
    required: false,
  },
  validate(data, vfile) {
    validateStringOptions(vfile, 'arg', data.arg);
    if (data.options?.css) validateStringOptions(vfile, 'css', data.options?.css);
    if (data.options?.class) validateStringOptions(vfile, 'class', data.options?.class);
    if (data.body !== undefined) {
      validateStringOptions(vfile, 'body', data.body);
      try {
        const json = JSON5.parse(data.body as string);
        if (typeof json !== 'object' || json === null) {
          vfile.message('Invalid JSON5/JSON supplied.');
        }
      } catch (e) {
        vfile.message('Invalid JSON5/JSON supplied.');
      }
    }
    return data;
  },
  run(data, _vfile, _opts) {
    let model: ReturnType<typeof JSON5.parse>;
    if (data.body === undefined) {
      model = {};
    } else {
      const body = data.body as string;
      try {
        model = JSON5.parse(body);
      } catch (e) {
        model = { error: 'Invalid JSON5/JSON supplied.' };
      }
    }

    return [
      {
        type: 'anywidget',
        esm: data.arg as string,
        model,
        css: (data.options?.css ?? data.options?.styles) as string | undefined,
        class: data.options?.class as string | undefined,
      } satisfies AnyWidget,
    ];
  },
};
