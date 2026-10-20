(function () {
'use strict';
var U = Card.util;
var $ = U.$, el = U.el, wait = U.wait;
var PASS_KEY = 'card:' + U.cardId + ':pass';
var SEEN_KEY = 'card:' + U.cardId + ':gate-seen';
var DEFAULT_ERRORS = [
'Не то. Загляните в подсказку.',
'Всё ещё нет. Подумайте ещё немного.',
'Посмотрите ещё раз, внимательнее.'
];
var gate, pass, area, mirror, errorEl, openBtn, form, hint, placeholder = 'Пароль';
var waxN = 0;
function wax(letter) {
var pts = [], n = 28, seed = 7;
var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
for (var i = 0; i < n; i++) {
var a = i / n * Math.PI * 2, r = 88 + rnd() * 9 - (i % 7 === 0 ? 6 : 0);
pts.push((100 + Math.cos(a) * r).toFixed(1) + ' ' + (100 + Math.sin(a) * r).toFixed(1));
}
var id = 'wx' + (waxN++), d = 'M' + pts.join(' L') + 'Z';
return '<span class="wax" aria-hidden="true"><svg viewBox="0 0 200 200">' +
'<defs><radialGradient id="' + id + '" cx="0.36" cy="0.3" r="0.8">' +
'<stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.04"/>' +
'<stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient></defs>' +
'<path class="wax__blob" d="' + d + '"/><path d="' + d + '" fill="url(#' + id + ')"/>' +
'<circle class="wax__ring" cx="100" cy="100" r="66"/><circle class="wax__ring wax__ring--hi" cx="100.8" cy="100.8" r="66"/></svg>' +
'<span class="wax__letter">' + U.fmt(letter) + '</span></span>';
}
function tearPath() {
var pts = [], y = 0;
while (y < 100) {
var near = Math.abs(y - 36) < 9;
var x = 50 + (Math.random() - 0.5) * (near ? 3.2 : 5.5);
pts.push([x, y]);
y += near ? 1.2 + Math.random() * 1.6 : 2 + Math.random() * 3.5;
}
pts.push([50 + (Math.random() - 0.5) * 4, 100]);
return pts;
}
function polygon(pts, side, shift) {
var edge = pts.map(function (p) { return 'calc(' + p[0].toFixed(2) + '% + ' + shift + 'px) ' + p[1].toFixed(2) + '%'; });
return side === 'l' ? 'polygon(0 0, ' + edge.join(', ') + ', 0 100%)'
: 'polygon(100% 0, ' + edge.join(', ') + ', 100% 100%)';
}
function clip(v) { return 'clip-path:' + v + ';-webkit-clip-path:' + v; }
function monogram(pub, g, hintHtml) {
var letter = g.monogram || (g.for || '').replace(/^[^А-ЯЁA-Z]*/i, '').charAt(0) || '·';
var path = tearPath();
var half = function (side) {
return '<div class="tear tear--' + side + '"><div class="tear__fray" style="' + clip(polygon(path, side, side === 'l' ? 2.5 : -2.5)) + '"></div>' +
'<div class="tear__face" style="' + clip(polygon(path, side, 0)) + '">' + wax(letter) + '</div></div>';
};
return '' +
half('l') + half('r') +
'<div class="gate__content gate__content--mono">' +
'<div class="mono" aria-hidden="true"></div>' +
'<p class="gate__for">' + U.fmt(g.for || 'Для вас') + '</p>' +
(g.slow ? '<p class="gate__slow">' + U.fmt(g.slow) + '</p>' : '') +
'<form class="gate__form" novalidate autocomplete="off">' +
'<div class="gate__lock">' +
(g.label ? '<p class="gate__label-pass">' + U.fmt(g.label) + '</p>' : '') +
'<div class="pass' + (g.field === 'plate' ? ' pass--plate' : '') + '">' +
(g.field === 'plate' ? '<span class="plate__rus" aria-hidden="true"><i>RUS</i><b></b></span>' : '') +
'<div class="pass__mirror" aria-hidden="true"><span class="pass__ph">' + U.fmt(g.placeholder || 'Пароль') + '</span></div>' +
'<textarea class="pass__input" rows="1" aria-label="Пароль" autocomplete="off" autocapitalize="none" ' +
'autocorrect="off" spellcheck="false" enterkeyhint="go" aria-describedby="gate-hint gate-error" disabled></textarea>' +
'<span class="pass__rule" aria-hidden="true"></span>' +
'<button class="pass__paste" type="button"><span class="pass__paste-icon" aria-hidden="true"></span>' +
'<span>Вставить из&nbsp;буфера</span></button>' +
'</div>' +
'<p class="gate__error" id="gate-error" aria-live="polite"></p>' +
(g.hint && g.hintOpen ? '<p class="hint-open" id="gate-hint"><span>Подсказка</span>' + hintHtml + '</p>' :
g.hint ? '<div class="hint">' +
'<button class="hint__toggle" type="button" aria-expanded="false" aria-controls="gate-hint">Подсказка' +
'<span class="hint__mark" aria-hidden="true"></span></button>' +
'<p class="hint__body" id="gate-hint"><span class="hint__text">' + hintHtml + '</span></p>' +
'</div>' : '') +
'</div>' +
'<div class="gate__choice">' +
'<button class="gate__open" type="submit" data-sound="' + (g.single && g.sound === false ? '0' : '1') + '" disabled><span class="gate__label">' + (g.single ? 'Открыть' : 'Открыть со&nbsp;звуком') + '</span><span class="gate__line" aria-hidden="true"></span></button>' +
(g.single ? '' : '<button class="gate__open gate__open--quiet" type="submit" data-sound="0" disabled><span class="gate__label">в&nbsp;тишине</span></button>') +
'</div>' +
'</form>' +
'</div>';
}
function markup(pub) {
var g = pub.gate || {};
var hintHtml = U.fmt(g.hint || '');
if (g.hintLink && g.hintLinkText) {
hintHtml += ' <a href="' + encodeURI(g.hintLink) + '" target="_blank" rel="noopener">' + U.fmt(g.hintLinkText) + '</a>';
}
if (g.style === 'monogram') return monogram(pub, g, hintHtml);
return '' +
'<div class="gate__half gate__half--top"></div>' +
'<div class="gate__half gate__half--bottom"></div>' +
'<div class="gate__seam" aria-hidden="true"></div>' +
'<div class="gate__content">' +
'<p class="gate__for">' + U.fmt(g.for || 'Для вас.') + '</p>' +
'<p class="gate__slow">' + U.fmt(g.slow || 'Не спешите.') + '</p>' +
'<form class="gate__form" novalidate autocomplete="off">' +
'<div class="gate__lock">' +
'<div class="pass">' +
'<div class="pass__mirror" aria-hidden="true"><span class="pass__ph">Пароль</span></div>' +
'<textarea class="pass__input" rows="1" aria-label="Пароль" autocomplete="off" autocapitalize="none" ' +
'autocorrect="off" spellcheck="false" enterkeyhint="go" aria-describedby="gate-hint gate-error" disabled></textarea>' +
'<span class="pass__rule" aria-hidden="true"></span>' +
'<button class="pass__paste" type="button"><span class="pass__paste-icon" aria-hidden="true"></span>' +
'<span>Вставить из&nbsp;буфера</span></button>' +
'</div>' +
'<p class="gate__error" id="gate-error" aria-live="polite"></p>' +
(g.hint ? '<div class="hint">' +
'<button class="hint__toggle" type="button" aria-expanded="false" aria-controls="gate-hint">Подсказка' +
'<span class="hint__mark" aria-hidden="true"></span></button>' +
'<p class="hint__body" id="gate-hint"><span class="hint__text">' + hintHtml + '</span></p>' +
'</div>' : '') +
'</div>' +
'<button class="gate__open" type="submit" disabled>' +
'<span class="gate__stem" aria-hidden="true"></span>' +
'<span class="gate__ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="31"/></svg>' +
'<span class="gate__dot"></span><span class="gate__pulse"></span></span>' +
'<span class="gate__label">Открыть</span>' +
'</button>' +
'</form>' +
'<button class="gate__sound" type="button" aria-pressed="false">' +
'<span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
'<span class="gate__sound-text">Лучше со&nbsp;звуком</span></button>' +
'</div>';
}
var painted = '';
function paint() {
var v = area.value;
var focused = document.activeElement === area;
var caretAt = focused && area.selectionStart === area.selectionEnd ? area.selectionEnd : -1;
var head = 0;
while (head < v.length && head < painted.length && v[head] === painted[head]) head++;
var tail = 0;
while (tail < v.length - head && tail < painted.length - head &&
v[v.length - 1 - tail] === painted[painted.length - 1 - tail]) tail++;
var freshFrom = head, freshTo = v.length - tail;
painted = v;
var frag = document.createDocumentFragment();
var word = null, wordLen = 0, n = 0;
function caret() { return el('span', 'pass__caret'); }
if (!v) frag.appendChild(focused ? caret() : el('span', 'pass__ph', placeholder));
for (var i = 0; i < v.length;) {
if (i === caretAt) (word || frag).appendChild(caret());
var ch = String.fromCodePoint(v.codePointAt(i));
if (/\s/.test(ch)) {
if (word && wordLen <= 2) { word.appendChild(document.createTextNode(' ')); wordLen = 0; }
else { frag.appendChild(document.createTextNode(' ')); word = null; }
} else {
if (!word) { word = el('span', 'w'); wordLen = 0; frag.appendChild(word); }
wordLen++;
var c = el('span', i >= freshFrom && i < freshTo ? 'c is-new' : 'c');
c.textContent = ch;
c.style.setProperty('--i', n++);
word.appendChild(c);
if (wordLen > 16) word.className = 'w w--long';
}
i += ch.length;
}
if (v && caretAt === v.length) (word || frag).appendChild(caret());
mirror.textContent = '';
mirror.appendChild(frag);
pass.classList.toggle('has-value', v.length > 0);
pass.classList.toggle('is-focused', focused);
pass.classList.toggle('is-long', v.length > 24);
}
function clearError() { gate.classList.remove('is-error'); }
function showError(msg) {
errorEl.textContent = msg;
gate.classList.remove('is-error');
pass.classList.add('is-wrong');
void pass.offsetWidth;
gate.classList.add('is-error');
setTimeout(function () { pass.classList.remove('is-wrong'); }, 450);
}
function wire(pub, resolve, known) {
var errors = (pub.gate && pub.gate.errors) || DEFAULT_ERRORS;
var misses = 0, busy = false;
gate.addEventListener('touchmove', function (e) { if (e.target !== area) e.preventDefault(); }, { passive: false });
area.addEventListener('input', function () {
if (/[\r\n]/.test(area.value)) {
var at = area.selectionEnd;
area.value = area.value.replace(/[\r\n]+/g, ' ');
area.setSelectionRange(at, at);
}
clearError();
paint();
});
['focus', 'blur', 'keyup', 'click'].forEach(function (t) { area.addEventListener(t, paint); });
document.addEventListener('selectionchange', function () { if (document.activeElement === area) paint(); });
area.addEventListener('keydown', function (e) {
if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); attempt(); }
});
var paste = $('.pass__paste', gate);
paste.addEventListener('pointerdown', function (e) { e.preventDefault(); });
paste.addEventListener('click', function () {
function fallback() { area.focus(); showError('Коснитесь поля ещё раз → «Вставить»'); }
if (!(navigator.clipboard && navigator.clipboard.readText && window.isSecureContext)) return fallback();
navigator.clipboard.readText().then(function (t) {
t = (t || '').replace(/[\r\n]+/g, ' ').trim();
if (!t) return showError('Сначала скопируйте пароль.');
area.value = t;
area.dispatchEvent(new Event('input'));
}).catch(fallback);
});
if (hint) {
var toggle = $('.hint__toggle', hint);
toggle.addEventListener('pointerdown', function (e) { if (document.activeElement === area) e.preventDefault(); });
toggle.addEventListener('click', function () {
var open = !hint.classList.contains('is-open');
hint.classList.toggle('is-open', open);
toggle.setAttribute('aria-expanded', String(open));
});
}
form.addEventListener('submit', function (e) { e.preventDefault(); attempt(); });
async function attempt() {
if (busy || openBtn.disabled) return;
if (known) { busy = true; area.blur(); resolve({ secret: known, known: true }); return; }
if (!Card.crypt.available && !(pub.secretRef && pub.secretRef.lock)) { showError('Откройте ссылку через https://'); return; }
if (!Card.crypt.normalize(area.value)) { showError('Сначала — пароль.'); area.focus(); return; }
busy = true;
gate.classList.add('is-checking');
var secret = await Card.crypt.open(pub.secretRef, area.value);
gate.classList.remove('is-checking');
if (!secret) { busy = false; showError(errors[misses++ % errors.length]); return; }
U.store.set(PASS_KEY, area.value);
var hadKeyboard = document.activeElement === area;
area.blur();
void pass.offsetWidth;
pass.classList.add('is-right');
await wait(650 + Math.min(area.value.length, 60) * 20);
if (hadKeyboard) { await wait(250); window.scrollTo(0, 0); }
resolve({ secret: secret, known: false });
}
}
Card.gate = {
mount: async function (pub, secret) {
pub.secretRef = secret;
placeholder = U.fmt((pub.gate && pub.gate.placeholder) || 'Пароль');
gate = el('div', 'gate' + ((pub.gate || {}).style === 'monogram' ? ' gate--mono' : ''), markup(pub));
gate.setAttribute('role', 'dialog');
gate.setAttribute('aria-modal', 'true');
document.body.insertBefore(gate, document.body.firstChild);
pass = $('.pass', gate); area = $('.pass__input', gate); mirror = $('.pass__mirror', gate);
errorEl = $('.gate__error', gate); openBtn = $('.gate__open', gate); form = $('.gate__form', gate);
hint = $('.hint', gate);
U.$$('[data-sound]', gate).forEach(function (b) {
b.addEventListener('click', function () { Card.sound.set(b.getAttribute('data-sound') === '1'); });
});
if ($('.gate__sound', gate)) Card.sound.bind($('.gate__sound', gate), {
label: $('.gate__sound-text', gate), onText: 'Звук включён',
offText: gate.classList.contains('gate--mono') ? 'Со&nbsp;звуком' : 'Лучше со&nbsp;звуком'
});
var known = null;
var remembered = U.store.get(PASS_KEY);
if (secret && secret.plain && !secret.lock) {
known = secret.plain;
gate.classList.add('is-known');
} else if (remembered) {
known = await Card.crypt.open(secret, remembered);
if (known) gate.classList.add('is-known');
else U.store.del(PASS_KEY);
}
if (!known) gate.classList.add('has-lock');
var result = new Promise(function (resolve) { wire(pub, resolve, known); });
var seen = sessionStorage && (function () { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; } })();
if (seen) {
gate.classList.add('is-instant', 'is-1', 'is-2', 'is-3');
requestAnimationFrame(function () { requestAnimationFrame(function () { gate.classList.remove('is-instant'); }); });
} else {
await wait(600); gate.classList.add('is-1');
await wait(1700); gate.classList.add('is-2');
await wait(1400); gate.classList.add('is-3');
try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {  }
}
area.disabled = false;
U.$$('.gate__open', gate).forEach(function (b) { b.disabled = false; });
var devPass = U.isLocal && new URLSearchParams(location.search).get('pass');
if (devPass && !known) {
area.value = devPass;
area.dispatchEvent(new Event('input'));
form.dispatchEvent(new Event('submit', { cancelable: true }));
} else if (devPass && known) {
form.dispatchEvent(new Event('submit', { cancelable: true }));
}
return result;
},
open: async function (onOpening) {
gate.classList.add('is-leaving');
await wait(650);
gate.classList.add('is-seam');
await wait(1150);
gate.classList.add('is-opening');
U.root.classList.add('is-open');
if (onOpening) onOpening();
await wait(1900);
gate.remove();
},
exit: function () {
Card.gate.forget();
if (Card.sound.on) Card.sound.set(false);
if (!$('.closer')) document.body.appendChild(el('div', 'closer',
'<div class="closer__half closer__half--top"></div><div class="closer__half closer__half--bottom"></div><div class="closer__seam"></div>'));
requestAnimationFrame(function () { U.root.classList.add('is-closing'); });
setTimeout(function () { window.scrollTo(0, 0); location.reload(); }, 1900);
},
wax: wax,
forget: function () {
U.store.del(PASS_KEY);
try { sessionStorage.removeItem(SEEN_KEY); } catch (e) {  }
}
};
})();
