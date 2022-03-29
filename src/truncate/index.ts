// export function convertToJupyterOutputs(summaries: OutputSummary[]): IOutput[] {
//   return summaries.map((summary: OutputSummary) => {
//     return Object.entries(summary.items).reduce((acc, [mimetype, item]) => {
//       return { ...acc, [mimetype]: item.content };
//     }, {});
//   });
// }

export {};
