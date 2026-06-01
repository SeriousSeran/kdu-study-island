import React, { useEffect, useRef } from "react";
import { createIslandScene } from "../game/islandScene.js";

export default function IslandHero({ days = 0, mcqProgress = 0, seqComplete = false, weakCount = 0, focusTrees = 0 }) {
  const canvasRef = useRef(null);
  const mcqLabel = `${Math.round(mcqProgress)}% MCQ supplies`;
  const seqLabel = seqComplete ? "clinic fire lit" : "clinic fire waiting";
  const weakLabel = weakCount ? `${weakCount} danger zones active` : "danger zones clear";
  const forestLabel = `${focusTrees} Study Forest trees grown`;

  useEffect(() => {
    let disposed = false;
    let kaplayContext;
    let cleanupScene;
    const canvas = canvasRef.current;

    if (!canvas) return undefined;

    canvas.width = 320;
    canvas.height = 220;

    import("kaplay").then(({ default: kaplay }) => {
      if (disposed) return;

      kaplayContext = kaplay({
        width: 320,
        height: 220,
        canvas,
        global: false,
        background: [18, 103, 169],
        crisp: true,
        debug: false,
      });

      cleanupScene = createIslandScene(kaplayContext, {
        days,
        mcqProgress,
        seqComplete,
        weakCount,
        focusTrees,
      });
    });

    return () => {
      disposed = true;
      cleanupScene?.();
      kaplayContext?.quit?.();
    };
  }, [days, mcqProgress, seqComplete, weakCount, focusTrees]);

  return (
    <figure className="island-hero-canvas-wrap" aria-label="KDU Finals Island dashboard scene">
      <canvas ref={canvasRef} className="island-hero-canvas" aria-hidden="true" />
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
