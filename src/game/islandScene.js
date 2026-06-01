const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 220;

const clampNumber = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export function createIslandScene(k, { days = 0, mcqProgress = 0, seqComplete = false, weakCount = 0, focusTrees = 0 } = {}) {
  const progress = clampNumber(mcqProgress, 0, 100);
  const dangerZones = Math.round(clampNumber(weakCount, 0, 5));
  const grownTrees = Math.round(clampNumber(focusTrees, 0, 12));
  const supplyFruit = Math.max(1, Math.ceil(progress / 20));
  const examUrgency = days <= 14 ? [255, 176, 91] : [113, 211, 255];

  drawOcean(k, examUrgency);
  drawIslandBase(k);
  drawStudyForest(k, grownTrees);
  drawCampfire(k, seqComplete);
  drawDangerMarkers(k, dangerZones);
  drawMcqSupplies(k, supplyFruit, progress);
  drawSoftMotion(k);

  return () => {
    k.destroyAll?.();
  };
}

function drawOcean(k, examUrgency) {
  k.add([
    k.rect(SCENE_WIDTH, SCENE_HEIGHT),
    k.pos(0, 0),
    k.color(18, 103, 169),
    k.z(-10),
  ]);

  k.add([
    k.circle(34),
    k.pos(268, 42),
    k.color(...examUrgency),
    k.opacity(0.88),
    k.anchor("center"),
    k.z(-8),
  ]);

  [32, 92, 154, 224].forEach((x, index) => {
    k.add([
      k.rect(46, 5, { radius: 3 }),
      k.pos(x, 52 + index * 30),
      k.color(154, 222, 236),
      k.opacity(0.42),
      k.z(-7),
    ]);
  });
}

function drawIslandBase(k) {
  k.add([
    k.rect(184, 78, { radius: 38 }),
    k.pos(160, 150),
    k.color(244, 199, 123),
    k.anchor("center"),
    k.z(0),
  ]);

  k.add([
    k.rect(132, 52, { radius: 26 }),
    k.pos(156, 140),
    k.color(68, 167, 99),
    k.anchor("center"),
    k.z(1),
  ]);

  k.add([
    k.rect(48, 24, { radius: 6 }),
    k.pos(188, 128),
    k.color(164, 111, 62),
    k.anchor("center"),
    k.z(2),
  ]);

  k.add([
    k.polygon([k.vec2(0, -20), k.vec2(34, 0), k.vec2(-34, 0)]),
    k.pos(188, 118),
    k.color(254, 226, 154),
    k.anchor("center"),
    k.z(3),
  ]);
}

function drawStudyForest(k, treeCount) {
  const treeSlots = [
    [92, 126], [112, 112], [132, 124], [102, 142], [138, 144], [152, 118],
    [78, 144], [124, 102], [158, 136], [88, 112], [146, 102], [116, 150],
  ];

  treeSlots.slice(0, treeCount || 3).forEach(([x, y], index) => {
    const isEarned = index < treeCount;
    drawTree(k, x, y, isEarned ? 1 : 0.7, isEarned ? [35, 132, 69] : [95, 160, 103]);
  });
}

function drawTree(k, x, y, scale, leafColor) {
  k.add([
    k.rect(5 * scale, 16 * scale, { radius: 2 }),
    k.pos(x, y + 9),
    k.color(116, 77, 42),
    k.anchor("center"),
    k.z(4),
  ]);

  k.add([
    k.circle(13 * scale),
    k.pos(x, y - 2),
    k.color(...leafColor),
    k.anchor("center"),
    k.z(5),
  ]);
}

function drawCampfire(k, isLit) {
  k.add([
    k.rect(26, 8, { radius: 4 }),
    k.pos(204, 150),
    k.rotate(-12),
    k.color(101, 67, 33),
    k.anchor("center"),
    k.z(5),
  ]);

  k.add([
    k.rect(26, 8, { radius: 4 }),
    k.pos(204, 150),
    k.rotate(12),
    k.color(101, 67, 33),
    k.anchor("center"),
    k.z(5),
  ]);

  k.add([
    k.polygon([k.vec2(0, -20), k.vec2(12, 8), k.vec2(-12, 8)]),
    k.pos(204, 137),
    k.color(...(isLit ? [249, 115, 22] : [148, 163, 184])),
    k.anchor("center"),
    k.z(6),
  ]);

  k.add([
    k.polygon([k.vec2(0, -13), k.vec2(7, 6), k.vec2(-7, 6)]),
    k.pos(204, 139),
    k.color(...(isLit ? [254, 240, 138] : [203, 213, 225])),
    k.anchor("center"),
    k.z(7),
  ]);
}

function drawDangerMarkers(k, dangerCount) {
  Array.from({ length: dangerCount }).forEach((_, index) => {
    const x = 52 + index * 16;
    const y = 76 + (index % 2) * 12;
    k.add([
      k.polygon([k.vec2(0, -9), k.vec2(9, 8), k.vec2(-9, 8)]),
      k.pos(x, y),
      k.color(248, 113, 113),
      k.anchor("center"),
      k.z(8),
    ]);
    k.add([
      k.rect(3, 8, { radius: 1 }),
      k.pos(x, y + 1),
      k.color(127, 29, 29),
      k.anchor("center"),
      k.z(9),
    ]);
  });
}

function drawMcqSupplies(k, fruitCount, progress) {
  const filled = Math.ceil((progress / 100) * fruitCount);

  Array.from({ length: fruitCount }).forEach((_, index) => {
    const x = 226 + index * 13;
    const y = 164 - (index % 2) * 8;
    const earned = index < filled;
    k.add([
      k.circle(6),
      k.pos(x, y),
      k.color(...(earned ? [251, 146, 60] : [254, 215, 170])),
      k.outline(2, k.rgb(154, 85, 29)),
      k.anchor("center"),
      k.z(8),
    ]);
  });
}

function drawSoftMotion(k) {
  k.onUpdate(() => {
    const bob = Math.sin(k.time() * 1.4) * 1.6;
    k.get("floating-marker").forEach((marker) => {
      marker.pos.y = marker.baseY + bob;
    });
  });

  k.add([
    k.circle(6),
    k.pos(160, 86),
    k.color(255, 255, 255),
    k.opacity(0.55),
    k.anchor("center"),
    k.z(10),
    "floating-marker",
    { baseY: 86 },
  ]);
}
