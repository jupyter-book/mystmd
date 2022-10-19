// TODO: Resurrect support for oxa images and webp.

// export async function saveImageInStaticFolder(...) {
//   const oxa = oxaLinkToId(urlSource);
//   const sourceFileFolder = path.dirname(sourceFile);
//   const imageLocalFile = path.join(sourceFileFolder, urlSource);
//   let file: string | undefined;
//   if (oxa) {
//     // If oxa, get the download url
//     const versionId = oxa?.block as VersionId;
//     if (!versionId?.version) return null;
//     const url = versionIdToURL(versionId);
//     session.log.debug(`Fetching image version: ${url}`);
//     const { ok, json } = await session.get(url);
//     const downloadUrl = json.links?.download;
//     if (!ok || !downloadUrl) {
//       const message = `Error fetching image version: ${url}`;
//       addWarningForFile(session, sourceFile, message, 'error');
//       return null;
//     }
//     file = await downloadAndSaveImage(
//       session,
//       downloadUrl,
//       `${versionId.block}.${versionId.version}`,
//       writeFolder,
//     );
//   } else if (isUrl(urlSource)) {
//     ...
//   }

//   let webp: string | undefined;
//   if (opts?.webp && file) {
//     try {
//       const result = await convertImageToWebp(session, path.join(writeFolder, file));
//       if (result) webp = resolveOutputPath(result, writeFolder, opts.altOutputFolder);
//     } catch (error) {
//       session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
//       const message = `Large image ${imageLocalFile} (${(error as any).message})`;
//       addWarningForFile(session, sourceFile, message, 'warn');
//     }
//   }
//   ...
// }
