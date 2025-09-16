/*  Plugin om exercises ook in pdf formaat te kunnen gebruiken. 
*     - Gebruikt process.argv om te kijken of we een pdf aan het maken zijn. 
*     - Als dat zo is, dan worden de exercises vervangen door een admonition met de title en text van de exercise.
*/

/*  TODO: 
*   - Fix link to both exercise and solution (proper text)
*   - Tradeoff searching recursively for items based on labels etc over hard coded like children[0] etc. Might get expensive time wise for large books. 
*/ 

// see (https://next.jupyterbook.org/plugins/directives-and-roles#create-a-transform)
const exerciseTransform = {
  name: "conditional-exercise",
  doc: "Replace exercises in PDF builds.",
  stage: "document",
  plugin: (opts, utils) => (tree) => {
    // Detect if we are building a PDF
    const isPDF = process.argv.some(arg => arg.includes("pdf"));

    // Keep track of the exercise numbers
    const labelMap = new Map();
    let exerciseCounter = 0;

    const rootChildren = tree.children[0]?.children || [];
    // check if there are any 'error' nodes in the tree
    rootChildren.forEach((node, index) => {
      if(node.type === "admonition") {
       // console.log(node);
      }
    });


    if (isPDF) {
      // Only process the main document's children
      const rootChildren = tree.children[0]?.children || [];

      // Adjust exercise nodes
      rootChildren.forEach((node, index) => {
        if (node.type === "exercise") {

          // Get the label, the number and the name of the exercise
          exerciseCounter++;
          const label = node.label || `Exercise ${exerciseCounter}`; 
          const number = exerciseCounter;
          const text = node.children[0].children[0].value;
          labelMap.set(label, [number, text]); //Set as array

          //Finalise node
          node.type = "admonition";
          node.kind = "note";
          node.children[0].children[0].value = `Exercise ${number}: ${text}`;

          //console.log("[exercise-solution plugin] adjusting exercise ", text);
        }
      });

      //Adjust solution nodes
      rootChildren.forEach((node, index) => {
        if (node.type === "solution") {

          // Get the label of the solution
          let linked_exercise = node.children[0].children.pop().label; //Returns element and removes the link part from the title (pop())
          let [number, text] = labelMap.get(linked_exercise); //Get the number and text of the exercise
 
          //Finalise node
          node.children[0].children[0].value = `Solution to Exercise ${number}: ${text}`; //Set the title of the solution
          node.type = "admonition";
          node.kind = "note";

          // log which solution is being replaced
          //console.log(`[exercise-solution plugin] adjusted solution to ${text}`);
        }
      });

    }
  },
};

const plugin = {
  name: "Conditional Exercise Plugin",
  transforms: [exerciseTransform],
};

export default plugin;

