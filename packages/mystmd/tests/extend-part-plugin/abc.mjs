// Minimal Myst plugin that deterministically emits the alphabet.


var abcDirective = {
  name: "abc",
  doc: "A directive that will generate deterministic alphabet text.",
  alias: ["alphabet"],
  arg: { type: Number, doc: "The number of paragraphs to generate." },
  options: {},
  run(data) {
    const count = Number(data.arg) || 1;
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    return Array.from({ length: count }, () => ({type: "paragraph", children: [{ type: "text", value: alphabet }]}));
  }
};

var plugin = { name: "Alphabet (abc) by MyST", directives: [abcDirective] };

export default plugin;

