// Renders intro.html to an MP4, frame by frame, with headless Chrome (exact timing, no dropped frames).
// Usage:
//   node video/intro/render.mjs                 → video/out/leash-intro.mp4 (1920x1080, 30 fps)
//   node video/intro/render.mjs --stills 1,5,11 → PNG stills at those seconds, for review
// Needs Google Chrome and ffmpeg (set FFMPEG=/path/to/ffmpeg if it isn't on PATH).
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../out");
const FPS = Number(process.env.FPS ?? 30);
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const stillsArg = process.argv.indexOf("--stills");
const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(",").map(Number) : null;

fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "leash-intro-"));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1920,1080",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  if (msg.method === "Runtime.exceptionThrown") console.error("page error:", msg.params.exceptionDetails?.exception?.description);
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const js = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `${pathToFileURL(path.join(here, "intro.html"))}?render` });
for (let i = 0; i < 100 && !(await js("typeof window.__render === 'function'")); i++) await sleep(100);
await js("window.__ready");
await sleep(300);
const duration = await js("window.__duration");

const shot = async (t, file, format = "png") => {
  await js(`window.__render(${t}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
  const r = await send("Page.captureScreenshot", { format, ...(format === "jpeg" ? { quality: 95 } : {}) });
  fs.writeFileSync(file, Buffer.from(r.result.data, "base64"));
};

if (stills) {
  for (const t of stills) await shot(t, path.join(OUT, `still-${t.toFixed(1).padStart(4, "0")}s.png`));
  console.log(`saved ${stills.length} stills to ${OUT}`);
} else {
  const frames = fs.mkdtempSync(path.join(os.tmpdir(), "leash-frames-"));
  const total = Math.round(duration * FPS);
  for (let f = 0; f < total; f++) {
    await shot(f / FPS, path.join(frames, `f${String(f).padStart(5, "0")}.jpg`), "jpeg");
    if (f % FPS === 0) process.stdout.write(`\rrendering ${Math.round((f / total) * 100)}%`);
  }
  const mp4 = path.join(OUT, "leash-intro.mp4");
  const ff = spawnSync(
    FFMPEG,
    [
      "-y",
      "-loglevel",
      "error",
      "-framerate",
      String(FPS),
      "-i",
      path.join(frames, "f%05d.jpg"),
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      mp4,
    ],
    { stdio: "inherit" },
  );
  fs.rmSync(frames, { recursive: true, force: true });
  if (ff.status !== 0) throw new Error("ffmpeg failed");
  console.log(`\rsaved ${mp4} (${total} frames, ${duration}s)`);
}
ws.close();
chrome.kill();
await new Promise((r) => chrome.once("exit", r));
fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
