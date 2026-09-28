function sessionTransform(opts, utils) {
  return async (mdast) => {
    console.log('hello', utils.unstableSession);
  };
}

// Declare a transform plugin
const sessionTransformPlugin = {
  plugin: sessionTransform,
  stage: 'document',
};

const plugin = {
  name: 'Session Transform Plugin',
  transforms: [sessionTransformPlugin],
};

export default plugin;
