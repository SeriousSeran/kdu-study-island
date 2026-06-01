import { spawn } from "node:child_process";

const port = 4176;
const viteBin = process.env.KDU_STUDY_VITE_BIN || "../node_modules/vite/bin/vite.js";
const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", chunk => { output += chunk.toString(); });
child.stderr.on("data", chunk => { output += chunk.toString(); });

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return;
    } catch {
      // keep polling
    }
    await wait(250);
  }
  throw new Error(`Vite server did not start.\n${output}`);
}

async function assertOk(path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.text();
}

try {
  await waitForServer();
  const html = await assertOk("/");
  if (!html.includes("/src/main.jsx")) throw new Error("index did not include Vite module entry");
  for (const path of ["/questions.js", "/seqBank.js", "/ocrMcqBank.js", "/caseBank.js", "/ragIndex.js", "/manifest.json", "/sw.js"]) {
    await assertOk(path);
  }
  console.log("smoke-server ok");
} finally {
  child.kill();
}
