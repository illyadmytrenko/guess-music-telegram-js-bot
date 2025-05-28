import fetch from "node-fetch";

export const searchTrackByName = async (trackName) => {
  const query = encodeURIComponent(trackName);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.resultCount === 0) return null;

    const track = data.results[0];

    return {
      name: track.trackName,
      artist: track.artistName,
      previewUrl: track.previewUrl,
      artworkUrl: track.artworkUrl100
    };
  } catch (err) {
    console.error("iTunes API error:", err);
    return null;
  }
};