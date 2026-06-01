/**
 * Tests for src/graph/d3Model.js
 * Run: node --test tests/graphModel.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyGraphUpdates,
  createNode,
  createEdge,
  nodeId,
  toD3Format,
  NODE_TYPES,
  EDGE_TYPES,
} from "../src/graph/d3Model.js";

describe("nodeId", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    assert.equal(nodeId("Heart Failure"), "heart-failure");
  });
  it("strips leading/trailing hyphens", () => {
    assert.equal(nodeId(" SIADH "), "siadh");
  });
  it("handles null/undefined gracefully", () => {
    assert.equal(nodeId(null), "");
    assert.equal(nodeId(undefined), "");
  });
});

describe("createNode", () => {
  it("creates a node with correct id and defaults", () => {
    const n = createNode("Hypertension", NODE_TYPES.DISEASE);
    assert.equal(n.id, "hypertension");
    assert.equal(n.type, NODE_TYPES.DISEASE);
    assert.equal(n.weight, 1);
    assert.equal(n.label, "Hypertension");
  });
});

describe("createEdge", () => {
  it("creates a directed edge with stable id", () => {
    const e = createEdge("SIADH", "Hyponatraemia", EDGE_TYPES.CAUSES, 2);
    assert.equal(e.source, "siadh");
    assert.equal(e.target, "hyponatraemia");
    assert.equal(e.edge, EDGE_TYPES.CAUSES);
    assert.equal(e.weight, 2);
    assert.equal(e.id, "siadh->hyponatraemia:causes");
  });
});

describe("applyGraphUpdates", () => {
  it("creates new nodes for new source/target", () => {
    const updates = [{ source: "SIADH", target: "Hyponatraemia", edge: "causes", weight: 1 }];
    const result = applyGraphUpdates(updates, { nodes: [], links: [] });
    assert.equal(result.nodes.length, 2);
    assert.equal(result.links.length, 1);
    assert.equal(result.links[0].edge, "causes");
  });

  it("increments node weight on repeated updates", () => {
    const updates = [
      { source: "DKA", target: "Ketoacidosis", edge: "causes", weight: 1 },
      { source: "DKA", target: "Ketoacidosis", edge: "causes", weight: 1 },
    ];
    const result = applyGraphUpdates(updates, { nodes: [], links: [] });
    const dkaNode = result.nodes.find(n => n.id === "dka");
    assert.ok(dkaNode.weight >= 2, `Expected weight >= 2, got ${dkaNode.weight}`);
    assert.equal(result.links[0].weight, 2);
  });

  it("marks weak_in source as weakConcept node type", () => {
    const updates = [{ source: "Cushing", target: "Medicine", edge: EDGE_TYPES.WEAK_IN, weight: 1 }];
    const result = applyGraphUpdates(updates, { nodes: [], links: [] });
    const cushingNode = result.nodes.find(n => n.id === "cushing");
    assert.equal(cushingNode.type, NODE_TYPES.WEAK_CONCEPT);
  });

  it("marks confused_with source as weakConcept", () => {
    const updates = [{ source: "Conn", target: "SIADH", edge: EDGE_TYPES.CONFUSED_WITH, weight: 1 }];
    const result = applyGraphUpdates(updates, { nodes: [], links: [] });
    const connNode = result.nodes.find(n => n.id === "conn");
    assert.equal(connNode.type, NODE_TYPES.WEAK_CONCEPT);
  });

  it("does not mutate the input graph", () => {
    const current = { nodes: [{ id: "x", label: "X", type: "disease", weight: 1 }], links: [] };
    const original = JSON.stringify(current);
    applyGraphUpdates([{ source: "X", target: "Y", edge: "causes", weight: 1 }], current);
    assert.equal(JSON.stringify(current), original, "Input graph was mutated");
  });

  it("skips updates missing source or target", () => {
    const updates = [{ source: "", target: "Y", edge: "causes", weight: 1 }, { source: "X", target: "", edge: "causes", weight: 1 }];
    const result = applyGraphUpdates(updates, { nodes: [], links: [] });
    assert.equal(result.nodes.length, 0);
    assert.equal(result.links.length, 0);
  });
});

describe("toD3Format", () => {
  it("returns independent copies of nodes and links", () => {
    const graph = { nodes: [{ id: "a", label: "A", type: "disease", weight: 1 }], links: [] };
    const d3 = toD3Format(graph);
    d3.nodes[0].weight = 99;
    assert.equal(graph.nodes[0].weight, 1, "Original node was mutated");
  });
});
