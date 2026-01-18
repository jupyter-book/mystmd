import type { DirectiveSpec } from 'myst-common';
import type { VFile } from 'vfile';
import JSON5 from 'json5';

export type AnyWidgetDirective = {
  /** The type of the directive */
  type: 'widget';
  /** The ES module to import */
  esm: string;
  /** The JSON data to initialize the widget */
  json: Record<string, unknown>;
  /** URL to a css stylesheet to load for the widget */
  css?: string;
  /** Tailwind classes to apply to the container element */
  class?: string;
  /** A static filepaths, folder paths or glob patterns to static files to make available to the module */
  static?: string[];
};

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
  name: 'widget',
  alias: ['any:widget'],
  doc: 'Embed a MyST Widget (AnyWidget) component with data in the body',
  arg: {
    type: String,
    required: true,
    doc: 'A Remote URL to the ESM JS module for the widget',
  },
  options: {
    class: {
      type: String,
      required: false,
      doc: 'Tailwind classes to apply to the container element',
    },
    css: {
      type: String,
      required: false,
      doc: 'URL to a CSS file',
    },
    static: {
      type: String,
      required: false,
      doc: 'A file path, folder path or glob pattern to static files to make available to the module',
    },
  },
  body: {
    doc: 'JSON5 (or JSON) object with props to pass down to the component',
    type: String,
    required: true,
  },
  validate(data, vfile) {
    validateStringOptions(vfile, 'arg', data.arg);
    if (data.options?.css) validateStringOptions(vfile, 'css', data.options?.css);
    // TODO?: validate existence of the ESM/CSS files
    if (data.options?.class) validateStringOptions(vfile, 'class', data.options?.class);
    if (data.options?.static) {
      if (!Array.isArray(data.options?.static)) {
        vfile.message('Invalid static supplied must be an array of strings.');
      }
      const staticPaths = data.options?.static as unknown[] as string[];
      for (const s of staticPaths) {
        validateStringOptions(vfile, 'static', s);
      }
    }
    validateStringOptions(vfile, 'body', data.body);
    try {
      const json = JSON5.parse(data.body as string);
      if (typeof json !== 'object' || json === null) {
        vfile.message('Invalid JSON5/JSON supplied.');
      }
    } catch (e) {
      vfile.message('Invalid JSON5/JSON supplied.');
    }
    return data;
  },
  run(data, _vfile, _opts) {
    const body = data.body as string;
    let json: Record<string, unknown>;

    try {
      json = JSON5.parse(body);
    } catch (e) {
      json = { error: 'Invalid JSON5/JSON supplied.' };
    }

    return [
      {
        type: 'widget',
        esm: data.arg as string,
        json,
        css: (data.options?.css ?? data.options?.styles) as string | undefined,
        class: data.options?.class as string | undefined,
        static: data.options?.static as string[] | undefined,
      } satisfies AnyWidgetDirective,
    ];
  },
};
