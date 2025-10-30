async function updateMostPlayed() {
  const nowplayingEl = document.getElementById("nowplaying")
  if (!nowplayingEl) return

  try {

    const recentRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=taimouraaa&api_key=a45d16476b5ff3e3162e000b9ed1038f&format=json&limit=1`)
    const recentData = await recentRes.json()
    const recentTrack = recentData.recenttracks?.track?.[0]
    const isPlaying = recentTrack?.["@attr"]?.nowplaying === "true"

    let track = null
    let label = ""

    if (isPlaying) {
      track = recentTrack
      label = "Now Playing"
    } else {

      const topRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=taimouraaa&api_key=a45d16476b5ff3e3162e000b9ed1038f&format=json&period=7day&limit=1`)
      const topData = await topRes.json()
      track = topData.toptracks?.track?.[0]
      debugger
      if (!track) {
        nowplayingEl.innerHTML = ""
        return
      }
      label = "On Repeat This Week"
    }

    const artwork = track.image?.[2]?.['#text'] || ""
    const trackName = track.name
    const artist = track.artist["#text"] || track.artist.name

    const spotifyLink = `https://open.spotify.com/search/${encodeURIComponent(trackName + " " + artist)}`
    const youtubeLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(trackName + " " + artist)}`

    nowplayingEl.innerHTML = `
      <div style="font-family: system-ui, sans-serif;">
        <span>${label}:</span>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img
            src="${artwork}"
            alt="Album artwork"
            style="width: 3rem; height: 3rem; object-fit: cover; border-radius: 0.125rem;"
          />
          <div>
            <div style="color: #333; font-weight: 500;">${trackName}</div>
            <div style="color: #666; font-size: 0.875rem;">${artist}</div>
            <div style="margin-top:0.25rem;">
              <a href="${spotifyLink}" target="_blank" style="color:#1DB954; font-size:0.875rem; text-decoration:none; margin-right:0.5rem;">Spotify</a> |
              <a href="${youtubeLink}" target="_blank" style="color:#FF0000; font-size:0.875rem; text-decoration:none; margin-left:0.5rem;">YouTube</a>
            </div>
          </div>
        </div>
      </div>
    `
  } catch {
    nowplayingEl.innerHTML = ""
  }
}

updateMostPlayed()
setInterval(updateMostPlayed, 30000)
