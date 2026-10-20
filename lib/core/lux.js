(function () {
'use strict';
var U = Card.util;
function seal(o) {
o = o || {};
var veil = U.el('div', 'lux-seal',
'<div class="lux-seal__mono">' + Card.gate.wax(o.monogram || '·') + '</div>' +
'<p class="lux-seal__text">Запечатано' + (o.to ? ' ' + U.fmt(o.to) : '') + '</p>');
document.body.appendChild(veil);
try {
var AC = window.AudioContext || window.webkitAudioContext;
if (AC && Card.sound.on) {
var ac = new AC(), t = ac.currentTime + 1.2, osc = ac.createOscillator(), g = ac.createGain();
osc.type = 'sine'; osc.frequency.setValueAtTime(140, t); osc.frequency.exponentialRampToValueAtTime(70, t + 0.4);
g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
osc.connect(g); g.connect(ac.destination); osc.start(t); osc.stop(t + 0.7);
}
} catch (e) {  }
requestAnimationFrame(function () { requestAnimationFrame(function () { veil.classList.add('is-on'); }); });
setTimeout(function () { veil.classList.add('is-sealed'); }, 1200);
setTimeout(function () { if (Card.sound.on) Card.sound.set(false); }, 1600);
setTimeout(async function () {
var S = Card.session;
if (!S) { location.reload(); return; }
U.root.classList.remove('is-open');
Card.emit('reset');
try { sessionStorage.setItem('card:' + U.cardId + ':gate-seen', '1'); } catch (e) {  }
var locked = S.ref && !(S.ref.plain && !S.ref.lock);
if (locked) Card.gate.forget();
var opened = Card.gate.mount(S.pub, locked ? S.ref : { plain: S.secret });
requestAnimationFrame(function () {
veil.style.transition = 'opacity 0.9s';
veil.style.opacity = '0';
setTimeout(function () { veil.remove(); }, 950);
});
await opened;
Card.gate.open(function () {
Card.emit('open', S.secret);
if (S.play.start) S.play.start();
});
}, 3600);
}
Card.lux = {
seal: seal,
sealLink: function (parent, o) {
var b = U.el('button', 'lux-seal-link', '<span>Запечатать</span><i aria-hidden="true"></i>');
b.type = 'button';
b.addEventListener('click', function (e) { e.stopPropagation(); b.disabled = true; seal(o); });
parent.appendChild(b);
return b;
}
};
})();
