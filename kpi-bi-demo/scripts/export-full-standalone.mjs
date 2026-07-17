import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const distDir = path.join(projectDir, "dist");
const outputDir = path.resolve(projectDir, "..", "..", "project");
const outputPath = path.join(outputDir, "KPI_BI项目预览-macOS.html");
const distIndex = fs.readFileSync(path.join(distDir, "index.html"), "utf8");

const scriptHref = distIndex.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/)?.[1];
const styleHref = distIndex.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/)?.[1]
  ?? distIndex.match(/<link[^>]+href="([^"]+)"[^>]+rel="stylesheet"[^>]*>/)?.[1];

if (!scriptHref || !styleHref) {
  throw new Error("Unable to locate the production JavaScript and CSS assets.");
}

const resolveDistAsset = (href) => path.join(distDir, href.replace(/^\//, ""));
const appScript = fs
  .readFileSync(resolveDistAsset(scriptHref), "utf8")
  .replace(/<\/script/gi, "<\\/script");
const appStyles = fs.readFileSync(resolveDistAsset(styleHref), "utf8");
const weeklyHtml = fs.readFileSync(path.join(projectDir, "public", "weekly-report.html"), "utf8");
const sscHtml = fs.readFileSync(path.join(projectDir, "public", "ssc-data-maintenance.html"), "utf8");
const weeklyBase64 = Buffer.from(weeklyHtml, "utf8").toString("base64");
const sscBase64 = Buffer.from(sscHtml, "utf8").toString("base64");

const bootstrapScript = `
const decodeEmbeddedHtml = (base64) => new TextDecoder().decode(
  Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)),
);
const weeklyStandaloneHtml = decodeEmbeddedHtml("${weeklyBase64}");
const sscStandaloneHtml = decodeEmbeddedHtml("${sscBase64}")
  .replace(
    /if\\(new URLSearchParams\\(window\\.location\\.search\\)\\.get\\('embed'\\)==='1'\\)\\{/,
    "if(true){",
  )
  .replace(
    /activateView\\(new URLSearchParams\\(window\\.location\\.search\\)\\.get\\('view'\\)\\);/,
    "activateView(window.frameElement?.dataset.standaloneView || 'org');",
  );

function embedStandaloneDocuments() {
  document.querySelectorAll("iframe.weekly-document-page__frame").forEach((frame) => {
    if (frame.dataset.standaloneEmbedded === "weekly") return;
    frame.dataset.standaloneEmbedded = "weekly";
    frame.removeAttribute("src");
    frame.srcdoc = weeklyStandaloneHtml;
  });

  document.querySelectorAll("iframe").forEach((frame) => {
    const source = frame.getAttribute("src") || "";
    if (!source.includes("ssc-data-maintenance.html") && frame.dataset.standaloneEmbedded !== "ssc") return;

    const nextView = source.includes("ssc-data-maintenance.html")
      ? new URL(source, "http://standalone.local/").searchParams.get("view") || "org"
      : frame.dataset.standaloneView || "org";
    const viewChanged = frame.dataset.standaloneView !== nextView;

    frame.dataset.standaloneView = nextView;
    frame.dataset.standaloneEmbedded = "ssc";
    frame.removeAttribute("src");

    if (!frame.srcdoc) {
      frame.srcdoc = sscStandaloneHtml;
      return;
    }

    if (viewChanged) {
      queueMicrotask(() => {
        if (typeof frame.contentWindow?.activateView === "function") {
          frame.contentWindow.activateView(nextView);
        } else {
          frame.srcdoc = sscStandaloneHtml;
        }
      });
    }
  });
}

const standaloneObserver = new MutationObserver(embedStandaloneDocuments);
standaloneObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["src"],
});
queueMicrotask(embedStandaloneDocuments);
`;

const standaloneHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KPI_BI一体化管理平台</title>
    <style>${appStyles}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${bootstrapScript}</script>
    <script>${appScript}</script>
  </body>
</html>
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, standaloneHtml, "utf8");

console.log(outputPath);
console.log(`${Buffer.byteLength(standaloneHtml, "utf8")} bytes`);
