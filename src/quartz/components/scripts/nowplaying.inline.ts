function updateNowPlaying() {
  fetch("https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=taimouraaa&api_key=a45d16476b5ff3e3162e000b9ed1038f&format=json")
    .then((response) => response.json())
    .then((data) => {
      const track = data.recenttracks?.track?.[0]
      const nowplaying = document.getElementById("nowplaying")
      if (!nowplaying || !track) return

      const dataObj = {
        artwork: track.image?.[2]?.['#text'] || '',
        trackName: track.name,
        artist: track.artist['#text']
      }

      nowplaying.innerHTML = `
        <div class="desktop-only" style="font-family: system-ui, sans-serif;">
          <span>Recent listening:</span>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img
              src="${dataObj.artwork}"
              alt="Album artwork"
              style="width: 3rem; height: 3rem; object-fit: cover; border-radius: 0.125rem;"
            />
            <div>
              <div style="color: #333; font-weight: 500;">${dataObj.trackName}</div>
              <div style="color: #666; font-size: 0.875rem;">${dataObj.artist}</div>
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

updateNowPlaying()
setInterval(updateNowPlaying, 30000)
