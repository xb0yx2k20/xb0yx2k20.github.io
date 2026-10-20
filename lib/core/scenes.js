(function () {
'use strict';
var U = Card.util;
var $ = U.$, $$ = U.$$, el = U.el, clamp = U.clamp;
var pins = [];
var docMax = 1, lastY = -1;
var progressFill, chromeNum, chromeWrap, currentScene = null;
function chrome() {
var header = el('header', 'chrome',
'<div class="chrome__label"><span class="chrome__num">01</span><span class="chrome__rule"></span>' +
'<span class="chrome__title-wrap"></span></div>');
header.setAttribute('aria-hidden', 'true');
var close = el('button', 'close', '<span class="close__x" aria-hidden="true"></span><span class="close__label">Закрыть</span>');
close.type = 'button';
close.setAttribute('aria-label', 'Закрыть открытку');
var closer = el('div', 'closer', '<div class="closer__half closer__half--top"></div><div class="closer__half closer__half--bottom"></div><div class="closer__seam"></div>');
var progress = el('div', 'progress', '<span class="progress__fill"></span>');
var sound = el('button', 'sound', '<span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound__label">Звук</span>');
sound.type = 'button';
sound.setAttribute('aria-label', 'Звук');
[header, close, closer, progress, sound].forEach(function (n) { document.body.appendChild(n); });
progressFill = $('.progress__fill', progress);
chromeNum = $('.chrome__num', header);
chromeWrap = $('.chrome__title-wrap', header);
Card.sound.bind(sound);
var label = $('.close__label', close), armTimer = 0;
close.addEventListener('click', function () {
if (!close.classList.contains('is-armed')) {
close.classList.add('is-armed');
label.textContent = 'Закрыть?';
clearTimeout(armTimer);
armTimer = setTimeout(function () { close.classList.remove('is-armed'); label.textContent = 'Закрыть'; }, 3000);
return;
}
Card.gate.exit();
});
}
function setLabel(scene) {
if (scene === currentScene) return;
currentScene = scene;
chromeNum.textContent = scene.dataset.num;
$$('.chrome__title:not(.is-above)', chromeWrap).forEach(function (old) {
old.classList.add('is-above');
setTimeout(function () { old.remove(); }, 1100);
});
var next = el('span', 'chrome__title is-below');
next.textContent = scene.dataset.title || '';
chromeWrap.appendChild(next);
requestAnimationFrame(function () { requestAnimationFrame(function () { next.classList.remove('is-below'); }); });
Card.emit('scene', +scene.dataset.index);
}
function measure() {
docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
var y = window.scrollY;
pins.forEach(function (p) {
p.top = p.el.getBoundingClientRect().top + y;
p.len = Math.max(1, p.el.offsetHeight - p.stage.offsetHeight);
p.last = -1;
});
lastY = -1;
}
function update() {
var y = window.scrollY;
if (y !== lastY) {
lastY = y;
progressFill.style.transform = 'scaleY(' + clamp(y / docMax).toFixed(4) + ')';
U.root.classList.toggle('is-scrolled', y > 40);
pins.forEach(function (p) {
var v = clamp((y - p.top) / p.len, -0.2, 1);
if (v === p.last) return;
p.last = v;
p.fn(v);
});
}
}
function frame() {
update();
requestAnimationFrame(frame);
}
Card.scenes = {
pin: function (section, fn) {
section.style.setProperty('--pin', section.getAttribute('data-pin'));
pins.push({ el: section, stage: $('.stage', section), top: 0, len: 1, last: -1, fn: fn });
},
start: function () {
chrome();
var reveal = new IntersectionObserver(function (entries) {
entries.forEach(function (e) {
if (!e.isIntersecting) return;
e.target.classList.add('is-in');
reveal.unobserve(e.target);
});
}, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
$$('[data-reveal]').forEach(function (n) { reveal.observe(n); });
var label = new IntersectionObserver(function (entries) {
entries.forEach(function (e) { if (e.isIntersecting) setLabel(e.target); });
}, { rootMargin: '-49% 0px -50% 0px' });
var live = new IntersectionObserver(function (entries) {
entries.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); });
});
$$('.scene').forEach(function (s) { label.observe(s); live.observe(s); });
var t = 0;
window.addEventListener('resize', function () {
clearTimeout(t);
t = setTimeout(function () {
if (Card.viewport.changed()) Card.viewport.lock();
measure();
}, 160);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
window.addEventListener('load', measure);
measure();
requestAnimationFrame(frame);
},
unlockScroll: function () {
U.root.classList.remove('is-locked');
U.root.classList.add('is-scroll');
measure();
},
measure: measure,
update: update,
splitWords: function (node) {
var out = [];
(function walk(n) {
Array.prototype.slice.call(n.childNodes).forEach(function (c) {
if (c.nodeType === 3) {
var frag = document.createDocumentFragment();
c.textContent.split(/([ \t\r\n]+)/).forEach(function (p) {
if (!p) return;
if (/^[ \t\r\n]+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
var s = el('span', 'w');
s.textContent = p;
frag.appendChild(s);
out.push(s);
});
n.replaceChild(frag, c);
} else if (c.nodeType === 1 && c.tagName !== 'BR') {
walk(c);
}
});
})(node);
return out;
}
};
})();
