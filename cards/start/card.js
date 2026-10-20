(function () {
'use strict';
var U = Card.util;
var $ = U.$, el = U.el;
var STARS = [0.52, 0.7, 9];
var sfx = (function () {
var AC = window.AudioContext || window.webkitAudioContext, ac = null, pad = null;
var SCALE = [783.99, 880, 987.77, 1174.66, 1318.51, 1567.98, 1760, 1975.53];
function ctx() { if (!AC || !Card.sound.on) return null; ac = ac || new AC(); if (ac.state === 'suspended') ac.resume(); return ac; }
function note(f, vol, when) {
var a = ctx(); if (!a) return;
var t = a.currentTime + (when || 0);
[[1, 1], [2.01, 0.35], [3.98, 0.12]].forEach(function (h) {
var o = a.createOscillator(), g = a.createGain();
o.type = 'sine'; o.frequency.value = f * h[0];
g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * h[1], t + 0.008);
g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8 / h[0] + 0.4);
o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 2.4);
});
}
return {
note: function (i, vol, when) { note(SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length], vol || 0.035, when); },
phrase: function (notes, step) { notes.forEach(function (n, k) { note(SCALE[n % SCALE.length], 0.03, k * (step || 0.22)); }); },
pad: function (on) {
var a = ctx(); if (!a) return;
if (!pad) {
var g = a.createGain(), f = a.createBiquadFilter();
f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0;
[196, 293.66, 392.5].forEach(function (hz) { var o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = hz; o.detune.value = (Math.random() - 0.5) * 8; o.connect(f); o.start(); });
f.connect(g); g.connect(a.destination);
pad = g;
}
pad.gain.setTargetAtTime(on ? 0.018 : 0, a.currentTime, on ? 0.6 : 0.9);
}
};
})();
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {  } }
Card.play = function (secret, pub) {
var root = U.root, lines = secret.lines || [], inv = secret.invite || {};
var hold = el('div', 'hold');
var list = el('div', 'lines', lines.map(function (l) { return '<p class="ln">' + U.fmt(l.text) + '</p>'; }).join(''));
var ring = el('div', 'pedal',
'<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="pedal__track" cx="32" cy="32" r="31"/>' +
'<circle class="pedal__fill" cx="32" cy="32" r="31" pathLength="1"/></svg>' +
'<span class="pedal__core"></span><span class="pedal__label">Подержи палец</span>');
var details = [['Когда', inv.when], ['Где', inv.place]].filter(function (d) { return d[1]; });
var il = inv.lines || [], answers = inv.answers || [{ text: 'Я в деле', reply: 'Тогда до завтра.' }];
var invite = el('div', 'invite',
'<div class="invite__card">' +
'<p class="invite__kicker">' + U.fmt(inv.kicker || 'Приглашение') + '</p>' +
'<span class="invite__ribbon" aria-hidden="true"></span>' +
il.map(function (l, i) { return '<p class="il il--' + (i === 0 ? 'lead' : i === 1 ? 'key' : 'tail') + '">' + U.fmt(l) + '</p>'; }).join('') +
(details.length ? '<dl class="invite__dl">' + details.map(function (d) { return '<div><dt>' + d[0] + '</dt><dd>' + U.fmt(d[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
'<div class="invite__btns">' +
answers.map(function (a, i) { return '<button class="ib" type="button" data-i="' + i + '">' + U.fmt(a.text) + '</button>'; }).join('') +
'</div>' +
'<p class="invite__reply" aria-live="polite"></p>' +
'</div>');
[hold, list, ring, invite].forEach(function (n) { document.body.appendChild(n); });
var seal = el('div', 'seal-row');
invite.appendChild(seal);
Card.lux.sealLink(seal, { monogram: secret.monogram || '✦', to: secret.to ? 'для ' + secret.to : '' });
var lineEls = U.$$('.ln', list), fill = $('.pedal__fill', ring), label = $('.pedal__label', ring);
var p = 0, holding = false, shown = 0, lit = 0, done = false, last = 0, raf = 0, timers = [];
var seconds = secret.holdSeconds || 16;
var rose = null, orchids = [], figure = null;
function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
function render() {
fill.style.strokeDashoffset = (1 - p).toFixed(4);
if (Card.three && Card.three.ready) Card.three.progress('sky', p);
root.classList.toggle('is-rising', p >= 0.28);
while (shown < lines.length && p >= lines[shown].at) {
for (var k = 0; k < shown; k++) lineEls[k].classList.add('is-past');
lineEls[shown].classList.add('is-in');
if (shown > 0) { sfx.phrase(shown === 1 ? [0, 2, 4] : [4, 2, 5, 7], 0.2); if (holding) buzz(10); }
shown++;
}
var n = Math.floor(U.clamp((p - STARS[0]) / (STARS[1] - STARS[0])) * STARS[2]);
while (lit < n) { sfx.note(lit, 0.028); lit++; }
if (p >= 1 && !done) finish();
}
function loop(now) {
raf = 0;
var dt = Math.min(0.1, (now - last) / 1000);
last = now;
if (holding && p < 1) {
p = Math.min(1, p + dt / seconds);
render();
}
if (holding) raf = requestAnimationFrame(loop);
}
function excite(v) {
orchids.forEach(function (o) { o.excite(v); });
}
function down(e) {
if (done || !root.classList.contains('is-ready')) return;
if (e.target.closest && e.target.closest('button')) return;
holding = true;
root.classList.add('is-holding');
excite(1); sfx.pad(true);
label.textContent = p < 0.3 ? 'Ещё' : p < 0.62 ? 'Смотри на блёстки' : 'Почти';
last = performance.now();
if (!raf) raf = requestAnimationFrame(loop);
}
function up() {
if (!holding) return;
holding = false;
root.classList.remove('is-holding');
excite(0); sfx.pad(false);
if (!done) label.textContent = p > 0 ? 'Звёзды ждут' : 'Подержи палец';
}
hold.addEventListener('pointerdown', down);
window.addEventListener('pointerup', up);
window.addEventListener('pointercancel', up);
hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
document.addEventListener('visibilitychange', function () { if (document.hidden) up(); });
function finish() {
done = true;
up();
root.classList.add('is-full');
if (figure) figure.finale(1);
sfx.phrase([0, 2, 4, 7, 4, 5, 7], 0.24);
later(function () {
root.classList.add('is-invite');
hold.style.pointerEvents = 'none';
Card.emit('end', true);
}, 2200);
}
U.$$('.ib', invite).forEach(function (b) {
b.addEventListener('click', function () {
if (invite.classList.contains('is-answered') && !inv.telegram) return;
var a = answers[+b.getAttribute('data-i')] || answers[0];
Card.notify((pub && pub.notify) || secret.notify, 'answer-' + b.getAttribute('data-i'), '✨ Ответ: «' + a.text + '»', 60 * 1000);
invite.classList.add('is-answered');
b.classList.add('is-picked');
$('.invite__reply', invite).innerHTML = U.fmt(a.reply || '');
sfx.phrase([4, 5, 7, 9], 0.14);
buzz(16);
if (inv.telegram) {
var url = 'https://t.me/' + encodeURIComponent(inv.telegram.replace(/^@/, ''));
setTimeout(function () { window.location.href = url; }, 350);
}
});
});
var ready = (async function () {
var ok = secret.world && Card.three && await Card.three.init(secret.world, secret);
if (!ok) { root.classList.add('no-3d'); return; }
Card.three.activate('sky');
rose = Card.three.get('sky', 'rose');
orchids = Card.three.all('sky', 'orchid');
figure = Card.three.get('sky', 'constellation');
Card.three.progress('sky', 0);
})();
Card.on('reset', function () {
timers.forEach(clearTimeout); timers = [];
p = 0; shown = 0; lit = 0; holding = false; done = false;
['is-ready', 'is-holding', 'is-rising', 'is-full', 'is-invite'].forEach(function (c) { root.classList.remove(c); });
lineEls.forEach(function (l) { l.classList.remove('is-in', 'is-past'); });
invite.classList.remove('is-answered');
U.$$('.ib', invite).forEach(function (b) { b.classList.remove('is-picked'); });
$('.invite__reply', invite).textContent = '';
label.textContent = 'Подержи палец';
hold.style.pointerEvents = '';
if (Card.three && Card.three.ready) Card.three.reset('sky');
render();
});
Card.start = { set: function (v) { p = U.clamp(v); render(); }, get p() { return p; } };
return {
start: async function () {
await ready;
render();
later(function () { root.classList.add('is-ready'); }, 1400);
}
};
};
})();
