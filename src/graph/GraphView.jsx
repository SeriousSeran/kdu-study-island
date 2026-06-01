import React from "react";

const MAX_NODES = 90;
const MAX_EDGES = 360;
const WIDTH = 960;
const HEIGHT = 560;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2.8;

const SUBJECT_COLOR = {
  Medicine: "#60a5fa",
  Surgery: "#c084fc",
  Paediatrics: "#34d399",
  "O&G": "#f472b6",
  Psychiatry: "#fbbf24",
};

function nodeRadius(node) {
  return Math.min(24, 7 + Math.sqrt(node.weight || 1) * 3.4);
}

function stableNumber(id, salt = 0) {
  let hash = 2166136261 + salt;
  for (const char of String(id)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function relationKey(link) {
  const source = typeof link.source === "object" ? link.source.id : link.source;
  const target = typeof link.target === "object" ? link.target.id : link.target;
  return `${source}__${target}`;
}

// Topic network → D3-style force nodes and links. Nodes are the highest-weight
// topics from what you've practised; edges link topics that co-occur in the same
// question/case, like an Obsidian local graph.
function toForceGraph(graph) {
  const topics = (graph?.nodes || [])
    .filter(n => n.type === "topic")
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, MAX_NODES);
  const ids = new Set(topics.map(n => n.id));
  const links = (graph?.links || [])
    .filter(l => l.type === "co" && ids.has(String(l.source)) && ids.has(String(l.target)))
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, MAX_EDGES)
    .map(l => ({
      id: relationKey(l),
      source: String(l.source),
      target: String(l.target),
      weight: l.weight || 1,
    }));

  const nodeList = topics.map((n, index) => {
    const angle = stableNumber(n.id) * Math.PI * 2;
    const ring = 120 + (index % 9) * 18;
    return {
      id: n.id,
      label: n.label,
      subject: n.subject,
      weight: n.weight || 1,
      color: SUBJECT_COLOR[n.subject] || "#60a5fa",
      radius: nodeRadius(n),
      x: WIDTH / 2 + Math.cos(angle) * ring,
      y: HEIGHT / 2 + Math.sin(angle) * ring,
      vx: 0,
      vy: 0,
    };
  });

  return { nodes: layoutForceGraph(nodeList, links), links };
}

function layoutForceGraph(seedNodes, links) {
  const nodes = seedNodes.map(n => ({ ...n }));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const boundLinks = links
    .map(link => ({ ...link, sourceNode: byId.get(link.source), targetNode: byId.get(link.target) }))
    .filter(link => link.sourceNode && link.targetNode);

  // A compact, deterministic force simulation: link springs + many-body charge +
  // centering + collision. This keeps the bundle small while giving the same
  // Obsidian/D3 force-directed feel users expect.
  for (let tick = 0; tick < 280; tick += 1) {
    const alpha = 1 - tick / 280;

    for (const link of boundLinks) {
      const source = link.sourceNode;
      const target = link.targetNode;
      const dx = target.x - source.x || 0.001;
      const dy = target.y - source.y || 0.001;
      const distance = Math.hypot(dx, dy) || 1;
      const ideal = 86 - Math.min(34, link.weight * 5);
      const pull = (distance - ideal) / distance * 0.018 * alpha;
      const fx = dx * pull;
      const fy = dy * pull;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const dx = b.x - a.x || stableNumber(`${a.id}${b.id}`, 1) - 0.5 || 0.001;
        const dy = b.y - a.y || stableNumber(`${b.id}${a.id}`, 2) - 0.5 || 0.001;
        const distanceSq = Math.max(56, dx * dx + dy * dy);
        const distance = Math.sqrt(distanceSq);
        const charge = ((a.radius + b.radius) * 66) / distanceSq * alpha;
        const fx = dx / distance * charge;
        const fy = dy / distance * charge;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;

        const minDistance = a.radius + b.radius + 14;
        if (distance < minDistance) {
          const push = (minDistance - distance) / distance * 0.06 * alpha;
          a.vx -= dx * push;
          a.vy -= dy * push;
          b.vx += dx * push;
          b.vy += dy * push;
        }
      }
    }

    for (const node of nodes) {
      node.vx += (WIDTH / 2 - node.x) * 0.004 * alpha;
      node.vy += (HEIGHT / 2 - node.y) * 0.004 * alpha;
      node.vx *= 0.78;
      node.vy *= 0.78;
      node.x = Math.min(WIDTH - 48, Math.max(48, node.x + node.vx));
      node.y = Math.min(HEIGHT - 48, Math.max(48, node.y + node.vy));
    }
  }

  return nodes;
}

function screenToSvgPoint(event, transform) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - transform.x) / transform.k,
    y: (event.clientY - rect.top - transform.y) / transform.k,
  };
}

