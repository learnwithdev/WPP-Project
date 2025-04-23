let wavesurfer1, wavesurfer2, outputWavesurfer;
let audioBuffer1, audioBuffer2, outputBuffer;
const ac = new AudioContext();

function initWaveSurfer(containerId) {
  return WaveSurfer.create({
    container: containerId,
    waveColor: '#5555ff',
    progressColor: '#00ffff',
    cursorColor: '#ff00ff',
    backgroundColor: '#0e0e1f',
    responsive: true,
    height: 140
  });
}

function createWavBlobFromBuffer(buffer) {
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

function loadAudio(fileInput, callback) {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    ac.decodeAudioData(reader.result, callback);
  };
  reader.readAsArrayBuffer(file);
}

function mergeOrAppendBuffers(buffers, mode = 'append') {
  const channels = Math.max(buffers[0].numberOfChannels, buffers[1].numberOfChannels);
  const sampleRate = buffers[0].sampleRate;

  if (mode === 'append') {
    const totalLength = buffers[0].length + buffers[1].length;
    const newBuffer = ac.createBuffer(channels, totalLength, sampleRate);

    for (let c = 0; c < channels; c++) {
      const channel = newBuffer.getChannelData(c);
      const ch1 = buffers[0].getChannelData(Math.min(c, buffers[0].numberOfChannels - 1));
      const ch2 = buffers[1].getChannelData(Math.min(c, buffers[1].numberOfChannels - 1));
      channel.set(ch1);
      channel.set(ch2, ch1.length);
    }
    return newBuffer;
  }

  const merged = mergeBuffers(buffers, channels, sampleRate);
  return normalizeBuffer(merged);
}

function mergeBuffers(buffers, channels, sampleRate) {
  const length = Math.max(buffers[0].length, buffers[1].length);
  const newBuffer = ac.createBuffer(channels, length, sampleRate);

  for (let c = 0; c < channels; c++) {
    const channel = newBuffer.getChannelData(c);
    const ch1 = buffers[0].getChannelData(Math.min(c, buffers[0].numberOfChannels - 1));
    const ch2 = buffers[1].getChannelData(Math.min(c, buffers[1].numberOfChannels - 1));

    for (let i = 0; i < length; i++) {
      const val1 = ch1[i % ch1.length] || 0;
      const val2 = ch2[i % ch2.length] || 0;
      channel[i] = (val1 + val2) / 2;
    }
  }

  return newBuffer;
}

function normalizeBuffer(buffer) {
  const channels = buffer.numberOfChannels;

  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      max = Math.max(max, Math.abs(data[i]));
    }
    if (max > 0) {
      const normalizationFactor = 1 / max;
      for (let i = 0; i < data.length; i++) {
        data[i] *= normalizationFactor;
      }
    }
  }

  return buffer;
}

['audio1', 'audio2'].forEach((id, index) => {
  document.getElementById(id).addEventListener('change', () => {
    loadAudio(document.getElementById(id), (buffer) => {
      if (index === 0) {
        audioBuffer1 = buffer;
        if (wavesurfer1) wavesurfer1.destroy();
        wavesurfer1 = initWaveSurfer('#waveform1');
        wavesurfer1.loadBlob(new Blob([createWavBlobFromBuffer(audioBuffer1)]));
      } else {
        audioBuffer2 = buffer;
        if (wavesurfer2) wavesurfer2.destroy();
        wavesurfer2 = initWaveSurfer('#waveform2');
        wavesurfer2.loadBlob(new Blob([createWavBlobFromBuffer(audioBuffer2)]));
      }
    });
  });
});

document.getElementById('processBtn').addEventListener('click', () => {
  if (!audioBuffer1 || !audioBuffer2) return;
  const mode = document.getElementById('operation').value;
  outputBuffer = mergeOrAppendBuffers([audioBuffer1, audioBuffer2], mode);
  const wavBlob = createWavBlobFromBuffer(outputBuffer);

  if (outputWavesurfer) outputWavesurfer.destroy();
  outputWavesurfer = initWaveSurfer('#waveformOutput');
  outputWavesurfer.loadBlob(wavBlob);

  document.getElementById('downloadOutput').style.display = 'inline-block';
  document.getElementById('downloadOutput').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(wavBlob);
    a.download = `${mode}_audio.wav`;
    a.click();
  };
});

['play1', 'play2', 'playOutput'].forEach((btnId, i) => {
  document.getElementById(btnId).addEventListener('click', () => {
    const wf = i === 0 ? wavesurfer1 : i === 1 ? wavesurfer2 : outputWavesurfer;
    if (wf) wf.playPause();
  });
});