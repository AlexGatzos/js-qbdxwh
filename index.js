/**
 * Loosely based on an example from:
 * http://onlinetonegenerator.com/pitch-shifter.html
 */

// This is pulling SoundTouchJS from the local file system. See the README for proper usage.
import { PitchShifter } from 'soundtouchjs';

const record = document.getElementById('record');

if (navigator.mediaDevices) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);

      // visualize(stream);
      let isRecording = false;
      record.onclick = () => {
        if (!isRecording) {
          isRecording = true;
          mediaRecorder.start();
          record.innerText = 'Stop Recording';
          console.log(mediaRecorder.state);
          console.log('recorder started');
          record.style.background = 'red';
          record.style.color = 'black';
        } else {
          mediaRecorder.stop();
          isRecording = false;
          record.innerText = 'Record';
          console.log(mediaRecorder.state);
          console.log('recorder stopped');
          record.style.background = '';
          record.style.color = '';
        }
      };

      mediaRecorder.onstop = (e) => {
        console.log('data available after MediaRecorder.stop() called.');

        // const clipName = prompt("Enter a name for your sound clip");

        // const clipContainer = document.createElement("article");
        // const clipLabel = document.createElement("p");
        // const audio = document.createElement("audio");
        // const deleteButton = document.createElement("button");

        // clipContainer.classList.add("clip");
        // audio.setAttribute("controls", "");
        // deleteButton.textContent = "Delete";
        // clipLabel.textContent = clipName;

        // clipContainer.appendChild(audio);
        // clipContainer.appendChild(clipLabel);
        // clipContainer.appendChild(deleteButton);
        // soundClips.appendChild(clipContainer);

        // audio.controls = true;
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        chunks = [];
        const audioURL = URL.createObjectURL(blob);

        loadSource(audioURL);
        // audio.src = audioURL;
        console.log('recorder stopped');

        // deleteButton.onclick = (e) => {
        //   const evtTgt = e.target;
        //   evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
        // };
      };

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
    })
    .catch((err) => {
      console.error(`The following error occurred: ${err}`);
    });
}

const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const tempoSlider = document.getElementById('tempoSlider');
const tempoOutput = document.getElementById('tempo');
tempoOutput.innerHTML = tempoSlider.value;
const pitchSlider = document.getElementById('pitchSlider');
const pitchOutput = document.getElementById('pitch');
pitchOutput.innerHTML = pitchSlider.value;
const keySlider = document.getElementById('keySlider');
const keyOutput = document.getElementById('key');
keyOutput.innerHTML = keySlider.value;
const volumeSlider = document.getElementById('volumeSlider');
const volumeOutput = document.getElementById('volume');
volumeOutput.innerHTML = volumeSlider.value;
const currTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const progressMeter = document.getElementById('progressMeter');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();
let shifter;

const loadSource = function (url) {
  playBtn.setAttribute('disabled', 'disabled');
  if (shifter) {
    shifter.off();
  }
  fetch(url)
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      console.log('have array buffer');
      audioCtx.decodeAudioData(buffer, (audioBuffer) => {
        console.log('decoded the buffer');
        shifter = new PitchShifter(audioCtx, audioBuffer, 16384);
        shifter.tempo = tempoSlider.value;
        shifter.pitch = pitchSlider.value;
        shifter.on('play', (detail) => {
          console.log(`timeplayed: ${detail.timePlayed}`);
          currTime.innerHTML = detail.formattedTimePlayed;
          progressMeter.value = detail.percentagePlayed;
        });
        duration.innerHTML = shifter.formattedDuration;
        playBtn.removeAttribute('disabled');
      });
    });
};

let is_playing = false;
const play = function () {
  shifter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  audioCtx.resume().then(() => {
    is_playing = true;
    this.setAttribute('disabled', 'disabled');
  });
};

const pause = function (playing = false) {
  shifter.disconnect();
  is_playing = playing;
  playBtn.removeAttribute('disabled');
};

playBtn.onclick = play;
stopBtn.onclick = pause;

tempoSlider.addEventListener('input', function () {
  tempoOutput.innerHTML = shifter.tempo = this.value;
});

pitchSlider.addEventListener('input', function () {
  pitchOutput.innerHTML = shifter.pitch = this.value;
  shifter.tempo = tempoSlider.value;
});

keySlider.addEventListener('input', function () {
  shifter.pitchSemitones = this.value;
  keyOutput.innerHTML = this.value / 2;
  shifter.tempo = tempoSlider.value;
});

volumeSlider.addEventListener('input', function () {
  volumeOutput.innerHTML = gainNode.gain.value = this.value;
});

progressMeter.addEventListener('click', function (event) {
  const pos = event.target.getBoundingClientRect();
  const relX = event.pageX - pos.x;
  const perc = relX / event.target.offsetWidth;
  pause(is_playing);
  shifter.percentagePlayed = perc;
  progressMeter.value = 100 * perc;
  currTime.innerHTML = shifter.timePlayed;
  if (is_playing) {
    play();
  }
});
