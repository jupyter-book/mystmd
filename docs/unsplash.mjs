const unsplashDirective = {
  name: 'unsplash',
  doc: 'An example directive for showing a nice random image at a custom size.',
  alias: ['random-pic'],
  arg: { type: String, doc: 'The kinds of images to search for, e.g., `fruit`' },
  options: {
    size: { type: String, doc: 'Size of the image, for example, `500x200`.' },
  },
  run(data) {
    const query = data.arg;
    const size = data.options.size || '500x200';
    const url = `https://source.unsplash.com/random/${size}/?${query}`;
    const img = { type: 'image', url };
    return [img];
  },
};

const plugin = { name: 'Unsplash Images', directives: [unsplashDirective] };

export default plugin;
