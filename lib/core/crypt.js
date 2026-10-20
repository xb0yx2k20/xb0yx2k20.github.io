(function () {
'use strict';
var PUNCT;
try { PUNCT = new RegExp('[^\\p{L}\\p{N}]+', 'gu'); }
catch (e) { PUNCT = /[^0-9a-zа-я]+/g; }
var LOOK = { a: 'а', b: 'в', e: 'е', k: 'к', m: 'м', h: 'н', o: 'о', p: 'р', c: 'с', t: 'т', y: 'у', x: 'х' };
function normalize(s) {
return String(s || '').normalize('NFC').toLowerCase().replace(/ё/g, 'е').replace(PUNCT, '')
.replace(/[abekmhopctyx]/g, function (c) { return LOOK[c]; });
}
function fromB64(s) {
var bin = atob(s);
var out = new Uint8Array(bin.length);
for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
return out;
}
var available = !!(window.crypto && window.crypto.subtle && window.isSecureContext);
function sha256(str) {
var bytes = unescape(encodeURIComponent(str)), K = [], H = [], i, j;
var frac = function (x) { return ((x - Math.floor(x)) * 4294967296) | 0; };
for (var n = 2, c = 0; c < 64; n++) {
for (j = 2; j * j <= n; j++) if (n % j === 0) break;
if (j * j > n) { if (c < 8) H[c] = frac(Math.pow(n, 1 / 2)); K[c++] = frac(Math.pow(n, 1 / 3)); }
}
var words = [], len = bytes.length * 8;
for (i = 0; i < bytes.length; i++) words[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
words[len >> 5] |= 0x80 << (24 - len % 32);
words[((len + 64 >> 9) << 4) + 15] = len;
var r = function (x, k) { return (x >>> k) | (x << (32 - k)); };
for (i = 0; i < words.length; i += 16) {
var w = [], h = H.slice(0);
for (j = 0; j < 16; j++) w[j] = words[i + j] | 0;
for (j = 0; j < 64; j++) {
if (j >= 16) {
var a = w[j - 15], b = w[j - 2];
w[j] = (w[j - 16] + (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + w[j - 7] + (r(b, 17) ^ r(b, 19) ^ (b >>> 10))) | 0;
}
var t1 = h[7] + (r(h[4], 6) ^ r(h[4], 11) ^ r(h[4], 25)) + ((h[4] & h[5]) ^ (~h[4] & h[6])) + K[j] + (w[j] | 0);
var t2 = (r(h[0], 2) ^ r(h[0], 13) ^ r(h[0], 22)) + ((h[0] & h[1]) ^ (h[0] & h[2]) ^ (h[1] & h[2]));
h = [(t1 + t2) | 0].concat(h.slice(0, 7)); h[4] = (h[4] + t1) | 0;
}
for (j = 0; j < 8; j++) H[j] = (H[j] + h[j]) | 0;
}
return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
}
async function open(secret, pass) {
var norm = normalize(pass);
if (norm && secret && secret.lock) return sha256(secret.lock.salt + norm) === secret.lock.hash ? secret.plain : null;
if (!norm || !secret || !available) return null;
try {
var base = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm), 'PBKDF2', false, ['deriveKey']);
var key = await crypto.subtle.deriveKey(
{ name: 'PBKDF2', salt: fromB64(secret.salt), iterations: secret.iter, hash: 'SHA-256' },
base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
);
var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(secret.iv) }, key, fromB64(secret.data));
return JSON.parse(new TextDecoder().decode(plain));
} catch (e) {
return null;
}
}
Card.crypt = { normalize: normalize, open: open, available: available, sha256: sha256 };
})();
