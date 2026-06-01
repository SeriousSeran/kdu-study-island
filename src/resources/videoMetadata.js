/**
 * Video Metadata Helper
 *
 * Extract YouTube Video ID from any pasted URL and fetch basic video metadata
 * using the key-free, quota-free YouTube oEmbed endpoint.
 */

/**
 * Extracts the 11-character YouTube video ID from various URL formats.
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 *
 * @param {string} url Pasted YouTube URL
 * @returns {string|null} 11-char Video ID or null
 */
export function extractYoutubeVideoId(url) {
  if (!url) return null;
  const cleaned = url.trim();

  // Regex patterns for different YouTube link variations
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/ // raw video ID
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetches basic video metadata (title, author/channel) using YouTube's free oEmbed API.
 * Does not require a developer API key and is completely free of billing/quotas.
 *
 * @param {string} videoId 11-character YouTube video ID
 * @returns {Promise<{title: string, channelTitle: string}|null>} Metadata or null if fetch fails
 */
export async function fetchOembedMetadata(videoId) {
  if (!videoId) return null;
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;

  try {
    const response = await fetch(oembedEndpoint);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      title: data.title || "Clinical Video",
      channelTitle: data.author_name || "YouTube Clinical Creator"
    };
  } catch (err) {
    console.warn("[Video oEmbed] Failed to retrieve metadata:", err.message);
    return null;
  }
}
