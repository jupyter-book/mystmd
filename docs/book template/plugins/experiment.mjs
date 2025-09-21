/* Custom experiment admonition, based on documentation (see https://next.jupyterbook.org/plugins/directives-and-roles#create-a-custom-admonition). 
*   css file (custom.css) included in style folder. 
*/

const experiment = {
  name: "experiment",
  doc: "A custom admonition that uses a specific color.",
  arg: { type: String, doc: "The title of the admonition." },
  options: {
    collapsed: { type: Boolean, doc: "Whether to collapse the admonition." },
  },
  body: { type: String, doc: "The body of the directive." },
  run(data, vfile, ctx) {
    
    let title = data.arg.trim();
    let body = data.body.trim();

    // console.log("[experiment plugin] ", data.arg, data.body);
    // console.log("[experiment plugin] ", ctx.parseMyst(body));
    // console.log("[experiment plugin] ", ctx.parseMyst(body)["children"]);
    // console.log("[experiment plugin] ", ctx.parseMyst(body)["children"][0]);



    const admonition = {
        "type": "admonition",
        "kind": "admonition",
        "class": "admonition-experiment",  //Add class (custom.css)
        "icon": false,
        "children": [
          
          {
            "type": "admonitionTitle",
            "class": "admonition-title-experiment", // This does not work! note to self: not all dirs take their classes to the output. 
            // The first ["children"][0] removes the MyST "tree" top-level node.
            // The second ["children"] removes an unnecessary top-level paragraph node.
            "children": ctx.parseMyst(`${title}`)["children"][0]["children"]
            
          },
          
          {
            "type": "paragraph",
            "children": ctx.parseMyst(body)["children"] 
          }
        ]
    }
    return [admonition];
  }
};

const experimentTransform = {
  name: "conditional-experiment",
  doc: "Replace custom experiment admonitions in PDF builds.",
  stage: "document",
  plugin: (opts, utils) => (tree) => {
    // Detect if we are building a PDF
    const isPDF = process.argv.some(arg => arg.includes("pdf"));

    // (Optional) keep a map if you later want to cross-link experiments
    const labelMap = new Map();

    if (!isPDF) return;

    // Utility: collect plain text from a node's subtree
    const getText = (node) => {
      if (!node) return "";
      if (node.type === "text" && typeof node.value === "string") return node.value;
      const kids = Array.isArray(node.children) ? node.children : [];
      return kids.map(getText).join("");
    };

    // Only process the main document's children
    const rootChildren = tree.children?.[0]?.children || [];

    rootChildren.forEach((node) => {
      // Your custom directive produces: type="admonition" with class "admonition-experiment"
      if (node?.type !== "admonition") return;

      const classes = node.classes || node.class || node.className || null;
      const hasExperimentClass =
        (typeof classes === "string" && classes.includes("admonition-experiment")) ||
        (Array.isArray(classes) && classes.includes("admonition-experiment"));

      if (!hasExperimentClass) return;

      // Find the title node that your directive created
      const titleNodeIndex = (node.children || []).findIndex(c => c.type === "admonitionTitle");
      const titleNode = titleNodeIndex >= 0 ? node.children[titleNodeIndex] : null;

      // Extract the original title text (inline content inside admonitionTitle)
      const originalTitle = getText(titleNode).trim();

      // If you ever add labels to these nodes, you could store them here:
      const label = node.label || `Experiment`;
      labelMap.set(label, [originalTitle]);

      // Re-title it to "Experiment: <title>"
      // Replace the children of the title node with a single text node
      if (titleNode) {
        titleNode.children = [{ type: "text", value: `Experiment: ${originalTitle}` }];
      } else {
        // If for some reason there is no title node, prepend one
        node.children = [
          {
            type: "admonitionTitle",
            children: [{ type: "text", value: `Experiment: ${originalTitle || ""}` }]
          },
          ...(node.children || [])
        ];
      }

      // Normalize kind so PDFs render consistently
      node.kind = "note";

      // (Optional) if you want to remove the special class in PDFs:
      // If class is a string, strip it; if it's an array, filter it.
      if (Array.isArray(node.classes)) {
        node.classes = node.classes.filter(c => c !== "admonition-experiment");
      } else if (typeof node.class === "string") {
        node.class = node.class
          .split(/\s+/)
          .filter(c => c && c !== "admonition-experiment")
          .join(" ");
      }
    });
  },
};



const plugin = {
  name: "experiment",
  directives: [experiment],
  transforms: [experimentTransform],
};

export default plugin;

