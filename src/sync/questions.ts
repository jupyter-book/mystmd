function name(opts: { name: string }) {
  return {
    name: 'name',
    type: 'input',
    message: 'What is the name of this space?',
    default: opts.name,
  };
}

function content(opts: { template?: string; folderIsEmpty: boolean }) {
  return {
    name: 'content',
    type: 'list',
    message: 'What content would you like to use?',
    when() {
      return opts.template === undefined;
    },
    choices: [
      {
        name: 'Import from Curvenote',
        value: 'curvenote',
      },
      {
        name: 'Use the content & notebooks in this folder',
        value: 'folder',
        // Note: enable this in next pass!
        disabled: true || opts.folderIsEmpty,
      },
      {
        name: 'Show me some demo content!',
        value: 'demo',
        disabled: true,
      },
    ],
  };
}

function pull() {
  return {
    name: 'pull',
    message: 'Would you like to pull content now?',
    type: 'confirm',
    default: true,
  };
}

export default {
  name,
  content,
  pull,
};
