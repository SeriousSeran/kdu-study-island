/**
 * D3-ready Graph Data Model
 *
 * Provides:
 *  - Node type constants
 *  - Edge type constants
 *  - createNode / createEdge factory helpers
 *  - applyGraphUpdates — merges AI graphUpdates[] into the working graph
 *  - toD3Format — converts the model into {nodes, links} for D3 force simulation
 *
 * This model lives alongside the Obsidian-style topic knowledgeGraph.js.
 * It enriches the graph with AI-generated edges
 * (confused_with, weak_in, treated_with, etc.) that the topic-co-occurrence
 * model in knowledgeGraph.js does not produce.
 *
 * Graph.jsx displays a D3-style force graph for the practised topic map.
 */

// ─── Node types ───────────────────────────────────────────────────────────────
export const NODE_TYPES = {
  DISEASE: "disease",
  SYMPTOM: "symptom",
  SIGN: "sign",
  INVESTIGATION: "investigation",
  MANAGEMENT: "management",
  DRUG: "drug",
  COMPLICATION: "complication",
  EMERGENCY: "emergency",
  LONG_CASE: "longCase",
  MCQ_TRAP: "mcqTrap",
  WEAK_CONCEPT: "weakConcept",
};

// ─── Edge types ───────────────────────────────────────────────────────────────
export const EDGE_TYPES = {
  PRESENTS_WITH: "presents_with",
  CAUSES: "causes",
  INVESTIGATED_BY: "investigated_by",
  TREATED_WITH: "treated_with",
  COMPLICATED_BY: "complicated_by",
  CONFUSED_WITH: "confused_with",
  APPEARS_IN: "appears_in",
  WEAK_IN: "weak_in",
  REVISE_WITH: "revise_with",
};

/**
 * Normalise a string into a stable graph node id.
 * @param {string} label
 * @returns {string}
 */
export function nodeId(label) {
  return String(label ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Create a new node object.
 * @param {string} label     Human-readable label.
 * @param {string} type      One of NODE_TYPES values.
 * @param {Object} [extra]   Any extra properties (subject, etc.)
 */
export function createNode(label, type = NODE_TYPES.WEAK_CONCEPT, extra = {}) {
  return {
    id: nodeId(label),
    label,
    type,
    weight: 1,
    ...extra,
  };
}

/**
 * Create a new edge object.
 * @param {string} source    Source node id (or label — will be normalised).
 * @param {string} target    Target node id (or label — will be normalised).
 * @param {string} edge      One of EDGE_TYPES values.
 * @param {number} [weight]  Edge weight (higher = more evidence).
 */
export function createEdge(source, target, edge = EDGE_TYPES.APPEARS_IN, weight = 1) {
  return {
    id: `${nodeId(source)}->${nodeId(target)}:${edge}`,
    source: nodeId(source),
    target: nodeId(target),
    edge,
    weight,
  };
}

/**
 * Apply AI-generated graphUpdates[] to the working graph state.
 *
 * Rules:
 *  - New nodes are created with weight=1.
 *  - Existing nodes have weight incremented (repeated mistakes increase prominence).
 *  - weak_in and confused_with edges mark the source node as type=weakConcept.
 *  - Edges accumulate weight on repeated updates.
 *
 * @param {Array<{source:string, target:string, edge:string, weight:number}>} updates  From AI response.
 * @param {{nodes: Object[], links: Object[]}} [current]   Existing D3 graph state.
 * @returns {{nodes: Object[], links: Object[]}}  Updated graph state (new object, no mutation).
 */
export function applyGraphUpdates(updates = [], current = { nodes: [], links: [] }) {
  const nodesMap = new Map(current.nodes.map(n => [n.id, { ...n }]));
  const linksMap = new Map(current.links.map(l => [l.id, { ...l }]));

  for (const u of updates) {
    if (!u.source || !u.target) continue;

    const srcId = nodeId(u.source);
    const tgtId = nodeId(u.target);
    const edge = u.edge ?? EDGE_TYPES.APPEARS_IN;
    const weight = Number(u.weight) || 1;

    // Upsert source node
    if (nodesMap.has(srcId)) {
      nodesMap.get(srcId).weight += weight;
    } else {
      const type =
        edge === EDGE_TYPES.WEAK_IN || edge === EDGE_TYPES.CONFUSED_WITH
          ? NODE_TYPES.WEAK_CONCEPT
          : NODE_TYPES.DISEASE;
      nodesMap.set(srcId, createNode(u.source, type));
    }

    // Upsert target node
    if (nodesMap.has(tgtId)) {
      nodesMap.get(tgtId).weight += weight;
    } else {
      nodesMap.set(tgtId, createNode(u.target, NODE_TYPES.DISEASE));
    }

    // Mark weak concepts
    if (edge === EDGE_TYPES.WEAK_IN || edge === EDGE_TYPES.CONFUSED_WITH) {
      nodesMap.get(srcId).type = NODE_TYPES.WEAK_CONCEPT;
    }

    // Upsert edge
    const edgeId = `${srcId}->${tgtId}:${edge}`;
    if (linksMap.has(edgeId)) {
      linksMap.get(edgeId).weight += weight;
    } else {
      linksMap.set(edgeId, createEdge(u.source, u.target, edge, weight));
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links: Array.from(linksMap.values()),
  };
}

/**
 * Convert the D3 graph model to the format expected by a D3 force simulation.
 * Node ids are strings; link source/target reference node ids.
 * @param {{nodes:Object[], links:Object[]}} graph
 * @returns {{nodes:Object[], links:Object[]}}
 */
export function toD3Format(graph) {
  if (!graph) return { nodes: [], links: [] };
  return {
    nodes: graph.nodes.map(n => ({ ...n })),
    links: graph.links.map(l => ({
      ...l,
      // D3 expects source/target as id strings (or node references after simulation binds them)
      source: l.source,
      target: l.target,
    })),
  };
}
