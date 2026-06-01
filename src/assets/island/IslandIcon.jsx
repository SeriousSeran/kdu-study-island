import React from "react";

const ICON_TITLES = {
  mcqSupplies: "MCQ fruit supplies",
  seqScroll: "SEQ scroll",
  clinicCase: "Clinic case bag",
  dangerMarker: "Weak concept danger marker",
  atlasMap: "Clinical atlas map",
  srsHourglass: "SRS hourglass",
  studyTree: "Study Forest tree",
  syncBoat: "Sync boat and crate",
  campfire: "Campfire streak",
  papers: "Written papers",
  graph: "Knowledge graph",
};

function IslandSvg({ children, title, className = "", ...props }) {
  const titleId = React.useId();
  const ariaProps = title
    ? { role: "img", "aria-labelledby": titleId }
    : { "aria-hidden": "true" };

  return (
    <svg
      className={`island-icon ${className}`.trim()}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      {...ariaProps}
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {children}
    </svg>
  );
}

const iconPaths = {
  mcqSupplies: (
    <>
      <path d="M9 35h30l-3 6H12l-3-6Z" fill="#9A5A2A" />
      <path d="M14 27c0-5 4-9 9-9h4c5 0 9 4 9 9v8H14v-8Z" fill="#E7B35D" />
      <path d="M18 24c-2.8-3.2-1.2-8 3-9 1.7 3.1.4 6.9-3 9Z" fill="#23A36B" />
      <circle cx="18" cy="29" r="4" fill="#FF7A59" />
      <circle cx="26" cy="27" r="4" fill="#FFB347" />
      <circle cx="31" cy="32" r="4" fill="#47B881" />
      <path d="M13 35h24" stroke="#6B3F22" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 12c3 0 5 2 6 5" stroke="#704214" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  seqScroll: (
    <>
      <path d="M14 10h22v28H14c-3 0-5-2-5-5V15c0-3 2-5 5-5Z" fill="#F7E2B4" />
      <path d="M14 10c3 0 5 2 5 5s-2 5-5 5H9v-5c0-3 2-5 5-5Z" fill="#D9A85C" />
      <path d="M14 38c-3 0-5-2-5-5s2-5 5-5h22v10H14Z" fill="#E9C77C" />
      <path d="M22 18h9M22 24h10M22 30h7" stroke="#7A4A22" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 10v28" stroke="#A66A2C" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  clinicCase: (
    <>
      <path d="M13 18h22c3 0 5 2 5 5v14H8V23c0-3 2-5 5-5Z" fill="#C8793A" />
      <path d="M17 18v-3c0-2 2-4 4-4h6c2 0 4 2 4 4v3" stroke="#704214" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 25h32" stroke="#8B5128" strokeWidth="3" />
      <path d="M21 27h6v-6h4v6h6v4h-6v6h-4v-6h-6v-4Z" fill="#F7F3E8" />
      <path d="M10 37h28" stroke="#704214" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  dangerMarker: (
    <>
      <path d="M24 6 43 40H5L24 6Z" fill="#F9735B" />
      <path d="M24 13 36 35H12l12-22Z" fill="#FFE2C6" />
      <path d="M24 19v8" stroke="#B91C1C" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="32" r="2.3" fill="#B91C1C" />
      <path d="M9 40h30" stroke="#7F1D1D" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  atlasMap: (
    <>
      <path d="M8 13 19 8l10 4 11-4v27l-11 5-10-4-11 4V13Z" fill="#F5D99C" />
      <path d="M19 8v28M29 12v28" stroke="#B7792F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 18c4-3 7 1 11-1 4-2 6-5 11-3M13 29c6-2 9 3 14 1 3-1 5-4 8-3" stroke="#2F9E8F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 24 22 34" stroke="#F9735B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="27" cy="24" r="3" fill="#F9735B" />
      <circle cx="22" cy="34" r="2" fill="#7C3AED" />
    </>
  ),
  srsHourglass: (
    <>
      <path d="M15 8h18M15 40h18" stroke="#5B4B8A" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 10h12v8c0 3-2 5-6 7 4 2 6 4 6 7v6H18v-6c0-3 2-5 6-7-4-2-6-4-6-7v-8Z" fill="#F8E7B0" stroke="#7C3AED" strokeWidth="3" />
      <path d="M20 15h8c0 4-2 6-4 7-2-1-4-3-4-7ZM24 28c3 1 4 3 4 6h-8c0-3 1-5 4-6Z" fill="#A78BFA" />
      <path d="M24 23v6" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  studyTree: (
    <>
      <path d="M22 28h5l2 13H20l2-13Z" fill="#8B5A2B" />
      <path d="M13 25c0-5 4-9 9-9 1-5 8-6 11-2 4 1 6 4 6 8 0 5-4 9-10 9H20c-4 0-7-3-7-6Z" fill="#2F9E44" />
      <path d="M10 29c0-4 3-7 7-7h13c4 0 7 3 7 7s-3 7-7 7H17c-4 0-7-3-7-7Z" fill="#58C26B" />
      <path d="M24 30c-1 4-2 7-4 10M25 30c2 4 4 7 7 9" stroke="#6B3F22" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="31" cy="21" r="2" fill="#D9F99D" />
    </>
  ),
  syncBoat: (
    <>
      <path d="M8 31h32l-5 8H15l-7-8Z" fill="#2F80A0" />
      <path d="M16 18v13" stroke="#704214" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 18c6 1 10 5 12 10H18V18Z" fill="#F7E2B4" />
      <path d="M13 24h8v7h-8v-7Z" fill="#D9A85C" />
      <path d="M13 24h8M17 24v7" stroke="#9A5A2A" strokeWidth="1.8" />
      <path d="M6 40c4-2 8-2 12 0s8 2 12 0 8-2 12 0" stroke="#4FC3D7" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  campfire: (
    <>
      <path d="M14 37 34 27M34 37 14 27" stroke="#704214" strokeWidth="4" strokeLinecap="round" />
      <path d="M25 8c4 6 1 9-2 12-3 3-4 6-1 10-7-2-10-8-7-14 1-3 5-5 10-8Z" fill="#FFB347" />
      <path d="M27 18c5 4 6 10 1 14-4 3-10 2-12-3 5 1 7-3 7-6 0-2 1-4 4-5Z" fill="#F9735B" />
      <path d="M24 23c2 3 1 6-2 8-2-2-2-5 2-8Z" fill="#FFF1A8" />
      <path d="M12 40h24" stroke="#8B5A2B" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  papers: (
    <>
      <path d="M13 8h18l6 6v26H13V8Z" fill="#F7E2B4" />
      <path d="M31 8v7h6" fill="#E8C47A" />
      <path d="M18 20h14M18 26h14M18 32h10" stroke="#7A4A22" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 40h24" stroke="#B7792F" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  graph: (
    <>
      <path d="M13 31 24 15l11 16M16 31h16" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="14" r="5" fill="#38BDF8" />
      <circle cx="13" cy="32" r="5" fill="#58C26B" />
      <circle cx="35" cy="32" r="5" fill="#A78BFA" />
      <circle cx="24" cy="36" r="4" fill="#FFB347" />
      <path d="M18 32h12" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
};

export const ISLAND_ICON_IDS = Object.keys(iconPaths);

export default function IslandIcon({ id, title, decorative = true, className = "", ...props }) {
  const iconTitle = decorative ? null : title || ICON_TITLES[id] || "Island asset";
  return (
    <IslandSvg title={iconTitle} className={`island-icon--${id} ${className}`.trim()} {...props}>
      {iconPaths[id] || iconPaths.atlasMap}
    </IslandSvg>
  );
}
