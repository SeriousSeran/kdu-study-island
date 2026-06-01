import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("production docs and deployment config exist", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const env = fs.readFileSync(".env.example", "utf8");
  const netlify = fs.readFileSync("netlify.toml", "utf8");
  const ci = fs.readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(readme, /Progress Compatibility/);
  assert.match(readme, /npm run build/);
  assert.match(env, /MOONSHOT_API_KEY=/);
  assert.match(env, /GROQ_API_KEY=/);
  assert.match(netlify, /publish = "dist"/);
  assert.match(ci, /npm test/);
  assert.match(ci, /npm run build/);
});
