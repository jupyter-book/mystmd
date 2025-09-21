/* - check if PDF
*  - check for iframes
*  - generate QR code for iframe link
*  - replace node
*  QR codes will be saved in the image_folder. make sure this folder exists!
*/


// see (https://next.jupyterbook.org/plugins/directives-and-roles#create-a-transform)

// npm install qrcode
import QRCode from "qrcode";
import { writeFile } from "fs/promises";
import { type } from "os";

const image_folder = "./images";

const iframeTransform = {
  name: "iframe-pdf",
  doc: "Replace iframes in PDF builds with QR codes.",
  stage: "document",
  plugin: (opts, utils) => async (tree) => {
    
    // Detect if we are building a PDF
    const isPDF = process.argv.some(arg => arg.includes("pdf"));

    // Get all nodes for each page
    const rootChildren = tree.children[0]?.children || [];

    if (isPDF) {
        for (const [index, node] of rootChildren.entries()) {
            if (node.type === "container" && node.children[0]?.type === "iframe") {
                const url = node.children[0]?.src || "No link found";
                
                // Let image name be last part of the URL
                const urlParts = url.split('/');
                const lastPart = urlParts[urlParts.length - 1];

                try {

                    node.qr_index =  lastPart.replace(/[^a-zA-Z0-9]/g, '_'); // sanitize for filename
                    // Generate QR code as a buffer (PNG format)
                    const buffer = await QRCode.toBuffer(url, { type: "png" });

                    // Save buffer to file
                    const outputFile = `${image_folder}/qrcode_${node.qr_index}.png`;
                    await writeFile(outputFile, buffer);

                    console.log(`[IFRAME] Generated QR code, saved to ${outputFile}`);
                  
                    // node.type = "paragraph";
                    // node.children = [
                    // {
                    //     type: "paragraph",
                    //     children: [
                    //     { type: "text", value: "scan qr code to go to video" }
                    //     ]
                    // },
                    // {
                    //     type: "image",
                    //     url: `images/qrcode_${node.qr_index}.png`,  // make sure relative to book build
                    //     alt: "QR code",
                    //     title: "scan the QR code to open the link"
                    // },
                    // {
                    //     type: "paragraph",
                    //     children: [
                    //     { type: "text", value: "or click " },
                    //     { type: "link", url: url, children: [{ type: "text", value: "here" }] },
                    //     { type: "text", value: " to open the link" }
                    //     ]
                    // }
                    // ];

                    // make a figure out of it 
                    node.type = "container";
                    node.kind = "figure";
                    node.children = [
                        {
                            type: "image",
                            url: `../images/qrcode_${node.qr_index}.png`,  // make sure
                            alt: "QR code",
                            title: "scan the QR code to open the link",
                            width: "200px",
                            align: "center"
                        },
                        {type : 'caption', children: [{type : 'paragraph', children: [{type : 'text', value : 'scan the QR code to open the link or click '}, {type : 'link', url : url, children: [{type : 'text', value : 'here'}]}, {type : 'text', value : ' to open the link.'}]}]}
                    ]
                    
                } catch (err) {
                    console.log("[IFRAME] Error generating QR code:", err);
                }
            }
        }
    }
  },
};

const plugin = {
  name: "Iframe PDF Plugin",
  transforms: [iframeTransform],
};

export default plugin;