const liveVideo = document.getElementById("liveVideo");
const replayVideo = document.getElementById("replayVideo");
const scrubber = document.getElementById("scrubber");
const log = document.getElementById("eventLog");

let mediaRecorder;
let chunks = [];
const bufferDuration = 20;
let startTime = Date.now();
let half = 1;

// CAMERA FEED
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
  liveVideo.srcObject = stream;
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  mediaRecorder.ondataavailable = e => {
    chunks.push({ time: Date.now(), blob: e.data });
    const cutoff = Date.now() - bufferDuration * 1000;
    chunks = chunks.filter(c => c.time >= cutoff);
  };

  mediaRecorder.start(1000);
});

// REPLAY BUILD
function updateReplay(secondsAgo) {
  const cutoffTime = Date.now() - (bufferDuration - secondsAgo) * 1000;
  const selected = chunks.filter(c => c.time >= cutoffTime);
  const blob = new Blob(selected.map(c => c.blob), { type: "video/webm" });
  replayVideo.src = URL.createObjectURL(blob);
  replayVideo.play();
}

scrubber.addEventListener("input", () => {
  updateReplay(parseFloat(scrubber.value));
});

function setSpeed(rate) {
  replayVideo.playbackRate = rate;
}

// CLOCK
setInterval(() => {
  let elapsed = Math.floor((Date.now() - startTime) / 1000);
  let mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  let secs = String(elapsed % 60).padStart(2, "0");
  document.getElementById("gameClock").textContent = `${mins}:${secs}`;
}, 1000);

// POSSESSION (demo animation)
setInterval(() => {
  let home = Math.floor(Math.random() * 100);
  document.getElementById("homePossession").style.width = home + "%";
  document.getElementById("awayPossession").style.width = (100 - home) + "%";
}, 3000);

// EVENTS
function logEvent(text) {
  const time = document.getElementById("gameClock").textContent;
  log.innerHTML = `<div>[${time}] ${text}</div>` + log.innerHTML;
}

// GOALS
function goal(team) {
  const el = document.getElementById(team + "Score");
  el.textContent = parseInt(el.textContent) + 1;
  logEvent(`⚽ GOAL for ${team.toUpperCase()}!`);
  updateReplay(5); // auto replay last 5 sec
}

// CARDS
function card(team, type) {
  const id = team + (type === "yellow" ? "Yellow" : "Red");
  const el = document.getElementById(id);
  el.textContent = parseInt(el.textContent) + 1;
  logEvent(`${type === "yellow" ? "🟨" : "🟥"} ${type} card for ${team.toUpperCase()}`);
}

// HALF SWITCH
function nextHalf() {
  half++;
  document.getElementById("halfLabel").textContent =
    half === 2 ? "2nd Half" : half === 3 ? "Extra Time" : "Finished";
  startTime = Date.now();
  logEvent("⏱ Start of " + document.getElementById("halfLabel").textContent);
}
