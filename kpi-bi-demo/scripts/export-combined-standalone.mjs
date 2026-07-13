import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const workspaceDir = path.resolve(projectDir, "..");
const distDir = path.join(projectDir, "dist");
const distIndex = fs.readFileSync(path.join(distDir, "index.html"), "utf8");

const scriptHref = distIndex.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/)?.[1];
const styleHref = distIndex.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/)?.[1];

if (!scriptHref || !styleHref) {
  throw new Error("无法从 dist/index.html 定位构建后的 JavaScript 或 CSS。请先运行 npm run build。");
}

const resolveDistAsset = (href) => path.join(distDir, href.replace(/^\//, ""));
const appScript = fs.readFileSync(resolveDistAsset(scriptHref), "utf8").replace(/<\/script/gi, "<\\/script");
const appStyles = fs.readFileSync(resolveDistAsset(styleHref), "utf8");
const weeklyHtml = fs.readFileSync(path.join(projectDir, "public", "weekly-report.html"), "utf8");
const weeklyBase64 = Buffer.from(weeklyHtml, "utf8").toString("base64");

const bootstrapScript = `
const weeklyHtmlBase64 = "${weeklyBase64}";
const weeklyHtml = new TextDecoder().decode(Uint8Array.from(atob(weeklyHtmlBase64), character => character.charCodeAt(0)));

function embedWeeklyModule() {
  document.querySelectorAll("iframe.weekly-document-page__frame").forEach((frame) => {
    if (frame.dataset.standaloneEmbedded === "true") return;
    frame.dataset.standaloneEmbedded = "true";
    frame.removeAttribute("src");
    frame.srcdoc = weeklyHtml;
  });
}

const standaloneNavLabels = new Set(["\\u7ee9\\u6548\\u4e2d\\u5fc3", "\\u5468\\u62a5"]);
function limitStandaloneNavigation() {
  document.querySelectorAll(".sidebar__nav .sidebar__item").forEach((button) => {
    if (!standaloneNavLabels.has(button.textContent.trim())) button.remove();
  });
}

function syncStandaloneShell() {
  embedWeeklyModule();
  limitStandaloneNavigation();
}

const shellObserver = new MutationObserver(syncStandaloneShell);
shellObserver.observe(document.documentElement, { childList: true, subtree: true });
syncStandaloneShell();

let navigationAttempts = 0;
function openPerformanceCenter() {
  const performanceButton = [...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "绩效中心");
  if (performanceButton) {
    performanceButton.click();
    return;
  }
  navigationAttempts += 1;
  if (navigationAttempts < 120) requestAnimationFrame(openPerformanceCenter);
}
openPerformanceCenter();
`;

const standaloneHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>绩效中心与周报中心</title>
    <style>${appStyles}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${appScript}</script>
    <script>${bootstrapScript}</script>
  </body>
</html>
`;

const outputDir = path.join(workspaceDir, "deliverables");
const outputPath = path.join(outputDir, "绩效中心与周报中心-单文件版.html");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, standaloneHtml, "utf8");

console.log(outputPath);
console.log(`${Buffer.byteLength(standaloneHtml, "utf8")} bytes`);
