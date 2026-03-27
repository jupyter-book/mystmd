// Minimal Myst plugin that deterministically emits the alphabet.

function u(type, props, value) {
  const node = { type: String(type) };
  if ((value === void 0 || value === null) && (typeof props === "string" || Array.isArray(props))) {
    value = props;
  } else {
    Object.assign(node, props);
  }
  if (Array.isArray(value)) {
    node.children = value;
  } else if (value !== void 0 && value !== null) {
    node.value = String(value);
  }
  return node;
}

var abcDirective = {
  name: "abc",
  doc: "A directive that will generate deterministic alphabet text.",
  alias: ["alphabet"],
  arg: { type: Number, doc: "The number of paragraphs to generate." },
  options: {},
  run(data) {
    const count = Number(data.arg) || 1;
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    return Array.from({ length: count }, () => u("paragraph", [{ type: "text", value: alphabet }]));
  }
};

var plugin = { name: "Alphabet (abc) by MyST", directives: [abcDirective] };

export default plugin;

