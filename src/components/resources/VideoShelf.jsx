import React from "react";
import { getCuratedForSubject, searchCurated } from "../../resources/trustedVideos.js";
import { extractYoutubeVideoId, fetchOembedMetadata } from "../../resources/videoMetadata.js";

export default function VideoShelf({ subject = "All", topic = "", customVideos = [], onAddCustomVideo }) {
  const [urlInput, setUrlInput] = React.useState("");
  const [pastedPurpose, setPastedPurpose] = React.useState("exam-technique");
  const [pastedTopic, setPastedTopic] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [activeEmbedId, setActiveEmbedId] = React.useState(null);

  // Load curated videos matching the clinical subject
  const curated = React.useMemo(() => {
    let list = getCuratedForSubject(subject);
    if (topic) {
      const q = topic.toLowerCase();
      list = list.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.topic.toLowerCase().includes(q) ||
        v.tags?.some(t => t.toLowerCase() === q)
      );
    }
    return list;
  }, [subject, topic]);

  // Load user custom pasted videos matching the subject
  const custom = React.useMemo(() => {
    let list = Array.isArray(customVideos) ? customVideos : [];
    if (subject && subject !== "All" && subject !== "Mix") {
      list = list.filter(v => v.subject?.toLowerCase() === subject.toLowerCase());
    }
    if (topic) {
      const q = topic.toLowerCase();
      list = list.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.topic.toLowerCase().includes(q)
      );
    }
    return list;
  }, [customVideos, subject, topic]);

  const allVideos = React.useMemo(() => {
    return [...curated, ...custom];
  }, [curated, custom]);

  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const videoId = extractYoutubeVideoId(urlInput);
    if (!videoId) {
      setError("Invalid YouTube URL. Please paste a valid watch, embed, or short link.");
      return;
    }

    setLoading(true);
    try {
      // Fetch metadata completely keyless using oEmbed
      const meta = await fetchOembedMetadata(videoId);
      
      const newVideo = {
        id: `user-${Date.now()}`,
        provider: "youtube",
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: meta?.title || pastedTopic || "Pasted Clinical Video",
        channelTitle: meta?.channelTitle || "Pasted Resource",
        topic: pastedTopic || topic || "Clinical Procedure",
        subject: subject === "All" || subject === "Mix" ? "Medicine" : subject,
        purpose: pastedPurpose,
        trusted: true,
        addedBy: "user",
        notes: "Manually pasted by student.",
        tags: ["User Added"]
      };

      if (onAddCustomVideo) {
        onAddCustomVideo(newVideo);
        setUrlInput("");
        setPastedTopic("");
        setError("");
      }
    } catch (err) {
      setError("Could not retrieve video details. Make sure you are online.");
    } finally {
      setLoading(false);
    }
  };

  if (allVideos.length === 0 && !onAddCustomVideo) {
    return null;
  }

  return (
    <section className="card video-shelf-card">
      <div className="video-shelf-header">
        <h4>📺 Optional: Clinical Video Shelf</h4>
        <p className="subtitle">Watch if confused. These are curated visual demonstrations, not authoritative textbook sources.</p>
      </div>

      {allVideos.length > 0 ? (
        <div className="videos-scroller">
          {allVideos.map(video => (
            <div key={video.id} className="video-card-item">
              {activeEmbedId === video.videoId ? (
                <div className="embed-wrapper">
                  <iframe
                    title={video.title}
                    src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <button className="small-action-btn" onClick={() => setActiveEmbedId(null)}>Close player</button>
                </div>
              ) : (
                <div className="video-preview-row" onClick={() => setActiveEmbedId(video.videoId)}>
                  <div className="video-thumbnail-placeholder">
                    <span>▶ Play</span>
                  </div>
                  <div className="video-details">
                    <span className="video-badge">{video.purpose.toUpperCase().replace("-", " ")}</span>
                    <h5>{video.title}</h5>
                    <p className="channel">{video.channelTitle} · {video.addedBy === "curated" ? "★ Curated" : "Student Pasted"}</p>
                    {video.notes && <p className="notes">{video.notes}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-garden-text">No curated videos found for this topic. Paste a YouTube URL below to add one!</p>
      )}

      {onAddCustomVideo && (
        <form onSubmit={handlePasteSubmit} className="card paste-video-form margin-top-md">
          <h5>Add Custom YouTube Reference</h5>
          
          <div className="form-group margin-top-sm">
            <input
              type="text"
              placeholder="Paste YouTube watch or short link..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid2 margin-top-xs">
            <div className="form-group">
              <select 
                value={pastedPurpose} 
                onChange={e => setPastedPurpose(e.target.value)}
                disabled={loading}
              >
                <option value="exam-technique">OSCE Exam Technique</option>
                <option value="procedure">Clinical Procedure</option>
                <option value="ecg">ECG Guide</option>
                <option value="radiology">Radiology/Imaging</option>
                <option value="anatomy">Anatomy/Physiology</option>
                <option value="emergency">Emergency Flow</option>
                <option value="psychiatry-interview">Psych Interview</option>
              </select>
            </div>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="Topic name (optional)"
                value={pastedTopic}
                onChange={e => setPastedTopic(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="error-text clinical-pulsar">{error}</p>}
          
          <button 
            type="submit" 
            className="tonal full pill margin-top-sm"
            disabled={loading || !urlInput.trim()}
          >
            {loading ? "Fetching video metadata..." : "Add Reference To Shelf"}
          </button>
        </form>
      )}
    </section>
  );
}
