const waveforms = {};

document.addEventListener('DOMContentLoaded', function () {
  const waveformElements = document.querySelectorAll('.waveform-preview');

  waveformElements.forEach(el => {
    const id = parseInt(el.getAttribute('data-audio-id'));
    const url = el.getAttribute('data-audio-url');

    const wavesurfer = WaveSurfer.create({
      container: el,
      waveColor: '#999',
      progressColor: '#4CAF50',
      cursorColor: '#000',
      height: 60,
      barWidth: 2,
      responsive: true,
      interact: true // Allow clicking on waveform to seek
    });

    wavesurfer.load(url);
    waveforms[id] = wavesurfer;

    // Update play button when audio finishes
    wavesurfer.on('finish', () => {
      const btn = document.getElementById(`playBtn-${id}`);
      if (btn) btn.textContent = '▶';
    });
  });
});

function togglePlay(id) {
  const player = waveforms[id];
  const btn = document.getElementById(`playBtn-${id}`);
  
  if (!player || !btn) return;

  if (player.isPlaying()) {
    player.pause();
    btn.textContent = '▶';
  } else {
    // Pause all other players
    Object.keys(waveforms).forEach(wid => {
      if (parseInt(wid) !== id) {
        waveforms[wid].pause();
        const otherBtn = document.getElementById(`playBtn-${wid}`);
        if (otherBtn) otherBtn.textContent = '▶';
      }
    });
    
    player.play();
    btn.textContent = '⏸';
  }
}

function deleteClip(elementId, audioId) {
    if (!confirm(`Delete this audio clip?`)) return;
  
    fetch(`/delete_download/${audioId}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCSRFToken()
      }
    })
    .then(response => {
      if (response.ok) {
        const el = document.getElementById(elementId);
        if (el) {
          el.style.transition = 'opacity 0.3s';
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 300);
        }
      } else if (response.status === 401) {
        alert("Please log in to delete this clip.");
        window.location.href = '/login/';
      } else {
        alert("Delete failed: " + response.statusText);
      }
    })
    .catch(err => {
      console.error('Error deleting clip:', err);
      alert("Something went wrong.");
    });
}

// Get CSRF token from cookie (Django-style)
function getCSRFToken() {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.startsWith(name + '=')) {
      return c.substring(name.length + 1);
    }
  }
  return '';
}