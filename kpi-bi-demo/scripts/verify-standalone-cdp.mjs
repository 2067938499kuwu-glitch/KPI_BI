const port = process.argv[2] || "9335";
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((candidate) => candidate.type === "page" && candidate.url.startsWith("file:"));

if (!target) throw new Error("No standalone file page was found.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

let requestId = 0;
const evaluate = (expression) => new Promise((resolve, reject) => {
  const id = ++requestId;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== id) return;
    if (message.result?.exceptionDetails) {
      reject(new Error(message.result.exceptionDetails.text));
      return;
    }
    resolve(message.result?.result?.value);
  };
  socket.onerror = reject;
  socket.send(JSON.stringify({
    id,
    method: "Runtime.evaluate",
    params: { expression, returnByValue: true, awaitPromise: true },
  }));
});

await new Promise((resolve) => setTimeout(resolve, 800));
const title = await evaluate("document.title");
const rootChildren = await evaluate("document.querySelector('#root')?.children.length || 0");
const mainText = await evaluate("document.body.innerText.slice(0, 180)");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.includes('组织架构与花名册'))?.click(); true");
await new Promise((resolve) => setTimeout(resolve, 1000));
const frameCount = await evaluate("document.querySelectorAll('iframe').length");
const frameSrcdocLength = await evaluate("document.querySelector('iframe')?.srcdoc.length || 0");
const frameText = await evaluate("document.querySelector('iframe')?.contentDocument?.body?.innerText.slice(0, 120) || ''");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.includes('表格管理'))?.click(); true");
await new Promise((resolve) => setTimeout(resolve, 500));
const tablesText = await evaluate("document.querySelector('iframe')?.contentDocument?.body?.innerText.slice(0, 120) || ''");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.includes('模板管理'))?.click(); true");
await new Promise((resolve) => setTimeout(resolve, 500));
const templatesText = await evaluate("document.querySelector('iframe')?.contentDocument?.body?.innerText.slice(0, 120) || ''");
await evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === '周报')?.click(); true");
await new Promise((resolve) => setTimeout(resolve, 1000));
const weeklySrcdocLength = await evaluate("document.querySelector('iframe')?.srcdoc.length || 0");
const weeklyText = await evaluate("document.querySelector('iframe')?.contentDocument?.body?.innerText.slice(0, 120) || ''");

socket.close();
console.log(JSON.stringify({
  title,
  rootChildren,
  mainText,
  frameCount,
  frameSrcdocLength,
  frameText,
  tablesText,
  templatesText,
  weeklySrcdocLength,
  weeklyText,
}, null, 2));

if (
  !rootChildren
  || !mainText.includes("KPI_BI")
  || !frameCount
  || !frameSrcdocLength
  || !frameText.includes("组织架构与花名册")
  || !tablesText.includes("表格管理")
  || !templatesText.includes("模板管理")
  || !weeklySrcdocLength
  || !weeklyText.includes("周报")
) {
  process.exitCode = 1;
}
