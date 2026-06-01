import React from "react";

export default function IslandHero() {
  return (
    <div className="island-hero-canvas-wrap" aria-label="KDU Finals Island dashboard scene">
      <div className="island-css-scene" aria-hidden="true">
        <span className="sun" />
        <span className="island" />
        <span className="forest" />
        <span className="clinic" />
        <span className="danger-zone" />
      </div>
    </div>
  );
}
