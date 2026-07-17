const { app, BrowserWindow, Menu } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

let mainWindow;
let staticServer;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function startStaticServer() {
  const distRoot = path.resolve(app.getAppPath(), "dist");

  return new Promise((resolve, reject) => {
    staticServer = http.createServer((request, response) => {
      try {
        const requestUrl = new URL(request.url, "http://127.0.0.1");
        const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^[/\\]+/, "") || "index.html";
        const filePath = path.resolve(distRoot, relativePath);

        if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${path.sep}`)) {
          response.writeHead(403);
          response.end("Forbidden");
          return;
        }

        fs.readFile(filePath, (error, content) => {
          if (error) {
            response.writeHead(error.code === "ENOENT" ? 404 : 500);
            response.end(error.code === "ENOENT" ? "Not Found" : "Internal Server Error");
            return;
          }

          response.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "Cache-Control": "no-cache",
          });
          response.end(content);
        });
      } catch {
        response.writeHead(400);
        response.end("Bad Request");
      }
    });

    staticServer.once("error", reject);
    staticServer.listen(0, "127.0.0.1", () => {
      const address = staticServer.address();
      resolve(`http://127.0.0.1:${address.port}/`);
    });
  });
}

async function createWindow() {
  const appUrl = await startStaticServer();
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1100,
    minHeight: 700,
    title: "KPI_BI业务管理平台",
    backgroundColor: "#f3f6fb",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  await mainWindow.loadURL(appUrl);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(createWindow).catch((error) => {
    console.error(error);
    app.quit();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  staticServer?.close();
});
