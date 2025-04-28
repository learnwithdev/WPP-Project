let audioContext, analyser, source, buffer = null;

    document.getElementById("audio-upload").addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.decodeAudioData(evt.target.result, decoded => {
          buffer = decoded;
        });
      };
      reader.readAsArrayBuffer(file);
    });

    document.getElementById("visualizeBtn").addEventListener("click", () => {
      if (!buffer) return alert("Upload an audio file first.");
      const canvas = document.getElementById("visualCanvas");
      const ctx = canvas.getContext("2d");
      canvas.style.display = "block";

      if (source) source.stop();

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      source.loop = true;
      source.start();

      const type = document.getElementById("visualizationType").value;

      function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (type) {
          case "bars":
            let x = 0;
            const barWidth = (canvas.width / dataArray.length) * 2.5;
            for (let i = 0; i < dataArray.length; i++) {
              ctx.fillStyle = `hsl(${i * 2}, 100%, 50%)`;
              ctx.fillRect(x, canvas.height - dataArray[i], barWidth, dataArray[i]);
              x += barWidth + 1;
            }
            break;
          case "waveform":
            ctx.beginPath();
            for (let i = 0; i < dataArray.length; i++) {
              const x = (i / dataArray.length) * canvas.width;
              const y = canvas.height / 2 + Math.sin(i * 0.1) * dataArray[i] * 0.5;
              ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "#0ff";
            ctx.stroke();
            break;
          case "lines":
            ctx.beginPath();
            for (let i = 0; i < dataArray.length; i++) {
              const x = (i / dataArray.length) * canvas.width;
              const y = canvas.height - dataArray[i];
              ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "#f0f";
            ctx.stroke();
            break;
          case "boxplot":
            for (let i = 0; i < dataArray.length; i++) {
              const h = dataArray[i];
              const x = i * 4;
              ctx.fillStyle = "rgba(255, 20, 147, 0.7)";
              ctx.fillRect(x, canvas.height / 2 - h / 2, 3, h);
            }
            break;
          case "mirror":
            ctx.beginPath();
            for (let i = 0; i < dataArray.length; i++) {
              const x = (i / dataArray.length) * canvas.width;
              const y = canvas.height / 2 + Math.sin(i * 0.15) * dataArray[i] * 0.4;
              ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "magenta";
            ctx.stroke();
            ctx.beginPath();
            for (let i = 0; i < dataArray.length; i++) {
              const x = (i / dataArray.length) * canvas.width;
              const y = canvas.height / 2 - Math.sin(i * 0.15) * dataArray[i] * 0.4;
              ctx.lineTo(x, y);
            }
            ctx.stroke();
            break;
          case "glow":
            ctx.shadowColor = "#f0f";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            for (let i = 0; i < dataArray.length; i++) {
              const x = (i / dataArray.length) * canvas.width;
              const y = canvas.height / 2 + Math.sin(i * 0.1) * dataArray[i] * 0.5;
              ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "#f0f";
            ctx.stroke();
            ctx.shadowBlur = 0;
            break;
          case "spectrum":
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            for (let i = 0; i < dataArray.length; i++) {
              const x = (i / dataArray.length) * canvas.width;
              const y = canvas.height - dataArray[i];
              ctx.lineTo(x, y);
            }
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fillStyle = "#8e2de2";
            ctx.fill();
            break;
          case "dots":
            for (let i = 0; i < dataArray.length; i++) {
              const x = i * 6;
              ctx.beginPath();
              ctx.arc(x, canvas.height - dataArray[i], 3, 0, 2 * Math.PI);
              ctx.fillStyle = "orange";
              ctx.fill();
            }
            break;
          case "pulse":
            for (let i = 0; i < dataArray.length; i++) {
              ctx.fillStyle = "#ff3cac";
              ctx.fillRect(i * 5, 0, 3, canvas.height);
            }
            break;
          case "rainbow":
            for (let i = 0; i < 5; i++) {
              ctx.beginPath();
              for (let j = 0; j < dataArray.length; j++) {
                const x = (j / dataArray.length) * canvas.width;
                const y = canvas.height / 2 + Math.sin(j * 0.2 + i) * dataArray[j] * 0.2;
                ctx.lineTo(x, y);
              }
              ctx.strokeStyle = `hsl(${i * 60}, 100%, 60%)`;
              ctx.stroke();
            }
            break;
          case "circle":
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            for (let r = 0; r < 5; r++) {
              ctx.beginPath();
              for (let i = 0; i < dataArray.length; i++) {
                const angle = (i / dataArray.length) * 2 * Math.PI;
                const radius = 50 + r * 20 + dataArray[i] * 0.2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.strokeStyle = `hsl(${r * 60}, 100%, 50%)`;
              ctx.stroke();
            }
            break;
          case "blob":
            ctx.beginPath();
            for (let i = 0; i < dataArray.length; i++) {
              const x = (i / dataArray.length) * canvas.width;
              const y = canvas.height / 2 + Math.sin(i * 0.1) * dataArray[i] * 0.6;
              ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "#0ff";
            ctx.lineWidth = 3;
            ctx.stroke();
            break;
        }
      }

      draw();
    });

    document.getElementById("saveImageBtn").addEventListener("click", () => {
      const canvas = document.getElementById("visualCanvas");
      const link = document.createElement("a");
      link.download = "audio-visual.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
