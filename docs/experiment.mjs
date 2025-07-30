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
        "kind": "",
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

// transform function to replace the experiment directive with an admonition in PDF builds
const experimentTransform = {
  name: "conditional-experiment",
  doc: "Replace experiments in PDF builds.",
  stage: "document",
  plugin: (opts, utils) => (tree) => {
    // Detect if we are building a PDF
    const isPDF = process.argv.some(arg => arg.includes("pdf"));

    if (isPDF) {
      // Only process the main document's children
      const rootChildren = tree.children[0]?.children || [];
      
      rootChildren.forEach((node, index) => {
        if (node.type === "experiment") {
          console.log("[experiment plugin] replacing an experiment inside the pdf");
          node.type = "admonition";
          node.kind = "note";
        }
      });
    }
  },
};

const plugin = {
  name: "experiment",
  directives: [experiment],
};



export default plugin;

