import React from "react";

const clampNumber = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export default function IslandHero({ days = 0, mcqProgress = 0, seqComplete = false, weakCount = 0, focusTrees = 0 }) {
  const progress = clampNumber(mcqProgress, 0, 100);
  const dangerZones = Math.round(clampNumber(weakCount, 0, 5));
  const visibleTrees = Math.max(3, Math.round(clampNumber(focusTrees, 0, 12)));
  const supplyFruit = Math.max(1, Math.ceil(progress / 20));
  const mcqLabel = `${Math.round(progress)}% MCQ supplies`;
  const seqLabel = seqComplete ? "clinic fire lit" : "clinic fire waiting";
  const weakLabel = dangerZones ? `${dangerZones} danger zones active` : "danger zones clear";
  const forestLabel = `${focusTrees} Study Forest trees grown`;

  const trees = Array.from({ length: visibleTrees }, (_, index) => index);
  const supplies = Array.from({ length: supplyFruit }, (_, index) => index);
  const dangers = Array.from({ length: dangerZones }, (_, index) => index);

  return (
    <figure className="island-hero-canvas-wrap" aria-label="KDU Finals Island dashboard scene">
      <div
        className="island-css-scene"
        aria-hidden="true"
        style={{ "--forest-trees": visibleTrees, "--mcq-progress": `${progress}%` }}
      >
        <span className={days <= 14 ? "sun urgent" : "sun"} />
        <span className="wave wave-one" />
        <span className="wave wave-two" />
        <span className="island" />
        <span className="clinic">
          <span className={seqComplete ? "campfire lit" : "campfire"} />
        </span>
        <span className="forest">
          {trees.map(index => (
            <span className="tree" key={index} style={{ "--tree-index": index }} />
          ))}
        </span>
        <span className="supplies">
          {supplies.map(index => (
            <span className="supply" key={index} style={{ "--supply-index": index }} />
          ))}
        </span>
        <span className="danger-zones">
          {dangers.map(index => (
            <span className="danger-zone" key={index} style={{ "--danger-index": index }} />
          ))}
        </span>
      </div>
      <figcaption className="sr-only">
        Decorative island status: final boss in {days} days, {mcqLabel}, {seqLabel}, {weakLabel}, and {forestLabel}.
      </figcaption>
      <div className="island-hero-fallback" aria-hidden="true">
        <span>{mcqLabel}</span>
        <span>{forestLabel}</span>
        <span>{weakLabel}</span>
      </div>
    </figure>
  );
}
