(function () {
'use strict';
var AC = window.AudioContext || window.webkitAudioContext;
var ctx = null, master = null, bus = null;
var running = false, mood = 'normal', chimeTimer = 0, synthBuilt = false;
var audio = null, trackOk = false, trackWired = false;
var buttons = [];
var LEVELS = { synth: { normal: 0.15, end: 0.06 }, track: { normal: 0.85, end: 0.4 } };
var PAD = [73.42, 110.0, 146.83, 164.81, 220.0, 277.18, 329.63];
var BELLS = [587.33, 659.25, 739.99, 880.0, 987.77, 1108.73];
function playingTrack() { return trackOk && audio; }
function level() { return LEVELS[playingTrack() ? 'track' : 'synth'][mood]; }
function ensure() {
if (ctx) return;
ctx = new AC();
master = ctx.createGain();
master.gain.value = 0;
master.connect(ctx.destination);
}
function buildSynth() {
if (synthBuilt) return;
synthBuilt = true;
bus = ctx.createBiquadFilter();
bus.type = 'lowpass';
bus.frequency.value = 1300;
bus.Q.value = 0.4;
bus.connect(master);
var delay = ctx.createDelay(2), fb = ctx.createGain(), tone = ctx.createBiquadFilter(), wet = ctx.createGain();
delay.delayTime.value = 0.46; fb.gain.value = 0.42; tone.type = 'lowpass'; tone.frequency.value = 1600; wet.gain.value = 0.4;
bus.connect(delay); delay.connect(tone); tone.connect(fb); fb.connect(delay); tone.connect(wet); wet.connect(master);
var sweep = ctx.createOscillator(), depth = ctx.createGain();
sweep.frequency.value = 0.021; depth.gain.value = 420;
sweep.connect(depth); depth.connect(bus.frequency); sweep.start();
PAD.forEach(function (f, i) {
var voice = ctx.createGain();
var base = 0.085 / (1 + i * 0.32);
voice.gain.value = base;
['sine', 'triangle'].forEach(function (type, k) {
var o = ctx.createOscillator(), g = ctx.createGain();
o.type = type; o.frequency.value = f; o.detune.value = (k ? 6 : -5) + (Math.random() - 0.5) * 5;
g.gain.value = k ? 0.28 : 1;
o.connect(g); g.connect(voice); o.start();
});
var lfo = ctx.createOscillator(), lg = ctx.createGain();
lfo.frequency.value = 0.025 + Math.random() * 0.05; lg.gain.value = base * 0.85;
lfo.connect(lg); lg.connect(voice.gain); lfo.start(ctx.currentTime + Math.random() * 4);
voice.connect(bus);
});
}
function chime() {
if (!running || playingTrack()) return;
var now = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
o.type = 'sine';
o.frequency.value = BELLS[(Math.random() * BELLS.length) | 0];
g.gain.setValueAtTime(0.0001, now);
g.gain.exponentialRampToValueAtTime(0.028, now + 0.04);
g.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);
o.connect(g); g.connect(bus); o.start(now); o.stop(now + 6);
chimeTimer = setTimeout(chime, 5200 + Math.random() * 7000);
}
function fadeTo(v, t) {
master.gain.cancelScheduledValues(ctx.currentTime);
master.gain.setTargetAtTime(v, ctx.currentTime, t);
}
function startSynth() {
buildSynth();
clearTimeout(chimeTimer);
chimeTimer = setTimeout(chime, 2400);
fadeTo(level(), 1.4);
}
function on() {
if (!AC) return;
ensure();
ctx.resume();
running = true;
if (playingTrack()) {
if (!trackWired) {
ctx.createMediaElementSource(audio).connect(master);
trackWired = true;
}
var p = audio.play();
if (p && p.catch) p.catch(function () { trackOk = false; startSynth(); });
fadeTo(level(), 1.1);
} else {
startSynth();
}
}
function off() {
if (!ctx) return;
running = false;
clearTimeout(chimeTimer);
fadeTo(0, 0.35);
setTimeout(function () {
if (running) return;
if (audio) audio.pause();
ctx.suspend();
}, 1800);
}
function render() {
buttons.forEach(function (b) {
b.el.setAttribute('aria-pressed', String(running));
if (b.onText) b.label.innerHTML = running ? b.onText : b.offText;
});
}
function set(state) {
if (state) on(); else off();
render();
}
document.addEventListener('visibilitychange', function () {
if (!ctx || !running) return;
if (document.hidden) { if (audio) audio.pause(); ctx.suspend(); }
else { ctx.resume(); if (playingTrack()) audio.play().catch(function () {}); }
});
Card.sound = {
supported: !!AC,
get on() { return running; },
useTrack: function (url) {
if (!url || audio) return;
audio = new Audio();
audio.loop = true;
audio.preload = 'auto';
audio.addEventListener('error', function () { trackOk = false; audio = null; if (running) startSynth(); }, { once: true });
audio.src = url;
trackOk = true;
},
bind: function (el, opt) {
opt = opt || {};
if (!AC) { el.remove(); return; }
buttons.push({ el: el, label: opt.label, onText: opt.onText, offText: opt.offText });
el.addEventListener('click', function () { set(!running); });
render();
},
set: set,
mood: function (m) { mood = m; if (ctx && running) fadeTo(level(), 2.2); }
};
})();
