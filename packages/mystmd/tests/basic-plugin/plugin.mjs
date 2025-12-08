const redRole = {
  name: 'red',
  doc: 'An example role that sets a custom class.',
  body: {
    type: 'myst',
    required: true,
  },
  run(data) {
    const children = data.body;
    children.forEach((child) => {
      child.class = child.class ? `${child.class} red` : 'red';
    });
    return children;
  },
};

const plugin = { name: 'Example role', roles: [redRole] };

export default plugin;
