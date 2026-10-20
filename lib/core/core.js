(function () {
'use strict';
var root = document.documentElement;
var Card = window.Card = window.Card || {};
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
var listeners = {};
Card.on = function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); };
Card.emit = function (name, data) { (listeners[name] || []).forEach(function (fn) { fn(data); }); };
Card.util = {
root: root,
reduce: reduce,
isLocal: isLocal,
cardId: document.body.getAttribute('data-card') || 'card',
$: function (s, c) { return (c || document).querySelector(s); },
$$: function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); },
clamp: function (v, a, b) { return Math.min(b == null ? 1 : b, Math.max(a || 0, v)); },
lerp: function (a, b, t) { return a + (b - a) * t; },
inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
wait: function (ms) { return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 250) : ms); }); },
el: function (tag, cls, html) {
var n = document.createElement(tag);
if (cls) n.className = cls;
if (html != null) n.innerHTML = html;
return n;
},
store: {
get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {  } },
del: function (k) { try { localStorage.removeItem(k); } catch (e) {  } }
},
fmt: function (s) {
s = String(s == null ? '' : s)
.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
s = s.replace(/(^|[\s(«])([А-Яа-яЁёA-Za-z]{1,2})\s+/g, '$1$2 ');
s = s.replace(/ +([—–])/g, ' $1');
s = s.replace(/\*\*(.+?)\*\*/g, '<em class="accent">$1</em>');
s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
return s.replace(/\n/g, '<br>');
}
};
var VH = window.innerHeight / 100;
var lockedW = window.innerWidth;
function lock() {
VH = window.innerHeight / 100;
lockedW = window.innerWidth;
root.style.setProperty('--vh', VH.toFixed(3) + 'px');
}
lock();
Card.viewport = {
get vh() { return VH; },
changed: function () {
var a = document.activeElement;
var typing = a && /^(INPUT|TEXTAREA)$/.test(a.tagName);
if (window.innerWidth !== lockedW) return true;
return !typing && Math.abs(window.innerHeight / 100 - VH) / VH > 0.3;
},
lock: lock
};
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
Card.notify = function (cfg, key, text, throttleMs) {
if (!cfg || !cfg.token || !cfg.chatId || isLocal) return;
var flag = 'card:' + Card.util.cardId + ':sent:' + key;
var last = +Card.util.store.get(flag) || 0;
if (throttleMs == null ? last : Date.now() - last < throttleMs) return;
Card.util.store.set(flag, String(Date.now()));
var d = new Date();
var time = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
var url = 'https://api.telegram.org/bot' + cfg.token + '/sendMessage';
var body = new URLSearchParams({ chat_id: cfg.chatId, text: text + ' · ' + time });
var sent = false;
try { sent = navigator.sendBeacon && navigator.sendBeacon(url, body); } catch (e) {  }
if (!sent) { try { fetch(url, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }); } catch (e) {  } }
};
Card.noiseTile = function () {
var c = document.createElement('canvas');
c.width = c.height = 200;
var x = c.getContext('2d');
var img = x.createImageData(200, 200);
for (var i = 0; i < img.data.length; i += 4) {
var v = (Math.random() * 255) | 0;
img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
img.data[i + 3] = 255;
}
x.putImageData(img, 0, 0);
root.style.setProperty('--noise', 'url(' + c.toDataURL('image/png') + ')');
};
})();
