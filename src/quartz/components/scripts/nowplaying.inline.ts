function updateMostPlayed() {
  fetch("https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=taimouraaa&api_key=a45d16476b5ff3e3162e000b9ed1038f&format=json&period=7day&limit=1")
    .then((response) => response.json())
    .then((data) => {
      const track = data.toptracks?.track?.[0]
      const nowplaying = document.getElementById("nowplaying")
      if (!nowplaying || !track) return

      const dataObj = {
        artwork: track.image?.[2]?.['#text'] || '',
        trackName: track.name,
        artist: track.artist.name
      }

      const spotifyLink = `https://open.spotify.com/search/${encodeURIComponent(dataObj.trackName + ' ' + dataObj.artist)}`
      const youtubeLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(dataObj.trackName + ' ' + dataObj.artist)}`

      nowplaying.innerHTML = `
        <div class="desktop-only" style="font-family: system-ui, sans-serif;">
          <span>Most played this week:</span>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img
              src="${dataObj.artwork}"
              alt="Album artwork"
              style="width: 3rem; height: 3rem; object-fit: cover; border-radius: 0.125rem;"
            />
            <div>
              <div style="color: #333; font-weight: 500;">${dataObj.trackName}</div>
              <div style="color: #666; font-size: 0.875rem;">${dataObj.artist}</div>
              <div style="margin-top:0.25rem;">
                <a href="${spotifyLink}" target="_blank" style="color:#1DB954; font-size:0.875rem; text-decoration:none; margin-right:0.5rem;">Spotify</a> |
                <a href="${youtubeLink}" target="_blank" style="color:#FF0000; font-size:0.875rem; text-decoration:none; margin-left:0.5rem;">YouTube</a>
              </div>
            </div>
          </div>
        </div>
      `
    })
    .catch(() => {
      const nowplaying = document.getElementById("nowplaying")
      if (!nowplaying) return

      nowplaying.innerHTML = ""
    })
}

updateMostPlayed()
setInterval(updateMostPlayed, 60000)
