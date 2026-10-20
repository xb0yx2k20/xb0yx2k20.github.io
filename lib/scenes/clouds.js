(function () {
'use strict';
if (!Card.three) return;
function cloudTexture(T, seed) {
var c = document.createElement('canvas'); c.width = 256; c.height = 128;
var x = c.getContext('2d');
var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
for (var i = 0; i < 26; i++) {
var px = 30 + rnd() * 196, py = 50 + rnd() * 50 - Math.abs(px - 128) * 0.12, r = 18 + rnd() * 36;
var g = x.createRadialGradient(px, py, 0, px, py, r);
g.addColorStop(0, 'rgba(255,255,255,' + (0.35 + rnd() * 0.3) + ')');
g.addColorStop(1, 'rgba(255,255,255,0)');
x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
}
var tx = new T.CanvasTexture(c);
tx.colorSpace = T.SRGBColorSpace;
return tx;
}
Card.three.module('clouds', function (ctx, o) {
var T = ctx.THREE, U = Card.util;
var count = Math.round((o.count || 16) * (ctx.lowEnd ? 0.65 : 1));
var band = o.band || {}, by = band.y || [2.5, 7], bz = band.z || [-26, -8], bx = band.x || 16;
var cN = new T.Color(o.night || '#3b4356'), cD = new T.Color(o.dawn || '#e7b6a2');
var texs = [cloudTexture(T, 7), cloudTexture(T, 31), cloudTexture(T, 77)];
var group = new T.Group(), items = [];
for (var i = 0; i < count; i++) {
var m = new T.SpriteMaterial({ map: texs[i % 3], color: cN.clone(), transparent: true, depthWrite: false, opacity: o.opacity || 0.95, fog: false });
var s = new T.Sprite(m);
var z = bz[0] + Math.random() * (bz[1] - bz[0]);
var w = (8 + Math.random() * 7) * (o.size || 1) * (1 - (z - bz[1]) / (bz[0] - bz[1]) * -0.4);
s.scale.set(w, w * 0.45, 1);
s.position.set((Math.random() - 0.5) * bx * 1.6, by[0] + Math.random() * (by[1] - by[0]), z);
group.add(s);
items.push({ s: s, base: s.position.clone(), leave: i / count * 0.92, gone: 0, dir: Math.random() < 0.5 ? -1 : 1, lean: 0, ph: Math.random() * 6 });
}
var lastDir = 1, now = 0, cF = new T.Color('#dfe3ff');
return {
group: group,
reset: function () { now = 0; items.forEach(function (it) { it.going = false; it.gone = 0; it.lean = 0; }); },
push: function (dx) {
if (Math.abs(dx) > 1) lastDir = dx > 0 ? 1 : -1;
items.forEach(function (it) { it.lean += dx * 0.004; });
},
update: function (t, dt, p, fade) {
now += (p - now) * Math.min(1, dt * 2);
var sky = ctx.shared.sky, d = sky ? sky.dawn : 0;
var left = 0;
for (var i = 0; i < items.length; i++) {
var it = items[i];
if (now > it.leave && !it.going) { it.going = true; it.dir = lastDir; }
if (it.going) it.gone = Math.min(1, it.gone + dt * 0.45);
else left++;
it.lean *= Math.pow(0.3, dt);
var off = it.dir * U.inOut(it.gone) * bx * 1.4;
it.s.position.x = it.base.x + off + it.lean + Math.sin(t * 0.05 + it.ph) * 0.6;
it.s.material.opacity = (o.opacity || 0.95) * (1 - it.gone) * (fade == null ? 1 : fade);
it.s.material.color.copy(cN).lerp(cD, d);
var fl = ctx.shared.flash;
if (fl) it.s.material.color.lerp(cF, Math.min(1, fl * Math.exp(-Math.abs(it.s.position.x - ctx.shared.flashX) * 0.12) * 0.85));
}
ctx.shared.cloud = left / items.length;
}
};
});
})();
