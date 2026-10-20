(function () {
'use strict';
var U = Card.util;
var $ = U.$, el = U.el, clamp = U.clamp, lerp = U.lerp, inOut = U.inOut, wait = U.wait;
var NAME = '';
function t(s) { return U.fmt(String(s == null ? '' : s).replace(/\{name\}/g, NAME)); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function meta(s, num) {
return '<div class="meta micro"><span>' + t(s.frame || 'Кадр ' + num) + '</span><span>' + t(s.tag || '') + '</span></div>';
}
var build = {
title: function (s, num) {
return '<div class="title-glow" aria-hidden="true"></div>' + meta(s, num) +
'<div class="t-body">' +
(s.kicker ? '<p class="t-kicker micro">' + t(s.kicker) + '</p>' : '') +
'<h1 class="t-title"><span class="t-title__word">' + t(s.title) + '</span></h1>' +
(s.sub ? '<p class="t-sub"><span class="mask"><span>' + t(s.sub) + '</span></span></p>' : '') +
'</div>' +
'<div class="cue micro" aria-hidden="true"><span>Дальше</span><span class="cue__line"><i></i></span></div>';
},
text: function (s, num) {
return '<div class="stage">' + meta(s, num) +
'<div class="x-body"><p class="x-main" data-words>' + t(s.text) + '</p>' +
(s.aside ? '<p class="x-aside" data-words>' + t(s.aside) + '</p>' : '') + '</div>' +
'<div class="stage__rule" aria-hidden="true"><span></span></div></div>';
},
list: function (s, num) {
var items = (s.items || []).map(function (it, i) {
return '<li data-reveal="rise" style="--d:' + (i * 160) + 'ms"><span class="l-num">' +
['i', 'ii', 'iii', 'iv', 'v', 'vi'][i] + '</span><span class="l-text">' + t(it) + '</span></li>';
}).join('');
return meta(s, num) +
(s.title ? '<h2 class="l-title" data-reveal="mask"><span class="mask"><span>' + t(s.title) + '</span></span></h2>' : '') +
'<ol class="l-items">' + items + '</ol>';
},
photo: function (s, num) {
return '<div class="stage">' + meta(s, num) +
(s.title ? '<p class="p-title"><span class="mask"><span>' + t(s.title) + '</span></span></p>' : '') +
'<div class="p-frame"><div class="p-inner"><img src="' + encodeURI(s.photo || '') + '" alt="" decoding="async"></div></div>' +
(s.caption ? '<p class="p-caption micro"><span>' + t(s.caption) + '</span></p>' : '') +
'</div>';
},
final: function (s, num) {
return '<div class="stage stage--final">' +
'<div class="f-shade" aria-hidden="true"></div><div class="f-light" aria-hidden="true"></div>' +
'<div class="f-text"><p class="f-main" data-words>' + t(s.text) + '</p>' +
(s.bye ? '<p class="f-bye"><span class="f-rule" aria-hidden="true"></span><span class="f-bye__text">' + t(s.bye) + '</span></p>' : '') +
'</div>' +
'<div class="f-ps">' + (s.ps ? '<span class="f-ps__mark micro">P.S.</span><span class="f-ps__text">' + t(s.ps) + '</span>' : '') +
(s.signature ? '<span class="f-sign">' + t(s.signature) + '</span>' : '') + '</div></div>';
}
};
build['3d'] = function (s, num) {
var caps = s.captions || [];
var html = caps.map(function (c, i) {
c = typeof c === 'string' ? { text: c } : c;
var from = c.from != null ? c.from : 0.08 + i * (0.8 / caps.length);
var to = c.to != null ? c.to : from + 0.8 / caps.length - 0.04;
return '<p class="d-cap d-cap--' + (c.pos || 'bottom') + '" data-from="' + from + '" data-to="' + to + '">' + t(c.text) + '</p>';
}).join('');
return '<div class="stage stage--3d">' + meta(s, num) + html +
(s.hint ? '<p class="d-hint micro"><span class="d-hint__dot" aria-hidden="true"></span>' + t(s.hint) + '</p>' : '') +
(s.reveal ? '<p class="d-reveal" aria-live="polite">' + t(s.reveal) + '</p>' : '') + '</div>';
};
var PIN = { text: 2.6, photo: 3, final: 3.4, '3d': 3 };
var handlers = {
'3d': function (sec, s) {
var caps = U.$$('.d-cap', sec).map(function (n) { return { el: n, from: +n.dataset.from, to: +n.dataset.to, on: false }; });
var hint = $('.d-hint', sec), hintOn = false;
var hf = s.hintFrom != null ? s.hintFrom : 0.3, ht = s.hintTo != null ? s.hintTo : 0.95;
if (s.reveal) {
Card.on('tap3d', function (d) {
if (d.set === s.set && (!s.tapTarget || d.module === s.tapTarget)) sec.classList.add('is-revealed');
});
}
return function (p) {
for (var i = 0; i < caps.length; i++) {
var c = caps[i], on = p >= c.from && p < c.to;
if (on !== c.on) { c.on = on; c.el.classList.toggle('is-on', on); }
}
if (hint) {
var h = p >= hf && p < ht;
if (h !== hintOn) { hintOn = h; hint.classList.toggle('is-on', h); }
}
};
},
text: function (sec) {
var words = [];
U.$$('[data-words]', sec).forEach(function (p) { words = words.concat(Card.scenes.splitWords(p)); });
var body = $('.x-body', sec), rule = $('.stage__rule span', sec), n = words.length, span = 2.6;
return function (p) {
var pos = clamp((p - 0.06) / 0.74) * (n + span);
for (var i = 0; i < n; i++) {
var o = (0.12 + 0.88 * clamp((pos - i) / span)).toFixed(3);
if (words[i]._o !== o) { words[i]._o = o; words[i].style.opacity = o; }
}
body.style.transform = 'translate3d(0,' + ((0.5 - p) * 5 * Card.viewport.vh).toFixed(2) + 'px,0)';
rule.style.transform = 'scaleX(' + clamp(p).toFixed(4) + ')';
};
},
photo: function (sec) {
var frame = $('.p-frame', sec), inner = $('.p-inner', sec), title = $('.p-title', sec), cap = $('.p-caption', sec);
var shown = false;
var io = new IntersectionObserver(function (e) {
if (e[0].isIntersecting && title) { title.classList.add('is-in'); io.disconnect(); }
}, { threshold: 0.5 });
io.observe($('.stage', sec));
return function (p) {
var open = inOut(clamp((p - 0.1) / 0.45));
var push = clamp((p - 0.5) / 0.5);
var sx = lerp(0.58, 1, open), sy = lerp(0.42, 1, open), z = 1.18 - open * 0.12 + push * 0.08;
frame.style.transform = 'scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')';
inner.style.transform = 'scale(' + (z / sx).toFixed(4) + ',' + (z / sy).toFixed(4) + ')';
if (title) {
var out = clamp((p - 0.12) / 0.2);
title.style.opacity = (1 - out).toFixed(3);
title.style.transform = 'translate3d(0,' + (-out * 6 * Card.viewport.vh).toFixed(2) + 'px,0)';
}
if (cap) {
var c = p > 0.55;
if (c !== shown) { shown = c; cap.classList.toggle('is-in', c); }
}
};
},
final: function (sec, s) {
var shadeMax = s && s.shade != null ? s.shade : 1;
var text = $('.f-text', sec), shade = $('.f-shade', sec), light = $('.f-light', sec), ps = $('.f-ps', sec);
var words = Card.scenes.splitWords($('.f-main', sec)), step = 220;
words.forEach(function (w, i) { w.style.setProperty('--d', (i * step) + 'ms'); });
text.style.setProperty('--bye', ((words.length * step + 2000) / 1000) + 's');
var started = false, ended = false;
return function (p) {
if (!started && p > -0.02) { started = true; text.classList.add('is-in'); }
var fade = clamp((p - 0.4) / 0.18);
text.style.opacity = (1 - fade).toFixed(3);
text.style.transform = 'translate3d(0,' + (-fade * 3 * Card.viewport.vh).toFixed(2) + 'px,0)';
text.style.visibility = fade >= 1 ? 'hidden' : '';
var dim = clamp((p - 0.4) / 0.24);
shade.style.opacity = (dim * shadeMax).toFixed(3);
light.style.opacity = (dim * 0.9).toFixed(3);
ps.style.opacity = clamp((p - 0.6) / 0.06).toFixed(3);
var end = p > 0.62;
if (end !== ended) {
ended = end;
ps.classList.toggle('is-in', end);
U.root.classList.toggle('is-end', end);
Card.sound.mood(end ? 'end' : 'normal');
Card.emit('end', end);
}
};
}
};
Card.render = function (secret, story) {
NAME = String(secret.name || '');
(secret.scenes || []).forEach(function (s, i) {
if (!build[s.type]) return;
var num = pad(i + 1);
var sec = el('section', 'scene scene--' + s.type, build[s.type](s, num));
sec.dataset.num = num;
sec.dataset.title = s.tag || '';
sec.dataset.index = i;
if (PIN[s.type]) sec.setAttribute('data-pin', s.pin || PIN[s.type]);
if (s.set) sec.setAttribute('data-set', s.set);
story.appendChild(sec);
var fn = handlers[s.type] && handlers[s.type](sec, s);
if (fn && s.set) {
var inner = fn;
fn = function (p) { inner(p); Card.emit('set-progress', { set: s.set, p: p }); };
}
if (fn) Card.scenes.pin(sec, fn);
});
if (secret.world) U.root.classList.add('has-3d');
Card.emit('rendered', secret);
};
Card.intro = async function () {
U.root.classList.add('is-hello');
await wait(2400);
U.root.classList.add('is-intro');
await wait(1400);
Card.scenes.unlockScroll();
U.root.classList.add('is-chrome');
await wait(1600);
U.root.classList.add('is-cue');
};
})();
