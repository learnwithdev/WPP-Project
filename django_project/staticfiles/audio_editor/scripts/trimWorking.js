    // const sidebar = document.getElementById('sidebar');
    // const overlay = document.getElementById('overlay');
    // const openSidebar = document.getElementById('openSidebar');
    // const closeSidebar = document.getElementById('closeSidebar');

    // openSidebar.addEventListener('click', () => {
    //   sidebar.classList.add('active');
    //   overlay.classList.add('active');
    // });

    // closeSidebar.addEventListener('click', () => {
    //   sidebar.classList.remove('active');
    //   overlay.classList.remove('active');
    // });

    // overlay.addEventListener('click', () => {
    //   sidebar.classList.remove('active');
    //   overlay.classList.remove('active');
    // });

    // const audioUpload = document.getElementById('audioUpload');
    // const fileNameDisplay = document.getElementById('fileName');

    // audioUpload.addEventListener('change', () => {
    //   const file = audioUpload.files[0];
    //   if (file) {
    //     fileNameDisplay.textContent = `✅ Uploaded: ${file.name}`;
    //     fileNameDisplay.style.color = '#00796b';
    //   } else {
    //     fileNameDisplay.textContent = '';
    //   }
    // });

let sliderMode = null;
let lastPitch = 0;
let lastVolume = 100;
let lastSpeed = 100;

let wavesurfer;
let currentRegion;

document.getElementById('upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (wavesurfer) {
    wavesurfer.destroy();
    document.getElementById('waveform').innerHTML = '';
    document.getElementById('playPauseBtn').textContent = 'Play Region';
    document.getElementById('playPauseFullBtn').textContent = 'Play Full';
  }

  wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#5555ff',           // Unplayed waveform (neon blueish)
    progressColor: '#00ffff',       // Played waveform (neon cyan)
    cursorColor: '#ff00ff',         // Playback cursor (neon pink)
    backgroundColor: '#0e0e1f',     // Background behind waveform
    responsive: true,
    height: 100,                    // Optional: wave height
    plugins: [
      WaveSurfer.regions.create()
    ]
  });
  
  wavesurfer.loadBlob(file);
  

  wavesurfer.on('ready', () => {
    document.getElementById('scrubber').style.display = 'block';
    document.getElementById('myRange').value = 100;
    wavesurfer.setVolume(1); // Set to default 100%

    const duration = wavesurfer.getDuration();
currentRegion = wavesurfer.addRegion({
  start: 0,
  end: duration,
  drag: true,
  resize: true,
  color: 'rgba(128, 0, 128, 0.3)', // Purple shade for the selected region
  handleStyle: {
    left: {
      backgroundColor: 'purple', // Purple dragger
      width: '5px',
      cursor: 'ew-resize'
    },
    right: {
      backgroundColor: 'purple', // Purple dragger
      width: '5px',
      cursor: 'ew-resize'
    }
  }
});
updateTimeDisplay(0, duration);
});


  wavesurfer.on('region-updated', region => {
    currentRegion = region;
    updateTimeDisplay(region.start, region.end);
  });


  wavesurfer.on('region-update-end', region => {
    currentRegion = region;
    updateTimeDisplay(region.start, region.end);
  });

  let customSource = null;
  let customPlaybackStartTime = null;
  let scrubberAnimationFrame = null;

  function updateScrubberManually() {
if (!wavesurfer || !customPlaybackStartTime || !currentRegion) return;

const now = wavesurfer.backend.ac.currentTime;
const elapsed = now - customPlaybackStartTime;
const progress = elapsed / (currentRegion.end - currentRegion.start);

const waveformEl = document.getElementById('waveform');
const scrubberEl = document.getElementById('scrubber');
const waveformWidth = waveformEl.clientWidth;

if (progress >= 1) {
scrubberEl.style.left = `${(currentRegion.end / wavesurfer.getDuration()) * waveformWidth}px`;
return;
}

const currentTime = currentRegion.start + (progress * (currentRegion.end - currentRegion.start));
const percent = currentTime / wavesurfer.getDuration();

scrubberEl.style.left = `${percent * waveformWidth}px`;

scrubberAnimationFrame = requestAnimationFrame(updateScrubberManually);
}

