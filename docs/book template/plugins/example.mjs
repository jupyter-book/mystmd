// example.mjs

// Helpers
const parseInline = (s, ctx) => {
  const txt = (s || "").trim();
  if (!txt) return [{ type: "text", value: "" }];
  const tree = ctx.parseMyst(txt);
  const first = tree?.children?.[0];
  return (first?.type === "paragraph" ? first.children : tree?.children) ?? [{ type: "text", value: txt }];
};

const parseBlocks = (s, ctx) => {
  const tree = ctx.parseMyst(s || "");
  const kids = tree?.children ?? [];
  return kids.length ? kids : [{ type: "paragraph", children: [{ type: "text", value: (s || "").trim() }] }];
};

const example = {
  name: "example",
  doc: "Custom admonition that tolerates block content (e.g. figures).",
  arg: { type: String, doc: "Title" },
  options: { collapsed: { type: Boolean, doc: "Collapse state" } },
  body: { type: String, doc: "Body" },
  run(data, vfile, ctx) {
    const title = (data.arg || "").trim();
    const body = (data.body || "").trim();

    // Belangrijk: gebruik een "bekende" soort, bv. "note"
    // (exporter kent 'note'/'tip'/'warning'/'info' etc.)
    const kind = "note";

    const node = {
      type: "admonition",
      kind,                     // <-- geen "admonition" maar bv. "note"
      classes: ["admonition-example"],
      class: "admonition-example", // <-- zet ook 'class' voor compat
      icon: false,
      children: [
        { type: "admonitionTitle", classes: ["admonition-title-example"], children: parseInline(title, ctx) },
        ...parseBlocks(body, ctx), // <-- laat blocks zoals figure intact
      ],
    };

    return [node];
  }
};

// Optioneel: transform die titels normaliseert in PDF-builds
const exampleTransform = {
  name: "conditional-example",
  stage: "document",
  plugin: () => (tree) => {
    // Detecteer PDF/Typst run (pas evt. aan naar jouw pipeline)
    const looksLikePdf =
      process.argv.some(a => /pdf|xelatex|typst/i.test(a)) ||
      /pdf|xelatex|typst/i.test(process.env.MYST_TARGET || "");

    if (!looksLikePdf) return;

    // Kleine recursive visitor (geen utils.visit nodig)
    const visit = (node, fn) => {
      if (!node || typeof node !== "object") return;
      fn(node);
      const kids = Array.isArray(node.children) ? node.children : [];
      for (const child of kids) visit(child, fn);
    };

    const getText = (n) => {
      if (!n) return "";
      if (n.type === "text") return n.value || "";
      const kids = Array.isArray(n.children) ? n.children : [];
      return kids.map(getText).join("");
    };

    visit(tree, (node) => {
      if (node?.type !== "admonition") return;

      const classes = node.classes ?? node.class ?? node.className ?? [];
      const hasExample =
        Array.isArray(classes)
          ? classes.includes("admonition-example")
          : String(classes).includes("admonition-example");
      if (!hasExample) return;

      // Titel normaliseren
      const idx = (node.children || []).findIndex(c => c.type === "admonitionTitle");
      const titleNode = idx >= 0 ? node.children[idx] : null;
      const original = (getText(titleNode) || "").trim();
      const newTitle = `Example: ${original}`;

      if (titleNode) {
        titleNode.children = [{ type: "text", value: newTitle }];
      } else {
        node.children = [
          { type: "admonitionTitle", children: [{ type: "text", value: newTitle }] },
          ...(node.children || []),
        ];
      }

      // Zorg dat PDF-styling een bekende soort krijgt
      node.kind = "note";

      // (optioneel) custom class weghalen in PDFs
      if (Array.isArray(node.classes)) {
        node.classes = node.classes.filter(c => c !== "admonition-example");
      } else if (typeof node.class === "string") {
        node.class = node.class.split(/\s+/).filter(c => c && c !== "admonition-example").join(" ");
      }
    });
  },
};

const plugin = {
  name: "example-plugin",
  directives: [example],
  transforms: [exampleTransform],
};

export default plugin;
