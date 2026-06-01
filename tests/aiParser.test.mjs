/**
 * Tests for src/ai/parseResponse.js
 * Run: node --test tests/aiParser.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAiResponse } from "../src/ai/parseResponse.js";

const VALID_JSON = JSON.stringify({
  verdict: "Good attempt",
  mistakePattern: "Confused SIADH with Conn",
  mechanism: "ADH causes water retention",
  mustKnow: ["SIADH → low Na+, low osmol"],
  missedPoints: ["Forgot pseudohyponatraemia"],
  examTraps: ["Serum Na+ can be falsely low with hyperlipidaemia"],
  memoryHook: "SIADH = Sodium Is Always Damn High (NO — it is LOW)",
  linkedTopics: ["hyponatraemia", "ADH"],
  nextVivaQuestion: "What is the emergency treatment of severe symptomatic hyponatraemia?",
  flashcards: [{ front: "SIADH definition", back: "Inappropriately concentrated urine with diluted plasma" }],
  graphUpdates: [{ source: "SIADH", target: "hyponatraemia", edge: "causes", weight: 2 }],
  toolCallsSuggested: [{ tool: "create_d3_graph", reason: "show pathway", query: "SIADH pathway" }],
});

describe("parseAiResponse — valid JSON", () => {
  it("returns {ok:true, json} for a complete valid response", () => {
    const result = parseAiResponse(VALID_JSON);
    assert.equal(result.ok, true);
    assert.ok(result.json, "Missing json field");
    assert.equal(result.json.verdict, "Good attempt");
  });

  it("coerces string mustKnow to array", () => {
    const broken = JSON.stringify({ ...JSON.parse(VALID_JSON), mustKnow: "Single string" });
    const result = parseAiResponse(broken);
    assert.equal(result.ok, true);
    assert.ok(Array.isArray(result.json.mustKnow), "mustKnow should be array");
  });

  it("handles JSON wrapped in markdown code fences", () => {
    const fenced = `\`\`\`json\n${VALID_JSON}\n\`\`\``;
    const result = parseAiResponse(fenced);
    assert.equal(result.ok, true);
    assert.equal(result.json.verdict, "Good attempt");
  });

  it("coerces graphUpdates entries to correct shape", () => {
    const result = parseAiResponse(VALID_JSON);
    const update = result.json.graphUpdates[0];
    assert.equal(update.source, "SIADH");
    assert.equal(update.target, "hyponatraemia");
    assert.equal(update.edge, "causes");
    assert.equal(update.weight, 2);
  });

  it("handles empty arrays gracefully", () => {
    const minimal = JSON.stringify({
      verdict: "ok", mistakePattern: "", mechanism: "", mustKnow: [], missedPoints: [],
      examTraps: [], memoryHook: "", linkedTopics: [], graphUpdates: [], flashcards: [], toolCallsSuggested: [],
    });
    const result = parseAiResponse(minimal);
    assert.equal(result.ok, true);
    assert.deepEqual(result.json.flashcards, []);
  });
});

describe("parseAiResponse — plain text fallback", () => {
  it("returns {ok:false, plain} for non-JSON text", () => {
    const result = parseAiResponse("Good try but you missed the mechanism of SIADH.");
    assert.equal(result.ok, false);
    assert.ok(result.plain.includes("SIADH"), "plain text not preserved");
  });

  it("returns {ok:false} for partial JSON", () => {
    const result = parseAiResponse('{"verdict": "ok", "mustKnow":');
    assert.equal(result.ok, false);
  });

  it("returns {ok:false} for JSON missing required keys", () => {
    const result = parseAiResponse('{"verdict": "ok"}');
    assert.equal(result.ok, false);
  });

  it("returns {ok:false, plain:''} for null/undefined input", () => {
    assert.equal(parseAiResponse(null).ok, false);
    assert.equal(parseAiResponse(undefined).ok, false);
    assert.equal(parseAiResponse("").ok, false);
  });
});