document.getElementById('playPauseBtn').onclick = () => {
if (!wavesurfer || !currentRegion) return;

// If already playing custom source
if (customSource) {
customSource.stop();
cancelAnimationFrame(scrubberAnimationFrame);
customPlaybackStartTime = null;

customSource = null;
document.getElementById('playPauseBtn').textContent = 'Play Region';
return;
}

const backend = wavesurfer.backend;
const ac = backend.ac;
const buffer = backend.buffer;

// Create custom buffer source
const source = ac.createBufferSource();
const gainNode = ac.createGain();

source.buffer = buffer;
source.playbackRate.value = lastSpeed / 100;
source.detune.value = getDetuneFromPercent(lastPitch);
gainNode.gain.value = lastVolume / 100;

source.connect(gainNode);
gainNode.connect(ac.destination);

const offset = currentRegion.start;
const duration = currentRegion.end - currentRegion.start;

customPlaybackStartTime = backend.ac.currentTime;
source.start(0, offset, duration);
updateScrubberManually();


document.getElementById('playPauseBtn').textContent = 'Pause Region';
customSource = source;

source.onended = () => {
cancelAnimationFrame(scrubberAnimationFrame);
customPlaybackStartTime = null;

document.getElementById('playPauseBtn').textContent = 'Play Region';
customSource = null;
};
};


  document.getElementById('playPauseFullBtn').onclick = () => {
    if (!wavesurfer) return;

    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
      document.getElementById('playPauseFullBtn').textContent = 'Play Full';
    } else {
      wavesurfer.seekTo(0);
      wavesurfer.play();
      document.getElementById('playPauseFullBtn').textContent = 'Pause Full';
    }
  };

  wavesurfer.on('audioprocess', () => {
    const currentTime = wavesurfer.getCurrentTime();
    const duration = wavesurfer.getDuration();
    const waveformEl = document.getElementById('waveform');
    const scrubberEl = document.getElementById('scrubber');
    const waveformWidth = waveformEl.clientWidth;
    const progress = currentTime / duration;
    scrubberEl.style.left = `${progress * waveformWidth}px`;

    if (currentRegion && currentTime >= currentRegion.end) {
      wavesurfer.pause();
      document.getElementById('playPauseBtn').textContent = 'Play Region';
    }
  });

  wavesurfer.on('finish', () => {
    document.getElementById('playPauseFullBtn').textContent = 'Play Full';
  });
});

document.getElementById('myRange').addEventListener('input', function () {
    const value = parseInt(this.value, 10);

    if (sliderMode === 'volume') {
        lastVolume = value;
        const volume = value / 100;
        if (wavesurfer) wavesurfer.setVolume(volume);
        document.getElementById('volumeDisplay').textContent = `${value}%`;
    } else if (sliderMode === 'speed') {
        lastSpeed = value;
        const speed = value / 100;
        if (wavesurfer) wavesurfer.setPlaybackRate(speed);
        document.getElementById('volumeDisplay').textContent = `${speed.toFixed(1)}x`;
    }
});
document.getElementById('pitchSlider').addEventListener('input', function () {
    lastPitch = parseInt(this.value, 10);
    document.getElementById('pitchDisplay').textContent = `${lastPitch}%`;
});


function updateTimeDisplay(start, end) {
  document.getElementById('times').textContent =
    `Start: ${start.toFixed(2)}s — End: ${end.toFixed(2)}s`;
}
function getDetuneFromPercent(percent) {
return percent * 12; // ±100% => ±1200 cents (1 octave)
}



document.getElementById('trimBtn').addEventListener('click', async () => {
if (!wavesurfer || !currentRegion) return;

const start = currentRegion.start;
const end = currentRegion.end;
const exportOption = document.getElementById('exportOption').value;

const originalBuffer = wavesurfer.backend.buffer;
const sampleRate = originalBuffer.sampleRate;

const startSample = Math.floor(start * sampleRate);
const endSample = Math.floor(end * sampleRate);

const volumeLevel = lastVolume / 100;
const speedValue = lastSpeed / 100;

let outputBuffer;

if (exportOption === 'trim') {
const length = endSample - startSample;
const trimmed = new AudioContext().createBuffer(
  originalBuffer.numberOfChannels,
  length,
  sampleRate
);

for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
  trimmed.getChannelData(i)
    .set(originalBuffer.getChannelData(i).slice(startSample, endSample));
}

outputBuffer = resampleBuffer(trimmed, speedValue, volumeLevel, lastPitch);

} else if (exportOption === 'remove') {
const length = originalBuffer.length - (endSample - startSample);
const cut = new AudioContext().createBuffer(
  originalBuffer.numberOfChannels,
  length,
  sampleRate
);

for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
  const original = originalBuffer.getChannelData(i);
  const channel = cut.getChannelData(i);
  const before = original.slice(0, startSample);
  const after = original.slice(endSample);
  channel.set(before);
  channel.set(after, before.length);
}

outputBuffer = resampleBuffer(cut, speedValue, volumeLevel, lastPitch);
}

