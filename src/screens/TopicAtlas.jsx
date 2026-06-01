import React from "react";
import { subjectRank } from "../data/banks.js";

export const HIGH_YIELD_TOPICS = [
  {
    topicId: "hyperkalaemia",
    title: "Hyperkalaemia",
    subject: "Medicine",
    system: "Renal/Cardiology",
    commonPresentation: "Muscle weakness, palpitations, flaccid paralysis, or asymptomatic with ECG changes.",
    keyMechanism: "Elevated extracellular K+ shifts resting membrane potential closer to threshold, reducing myocardial excitability and causing cardiac arrest.",
    mustKnow: [
      "ECG progression: Tall peaked T waves → PR prolongation → QRS widening → Sine wave.",
      "Emergency stabiliser: 10ml of 10% Calcium Gluconate (protects cardiac membrane; does NOT lower K+).",
      "Shift therapies: Actrapid insulin 10 units + 50ml of 50% Dextrose, or Nebulised Salbutamol.",
      "Elimination therapies: Calcium Resonium, loop diuretics, or urgent Haemodialysis."
    ],
    commonTraps: "Do not delay Calcium Gluconate while waiting for a repeat blood draw if ECG shows widening or sine wave; treat immediately.",
    nextAction: "Practice Renal MCQs"
  },
  {
    topicId: "preeclampsia",
    title: "Preeclampsia",
    subject: "O&G",
    system: "Obstetrics",
    commonPresentation: "New onset hypertension (>140/90) after 20 weeks gestation + proteinuria or end-organ dysfunction.",
    keyMechanism: "Abnormal spiral artery remodelling leads to placental hypoperfusion, causing release of anti-angiogenic factors and widespread maternal endothelial dysfunction.",
    mustKnow: [
      "Severe features: BP >160/110, thrombocytopenia, elevated LFTs, severe RUQ pain, visual disturbances.",
      "Prophylaxis: Low-dose Aspirin (75-150mg) started before 16 weeks in high-risk patients.",
      "Seizure prophylaxis: Magnesium Sulphate (4g loading dose + 1g/hr maintenance). Monitor patellar reflexes, respiratory rate, and urine output.",
      "Definitive treatment: Delivery of the fetus and placenta (timing depends on gestational age and severity)."
    ],
    commonTraps: "Using Diazepam/Lorazepam as first-line for eclamptic seizures; Magnesium Sulphate is the proven gold standard.",
    nextAction: "Review O&G SEQs"
  },
  {
    topicId: "acute-appendicitis",
    title: "Acute Appendicitis",
    subject: "Surgery",
    system: "Gastrointestinal",
    commonPresentation: "Periumbilical pain migrating to the Right Iliac Fossa (RIF), fever, anorexia, localized guarding.",
    keyMechanism: "Obstruction of the appendiceal lumen (fecalith, lymphoid hyperplasia) leads to mucus accumulation, bacterial overgrowth, ischemic necrosis, and perforation.",
    mustKnow: [
      "Clinical signs: McBurney's point tenderness, Rovsing's sign (left RIF pressure causes right pain), Psoas sign.",
      "Scoring system: Alvarado Score (MANTRELS) for diagnostic assistance.",
      "Management: Nil by mouth (NBM), IV fluids, prophylactic antibiotics (covering anaerobes and Gram-negatives), and early Laparoscopic Appendicectomy.",
      "Complications: Perforation, pelvic abscess, portal pyelophlebitis."
    ],
    commonTraps: "Excluding appendicitis because a patient does not have a high white cell count; clinical examination remains the absolute primary guide.",
    nextAction: "Practice General Surgery Cases"
  },
  {
    topicId: "febrile-seizures",
    title: "Febrile Seizures",
    subject: "Paediatrics",
    system: "Neurology",
    commonPresentation: "Generalized tonic-clonic seizure in a child aged 6 months to 5 years, accompanied by a fever (>38°C) without intracranial infection.",
    keyMechanism: "Rapid rise in temperature in a genetically vulnerable child lowering the seizure threshold in the immature developing brain.",
    mustKnow: [
      "Simple febrile seizure: Generalized, lasts <15 mins, does not recur within 24 hours, normal developmental baseline.",
      "Complex febrile seizure: Focal onset, lasts >15 mins, or recurs multiple times within the same febrile illness.",
      "Immediate care: Lay in recovery position, secure airway. If seizure lasts >5 mins, give Buccal Midazolam or Rectal Diazepam.",
      "Parental reassurance: Address fear of epilepsy (risk is only ~1-2% for simple, close to baseline)."
    ],
    commonTraps: "Performing a routine lumbar puncture or CT scan on every child with a simple febrile seizure; focus on finding the source of the fever.",
    nextAction: "Review Paediatrics Papers"
  },
  {
    topicId: "major-depression",
    title: "Major Depressive Disorder",
    subject: "Psychiatry",
    system: "Affective",
    commonPresentation: "Depressed mood, anhedonia, fatigue, sleep disturbance, feelings of worthlessness, suicidal ideation for >= 2 weeks.",
    keyMechanism: "Complex dysregulation of monoaminergic neurotransmitters (serotonin, noradrenaline, dopamine), neuroinflammation, and hypothalamic-pituitary-adrenal (HPA) axis hyperactivation.",
    mustKnow: [
      "Core criteria (DSM-5): Depressed mood or anhedonia must be present out of 5+ required symptoms.",
      "Risk assessment: Suicide risk must be assessed thoroughly at every visit (ideation, intent, plan, access).",
      "Biopsychosocial management: Cognitive Behavioural Therapy (CBT), SSRIs (e.g., Sertraline, Fluoxetine), and support groups.",
      "Emergency: Electroconvulsive Therapy (ECT) is highly effective for severe, treatment-resistant depression with acute suicide risk or catatonia."
    ],
    commonTraps: "Starting SSRIs without warning the patient about the lag in therapeutic onset (2-4 weeks) and the transient initial increase in anxiety and suicidal ideation.",
    nextAction: "Practice Psychiatry Cases"
  },
  {
    topicId: "meningitis",
    title: "Acute Bacterial Meningitis",
    subject: "Medicine",
    system: "Neurology/Infectious",
    commonPresentation: "High fever, headache, photophobia, neck stiffness (meningism), altered mental status, non-blanching purpuric rash (Meningococcal).",
    keyMechanism: "Bacterial colonization of the nasopharynx → hematogenous spread → blood-brain barrier invasion → severe purulent cerebrospinal inflammation.",
    mustKnow: [
      "Clinical tests: Kernig's sign (knee extension causes back pain), Brudzinski's sign (neck flexion causes hip flexion).",
      "Immediate action: Give IV Benzylpenicillin or Ceftriaxone immediately in the community if suspected meningococcal septicaemia.",
      "CSF analysis: High protein, low glucose (<40% of blood), high polymorphs (neutrophils), turbid appearance.",
      "Steroid adjunct: Give IV Dexamethasone with or just before the first dose of antibiotics to reduce neurological sequelae (deafness)."
    ],
    commonTraps: "Delaying life-saving antibiotics to perform a lumbar puncture in an unstable patient or a patient with signs of raised ICP (papilloedema, focal neurological deficits).",
    nextAction: "Practice Medicine MCQs"
  }
];

