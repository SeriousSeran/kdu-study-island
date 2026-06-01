import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("package exposes portable production scripts and local fallback scripts", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts.build, "vite build");
  assert.match(pkg.scripts["build:local"], /node \.\.\/node_modules\/vite\/bin\/vite\.js build/);
  assert.ok(pkg.dependencies.react);
  assert.ok(pkg.dependencies["@vitejs/plugin-basic-ssl"]);
});

test("PWA manifest and service worker cache core offline banks", () => {
  const manifest = JSON.parse(fs.readFileSync("public/manifest.json", "utf8"));
  const sw = fs.readFileSync("public/sw.js", "utf8");
  assert.equal(manifest.name, "KDU Finals Island");
  assert.equal(manifest.short_name, "Finals Island");
  assert.match(manifest.description, /island survival study dashboard/);
  assert.match(sw, /req\.mode === "navigate"/);
  for (const file of ["/questions.js", "/seqBank.js", "/ocrMcqBank.js", "/caseBank.js", "/ragIndex.js"]) {
    assert.match(sw, new RegExp(file.replace(".", "\\.")));
  }
});

test("Cloudflare sync payload uses Worker data field", () => {
  const app = fs.readFileSync("src/App.jsx", "utf8");
  assert.match(app, /JSON\.stringify\(\{ key, data: buildSaveBlob\(merged\) \}\)/);
  assert.doesNotMatch(app, /blob: buildSaveBlob\(merged\)/);
});

test("root app has a screen-level recovery boundary", () => {
  const app = fs.readFileSync("src/App.jsx", "utf8");
  const boundary = fs.readFileSync("src/ErrorBoundary.jsx", "utf8");
  assert.match(app, /<ErrorBoundary resetKey=\{tab\}>/);
  assert.match(boundary, /getDerivedStateFromError/);
  assert.match(boundary, /Your saved progress is still kept in IndexedDB/);
});