const wavBlob = bufferToWavBlob(outputBuffer);
const audioUrl = URL.createObjectURL(wavBlob);

document.getElementById('trimmedTitle').style.display = 'block';
const section = document.getElementById('trimmedSection');
const id = 'clip_' + Date.now();

const html = `
<div id="${id}" style="border:1px solid #ccc; padding:15px; margin-bottom:10px; border-radius:10px;">
  <audio controls src="${audioUrl}" style="width:90%;"></audio><br>
  <button onclick="downloadClip('${audioUrl}')">Download</button>
  <button onclick="document.getElementById('${id}').remove()">Delete</button>
</div>
`;
section.insertAdjacentHTML('beforeend', html);
});


function bufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArray = new ArrayBuffer(length),
        view = new DataView(bufferArray),
        channels = [],
        sampleRate = buffer.sampleRate,
        bitDepth = 16;

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  let offset = 0;
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numOfChan, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numOfChan * bitDepth / 8, true); offset += 4;
  view.setUint16(offset, numOfChan * bitDepth / 8, true); offset += 2;
  view.setUint16(offset, bitDepth, true); offset += 2;
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, length - offset - 4, true); offset += 4;

  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let interleaved = new Float32Array(buffer.length * numOfChan);
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      interleaved[i * numOfChan + ch] = channels[ch][i];
    }
  }

  let index = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    index += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

            // Get all icon-only toolbar buttons
    document.querySelectorAll('.toolbar-btn.icon-only').forEach((button, index) => {
        button.addEventListener('click', () => {
        document.getElementById('customSliderContainer').style.display = 'block';

        if (index === 1) { // Assuming 2nd icon-only button is "Speed"
        sliderMode = 'speed';   
            document.getElementById('myRange').min = 10;
            document.getElementById('myRange').max = 200;
            document.getElementById('myRange').value = lastSpeed;
            document.getElementById('volumeDisplay').textContent = `${(lastSpeed / 100).toFixed(1)}x`;
        } 
        else if (index === 2) { // Pitch
            sliderMode = 'pitch';
            document.getElementById('customSliderContainer').style.display = 'none';
            document.getElementById('pitchSliderContainer').style.display = 'block';
            document.getElementById('pitchSlider').value = lastPitch;
            document.getElementById('pitchDisplay').textContent = `${lastPitch}%`;
        }

        else {
            sliderMode = 'volume';
            document.getElementById('myRange').min = 0;
            document.getElementById('myRange').max = 200;
            document.getElementById('myRange').value = lastVolume;
            document.getElementById('volumeDisplay').textContent = `${lastVolume}%`;
        }
    });
    });


// Hide slider when Trim button is clicked
document.querySelector('.toolbar-btn:not(.icon-only)').addEventListener('click', () => {
document.getElementById('customSliderContainer').style.display = 'none';
});

function resampleBuffer(buffer, speed, volumeLevel, pitchPercent) {
const channels = buffer.numberOfChannels;
const pitchFactor = Math.pow(2, pitchPercent*12 / 1200); // 1200 cents = 1 octave
const totalSpeed = speed * pitchFactor;
const length = Math.floor(buffer.length / totalSpeed);
const sampleRate = buffer.sampleRate;
const resampled = new AudioContext().createBuffer(channels, length, sampleRate);

for (let i = 0; i < channels; i++) {
const input = buffer.getChannelData(i);
const output = resampled.getChannelData(i);

for (let j = 0; j < length; j++) {
  const idx = j * totalSpeed;
  const before = Math.floor(idx);
  const after = Math.ceil(idx);
  const frac = idx - before;

  if (after < input.length) {
    output[j] = ((1 - frac) * input[before] + frac * input[after]) * volumeLevel;
  } else {
    output[j] = (input[before] || 0) * volumeLevel;
  }
}
}

return resampled;
}



function downloadClip(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trimmed_audio.wav';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


