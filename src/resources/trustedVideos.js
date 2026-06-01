// Curated list of high-yield trusted clinical video resources
// Primarily sourced from standard free platforms (e.g., Geeky Medics, Ninja Nerd, Armando Hasudungan)
// Strictly for visual demonstration of techniques, procedures, and core pathways.

export const CURATED_VIDEOS = [
  {
    id: "curated-cv-exam",
    provider: "youtube",
    videoId: "R1wG8H39sY0",
    url: "https://www.youtube.com/watch?v=R1wG8H39sY0",
    title: "Cardiovascular Examination (OSCE guide)",
    channelTitle: "Geeky Medics",
    topic: "Cardiology",
    subject: "Medicine",
    purpose: "exam-technique",
    trusted: true,
    addedBy: "curated",
    notes: "Perfect OSCE checklist for hand inspection, pulse palpation, precordial examination, and auscultation.",
    tags: ["OSCE", "Cardiology", "Clinical Skills"]
  },
  {
    id: "curated-resp-exam",
    provider: "youtube",
    videoId: "y11d4eR7Xzo",
    url: "https://www.youtube.com/watch?v=y11d4eR7Xzo",
    title: "Respiratory Examination (OSCE guide)",
    channelTitle: "Geeky Medics",
    topic: "Respiratory",
    subject: "Medicine",
    purpose: "exam-technique",
    trusted: true,
    addedBy: "curated",
    notes: "Comprehensive overview of thoracic inspection, expansion assessment, percussion, and breath sound auscultation.",
    tags: ["OSCE", "Respiratory", "Clinical Skills"]
  },
  {
    id: "curated-ecg-basics",
    provider: "youtube",
    videoId: "F5O4sL8Qf-Y",
    url: "https://www.youtube.com/watch?v=F5O4sL8Qf-Y",
    title: "ECG Interpretation Basics",
    channelTitle: "Ninja Nerd",
    topic: "Electrocardiogram",
    subject: "Medicine",
    purpose: "ecg",
    trusted: true,
    addedBy: "curated",
    notes: "Exceptional explanation of waves, intervals, axes, and basic rhythm assessment.",
    tags: ["ECG", "Cardiology", "Interpretation"]
  },
  {
    id: "curated-gbs-pathway",
    provider: "youtube",
    videoId: "K-Ea5Vn1U18",
    url: "https://www.youtube.com/watch?v=K-Ea5Vn1U18",
    title: "Guillain-Barré Syndrome Pathology & Signs",
    channelTitle: "Armando Hasudungan",
    topic: "Neurology",
    subject: "Medicine",
    purpose: "anatomy",
    trusted: true,
    addedBy: "curated",
    notes: "Visual breakdown of autoimmune molecular mimicry, demyelination, and ascending muscle weakness.",
    tags: ["Neurology", "GBS", "Immunology"]
  },
  {
    id: "curated-cannulation",
    provider: "youtube",
    videoId: "d2d1Z2J1W90",
    url: "https://www.youtube.com/watch?v=d2d1Z2J1W90",
    title: "Intravenous (IV) Cannulation Procedure",
    channelTitle: "Geeky Medics",
    topic: "Procedures",
    subject: "Surgery",
    purpose: "procedure",
    trusted: true,
    addedBy: "curated",
    notes: "Aseptic technique, vein selection, needle insertion angle, and securing the cannula.",
    tags: ["Procedure", "Surgery", "Clinical Skills"]
  },
  {
    id: "curated-preeclampsia",
    provider: "youtube",
    videoId: "S5A3_82L-Fk",
    url: "https://www.youtube.com/watch?v=S5A3_82L-Fk",
    title: "Preeclampsia & Eclampsia Pathophysiology",
    channelTitle: "Armando Hasudungan",
    topic: "Preeclampsia",
    subject: "O&G",
    purpose: "emergency",
    trusted: true,
    addedBy: "curated",
    notes: "Placental perfusion defects, spiral artery failures, and end-organ systemic vasoconstriction.",
    tags: ["Obstetrics", "Preeclampsia", "Hypertension"]
  }
];

export function getCuratedForSubject(subject) {
  if (!subject || subject === "All" || subject === "Mix") return CURATED_VIDEOS;
  return CURATED_VIDEOS.filter(v => v.subject.toLowerCase() === subject.toLowerCase());
}

export function searchCurated(query) {
  if (!query) return CURATED_VIDEOS;
  const q = query.toLowerCase();
  return CURATED_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(q) ||
    v.topic.toLowerCase().includes(q) ||
    v.notes.toLowerCase().includes(q) ||
    v.tags.some(t => t.toLowerCase().includes(q))
  );
}
