// A front-end renderer plugin.
//
// This plugin contributes two things that work together:
//
//   1. Directives that run at *build time* and emit custom mdast nodes
//      (`counter` and `clock`). These nodes are just data — they carry no
//      rendering logic and are written into the page content JSON as-is.
//
//   2. Renderers that run on the *site* (front-end). Each renderer associates
//      a custom element (the mdast node `type`) with an anywidget-style ESM
//      module. MyST copies these modules into the site's `public/` folder and
//      lists them in the site `config.json` so the theme can load them and
//      render the matching nodes in the browser.

/**
 * `{counter}` directive — emits a `counter` node.
 *
 * The optional argument sets the starting value; the `:label:` option sets the
 * button text. The node is rendered on the site by `renderers/counter.mjs`.
 */
const counterDirective = {
  name: 'counter',
  doc: 'An interactive button that counts how many times it has been clicked.',
  arg: {
    type: Number,
    doc: 'The value to start counting from (defaults to 0).',
  },
  options: {
    label: {
      type: String,
      doc: 'Text shown on the button.',
    },
  },
  run(data) {
    const start = typeof data.arg === 'number' ? data.arg : 0;
    return [{ type: 'counter', start, label: data.options?.label ?? 'Count' }];
  },
};

/**
 * `{clock}` directive — emits a `clock` node.
 *
 * Rendered on the site by `renderers/clock.mjs`, which shows a live-updating
 * wall clock and cleans up its timer when the element is removed.
 */
const clockDirective = {
  name: 'clock',
  doc: 'A live-updating clock showing the current time.',
  options: {
    label: {
      type: String,
      doc: 'Optional label shown before the time.',
    },
  },
  run(data) {
    return [{ type: 'clock', label: data.options?.label ?? '' }];
  },
};

/** Renderer for `counter` nodes. */
const counterRenderer = {
  name: 'Counter',
  doc: 'Renders an interactive click counter button.',
  element: 'paragraph',
  source: 'renderers/counter.mjs',
};

/** Renderer for `clock` nodes. */
const clockRenderer = {
  name: 'Clock',
  doc: 'Renders a live-updating clock.',
  element: 'clock',
  source: 'renderers/clock.mjs',
};

const plugin = {
  name: 'Front-end Renderers Plugin',
  directives: [counterDirective, clockDirective],
  renderers: [counterRenderer, clockRenderer],
};

export default plugin;