export default function GraphView({ graph, selectedTopic, onSelectTopic }) {
  const svgRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [{ x, y, k }, setTransform] = React.useState({ x: 0, y: 0, k: 1 });
  const [manualNodes, setManualNodes] = React.useState(null);
  const forceGraph = React.useMemo(() => toForceGraph(graph), [graph]);
  const nodes = manualNodes || forceGraph.nodes;
  const nodeMap = React.useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const linkedToMatch = React.useMemo(() => {
    const q = (selectedTopic || "").trim().toLowerCase();
    if (!q) return { matches: new Set(), neighbors: new Set() };
    const matches = new Set(nodes.filter(n => n.label.toLowerCase().includes(q)).map(n => n.id));
    const neighbors = new Set(matches);
    for (const link of forceGraph.links) {
      if (matches.has(link.source)) neighbors.add(link.target);
      if (matches.has(link.target)) neighbors.add(link.source);
    }
    return { matches, neighbors };
  }, [forceGraph.links, nodes, selectedTopic]);

  React.useEffect(() => { setManualNodes(null); }, [forceGraph]);

  const handleWheel = event => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? 0.9 : 1.1;
    const nextK = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k * direction));
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    setTransform({
      k: nextK,
      x: px - (px - x) * (nextK / k),
      y: py - (py - y) * (nextK / k),
    });
  };

  const handlePointerDown = event => {
    if (event.button !== 0) return;
    const nodeId = event.target.closest?.("[data-node-id]")?.dataset.nodeId;
    const point = screenToSvgPoint(event, { x, y, k });
    dragRef.current = nodeId
      ? { type: "node", nodeId, offsetX: point.x - nodeMap.get(nodeId).x, offsetY: point.y - nodeMap.get(nodeId).y }
      : { type: "pan", startX: event.clientX, startY: event.clientY, x, y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = event => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.type === "pan") {
      setTransform(prev => ({ ...prev, x: drag.x + event.clientX - drag.startX, y: drag.y + event.clientY - drag.startY }));
      return;
    }
    const point = screenToSvgPoint(event, { x, y, k });
    setManualNodes(current => (current || forceGraph.nodes).map(node => (
      node.id === drag.nodeId ? { ...node, x: point.x - drag.offsetX, y: point.y - drag.offsetY } : node
    )));
  };

  const handlePointerUp = event => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const resetView = () => setTransform({ x: 0, y: 0, k: 1 });

  if (!nodes.length) {
    return (
      <div className="graph-empty">
        <p><b>Your map is empty.</b><br />Answer some MCQs or take notes — topics and their links appear here as you practise.</p>
      </div>
    );
  }

  return (
    <div className="graph-shell">
      <div className="graph-hud" aria-hidden="true">
        <span>{nodes.length} nodes</span>
        <span>{forceGraph.links.length} links</span>
        <button type="button" onClick={resetView}>Reset</button>
      </div>
      <svg
        ref={svgRef}
        className="graph-canvas graph-svg"
        role="img"
        aria-label="Obsidian-style D3 knowledge graph of connected study topics"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          <radialGradient id="graphGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        <g transform={`translate(${x} ${y}) scale(${k})`}>
          <g className="graph-links">
            {forceGraph.links.map(link => {
              const source = nodeMap.get(link.source);
              const target = nodeMap.get(link.target);
              if (!source || !target) return null;
              const dim = linkedToMatch.neighbors.size && (!linkedToMatch.neighbors.has(source.id) || !linkedToMatch.neighbors.has(target.id));
              return (
                <line
                  key={link.id}
                  className={dim ? "graph-link dim" : "graph-link"}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  strokeWidth={Math.min(4.5, 0.8 + link.weight * 0.35)}
                />
              );
            })}
          </g>
          <g className="graph-nodes">
            {nodes.map(node => {
              const selected = linkedToMatch.matches.has(node.id);
              const dim = linkedToMatch.neighbors.size && !linkedToMatch.neighbors.has(node.id);
              return (
                <g
                  key={node.id}
                  className={`graph-node${selected ? " selected" : ""}${dim ? " dim" : ""}`}
                  transform={`translate(${node.x} ${node.y})`}
                  data-node-id={node.id}
                  onClick={() => onSelectTopic?.(node.label)}
                >
                  <circle className="graph-node-halo" r={node.radius + 8} fill={node.color} />
                  <circle className="graph-node-core" r={node.radius} fill={node.color} />
                  <circle className="graph-node-hit" r={Math.max(24, node.radius + 10)} />
                  <text y={node.radius + 17}>{node.label}</text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <p className="graph-tip">Scroll to zoom, drag the canvas to pan, drag nodes to tidy clusters.</p>
    </div>
  );
}
