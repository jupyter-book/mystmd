// npm i qrcode
import QRCode from "qrcode";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Adjust to your book SOURCE root (where md/ipynb live). Using process.cwd() is typical.
const IMAGE_DIR = path.join(process.cwd(), "images"); // ensure this folder is inside the source dir

// Helper: depth-first visit
function visit(node, fn, parent = null, index = null) {
  fn(node, parent, index);
  const kids = Array.isArray(node?.children) ? node.children : [];
  for (let i = 0; i < kids.length; i++) visit(kids[i], fn, node, i);
}

// Helper: try to pull iframe src from various node shapes
function extractIframeSrc(node) {
  if (!node) return null;

  // Case A: A custom/parsed iframe node with src property
  if (node.type === "iframe" && typeof node.src === "string") return node.src;

  // Case B: Raw HTML that contains an <iframe ... src="...">
  if (node.type === "raw" && (node.format === "html" || node.format === "text/html")) {
    const html = String(node.value || "");
    const m = html.match(/<iframe[^>]*\s+src=(?:"|')([^"']+)(?:"|')[^>]*>/i);
    if (m) return m[1];
  }

  // Case C: Paragraph/HTML node that has a single raw child with an iframe (common in notebooks)
  if (Array.isArray(node.children)) {
    for (const c of node.children) {
      const src = extractIframeSrc(c);
      if (src) return src;
    }
  }

  return null;
}

const iframeTransform = {
  name: "iframe-pdf",
  doc: "Replace iframes in PDF builds with QR codes (and work for HTML too).",
  stage: "document",
  plugin: (opts, utils) => (tree, vfile) => {
    const isPDF = process.argv.some(arg => arg.includes("pdf"));

    // We’ll collect async tasks and (best effort) wait for them at the end.
    const tasks = [];

    // Ensure images dir exists early
    tasks.push((async () => {
      if (!existsSync(IMAGE_DIR)) await mkdir(IMAGE_DIR, { recursive: true });
    })());

    visit(tree, (node, parent, idx) => {
      // Only attempt replacement if this node (or its subtree) represents an iframe
      const url = extractIframeSrc(node);
      if (!url || parent == null || typeof idx !== "number") return;

      // Build a stable file name
      const lastPart = url.split("/").pop() || "qr";
      const safe = lastPart.replace(/[^a-zA-Z0-9_-]+/g, "_");
      const fileName = `qrcode_${safe}.png`;
      const filePath = path.join(IMAGE_DIR, fileName);
      const relUrl = `images/${fileName}`; // URL to use from documents (relative to source root)

      const makeFigureNode = (imgUrl) => ({
        type: "container",
        kind: "figure",
        children: [
          {
            type: "image",
            url: imgUrl,
            alt: "QR code",
            title: "scan the QR code to open the link",
            // width is honored in HTML; LaTeX uses its own rules, but harmless to include
            width: "200px",
            align: "center",
          },
          {
            type: "caption",
            children: [
              {
                type: "paragraph",
                children: [
                  { type: "text", value: "Scan the QR code or click " },
                  { type: "link", url, children: [{ type: "text", value: "here" }] },
                  { type: "text", value: " to open the video." },
                ],
              },
            ],
          },
        ],
      });

      // Replace immediately with a placeholder figure (HTML can also render it if toDataURL used)
      // For PDF builds, we prefer a file path on disk.
      if (isPDF) {
        // Generate a file on disk so Sphinx can copy it into build.
        const t = (async () => {
          try {
            // Ensure dir created (race-safe because of mkdir+recursive)
            if (!existsSync(IMAGE_DIR)) await mkdir(IMAGE_DIR, { recursive: true });
            await QRCode.toFile(filePath, url, { type: "png", margin: 1, width: 512 });
            // Swap node to a figure pointing at the RELATIVE path
            parent.children[idx] = makeFigureNode(relUrl);
            console.log(`[iframe-pdf] ${vfile?.path || ""}: wrote ${relUrl} for ${url}`);
          } catch (err) {
            console.error("[iframe-pdf] failed to write QR file:", err);
            // Fallback: embed as data URL (works in HTML; may or may not in LaTeX)
            const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 512 });
            parent.children[idx] = makeFigureNode(dataUrl);
          }
        })();
        tasks.push(t);
      } else {
        // Non-PDF builds: you can still show a QR inline as data URL, or keep the iframe.
        // Here we replace with a QR (optionally keep the original by removing this branch).
        const t = (async () => {
          const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 512 });
          parent.children[idx] = makeFigureNode(dataUrl);
        })();
        tasks.push(t);
      }
    });

    // Best-effort wait for all async work. Some pipelines await transforms; this makes it robust if they don't.
    return Promise.allSettled(tasks);
  },
};

const plugin = {
  name: "Iframe PDF Plugin",
  transforms: [iframeTransform],
};

export default plugin;
