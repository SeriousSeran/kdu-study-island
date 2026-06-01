import React from "react";

const ICON_PATHS = {
  sunrise: (
    <>
      <path d="M5 16.5h14" />
      <path d="M8 16.5a4 4 0 0 1 8 0" />
      <path d="M12 4.5v2" />
      <path d="m5.8 7.8 1.4 1.4" />
      <path d="m18.2 7.8-1.4 1.4" />
      <path d="M4 20h16" />
      <path d="M7 12.5h1" />
      <path d="M16 12.5h1" />
    </>
  ),
  papers: (
    <>
      <path d="M7 4.5h8l2 2v13H7z" />
      <path d="M15 4.5v3h3" />
      <path d="M9.5 10.5h5" />
      <path d="M9.5 13.5h5" />
      <path d="M9.5 16.5h3" />
      <path d="M5 7.5v13h10" />
    </>
  ),
  cases: (
    <>
      <path d="M8 8.5h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z" />
      <path d="M10 8.5v-2h4v2" />
      <path d="M12 11v4" />
      <path d="M10 13h4" />
      <path d="M5 17.5h14" />
    </>
  ),
  atlas: (
    <>
      <path d="M5 6.5 10 4l4 2.5 5-2v13l-5 2-4-2.5-5 2.5z" />
      <path d="M10 4v13" />
      <path d="M14 6.5v13" />
      <path d="M7.5 11.5h.01" />
      <path d="M16.5 10h.01" />
      <path d="M11.5 14h.01" />
    </>
  ),
  forest: (
    <>
      <path d="M12 19.5v-5" />
      <path d="M8.5 20h7" />
      <path d="M8.5 14.5a3.5 3.5 0 0 1 7 0" />
      <path d="M6.5 15.5a3 3 0 0 1 4.2-2.8" />
      <path d="M13.3 12.7a3 3 0 0 1 4.2 2.8" />
      <path d="M9 9.5a3 3 0 0 1 6 0" />
    </>
  ),
  graph: (
    <>
      <path d="M7 15.5 12 9l5 6.5" />
      <path d="M7 15.5h10" />
      <circle cx="7" cy="15.5" r="2" />
      <circle cx="12" cy="9" r="2" />
      <circle cx="17" cy="15.5" r="2" />
      <path d="M12 11v7" />
    </>
  ),
  review: (
    <>
      <path d="M7 8.5a5 5 0 0 1 8.8-2.9L18 8" />
      <path d="M18 4.5V8h-3.5" />
      <path d="M17 15.5a5 5 0 0 1-8.8 2.9L6 16" />
      <path d="M6 19.5V16h3.5" />
      <path d="M12 9.5v3l2 1" />
    </>
  ),
  sync: (
    <>
      <path d="M7 15.5h9.5a2.8 2.8 0 0 0 .6-5.5 4.8 4.8 0 0 0-9.2-1.3A3.5 3.5 0 0 0 7 15.5Z" />
      <path d="M12 12v7" />
      <path d="m9.5 16.5 2.5 2.5 2.5-2.5" />
    </>
  ),
};

export function IslandNavIcon({ name }) {
  return (
    <svg className="bottom-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {ICON_PATHS[name] || ICON_PATHS.sunrise}
      </g>
    </svg>
  );
}