export default function TopicAtlas({ attempts, onDrill, onTab, onStartFocus }) {
  const [filter, setFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(null);

  // Compute dynamic mastery based on attempts
  const getMastery = React.useCallback((topic) => {
    const relevantAttempts = Object.values(attempts).filter(a => 
      a.subject === topic.subject && 
      (a.stem.toLowerCase().includes(topic.title.toLowerCase()) || 
       a.tags?.some(t => t.toLowerCase() === topic.title.toLowerCase()))
    );

    if (!relevantAttempts.length) return "new";
    const wrongs = relevantAttempts.filter(a => a.weak);
    if (wrongs.length > 0 && wrongs.length === relevantAttempts.length) return "weak";
    if (wrongs.length > 0) return "improving";
    if (relevantAttempts.length >= 3) return "mastered";
    return "safe";
  }, [attempts]);

  const filteredTopics = HIGH_YIELD_TOPICS.filter(t => {
    const matchesFilter = filter === "All" || t.subject === filter;
    const matchesSearch = search === "" || 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.system.toLowerCase().includes(search.toLowerCase()) ||
      t.commonPresentation.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getMasteryColor = (level) => {
    return {
      new: "neutral",
      weak: "bad",
      improving: "warning",
      safe: "good",
      mastered: "gold",
    }[level] || "neutral";
  };

  const getSubjectColorClass = (subject) => {
    return {
      Cardiology: "cardio",
      Medicine: "med",
      Surgery: "surg",
      Paediatrics: "paeds",
      "O&G": "obgyn",
      Psychiatry: "psych",
    }[subject] || "";
  };

  return (
    <main className="screen scrollable">
      <header className="page-header">
        <h1>Clinical Atlas</h1>
        <p className="subtitle">High-yield clinical topics for KDU finals. Master them all.</p>
      </header>

      <section className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by topic, presentation or system..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </section>

      <section className="chip-row">
        {["All", "Medicine", "Surgery", "Paediatrics", "O&G", "Psychiatry"].map(sub => (
          <button
            key={sub}
            className={`chip ${filter === sub ? "active" : ""}`}
            onClick={() => setFilter(sub)}
          >
            {sub}
          </button>
        ))}
      </section>

      <section className="bento-grid">
        {filteredTopics.map(topic => {
          const mastery = getMastery(topic);
          return (
            <div
              key={topic.topicId}
              className={`bento-card ${getSubjectColorClass(topic.subject)}`}
              onClick={() => setSelected(topic)}
            >
              <div className="bento-card-header">
                <span className={`badge ${getMasteryColor(mastery)}`}>{mastery.toUpperCase()}</span>
                <span className="system-chip">{topic.system}</span>
              </div>
              <h3>{topic.title}</h3>
              <p className="presentation-preview">{topic.commonPresentation.slice(0, 100)}...</p>
              <span className="action-hint">Tap to expand clinical notes</span>
            </div>
          );
        })}
      </section>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>×</button>
            <div className="modal-header">
              <span className={`badge ${getMasteryColor(getMastery(selected))}`}>{getMastery(selected).toUpperCase()}</span>
              <p className="eyebrow">{selected.subject} · {selected.system}</p>
              <h2>{selected.title}</h2>
            </div>
            
            <div className="modal-body">
              <div className="section-block">
                <h4>Common Presentation</h4>
                <p>{selected.commonPresentation}</p>
              </div>

              <div className="section-block">
                <h4>Key Mechanism</h4>
                <p>{selected.keyMechanism}</p>
              </div>

              <div className="section-block">
                <h4>Must-Know Exam Points</h4>
                <ul>
                  {selected.mustKnow.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              </div>

              <div className="section-block trap">
                <h4>⚠️ Common Exam Trap</h4>
                <p>{selected.commonTraps}</p>
              </div>
            </div>

            <div className="modal-footer">
              {onStartFocus && (
                <button 
                  className="primary pill" 
                  onClick={() => {
                    onStartFocus("Topic Atlas", selected.subject, selected.title);
                    setSelected(null);
                  }}
                >
                  Start Focus Block
                </button>
              )}
              <button className="tonal pill" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
