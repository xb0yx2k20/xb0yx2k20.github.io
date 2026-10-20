(function () {
'use strict';
if (!Card.three) return;
Card.three.module('rain', function (ctx, o) {
var T = ctx.THREE, U = Card.util;
var count = Math.round(700 * (o.density == null ? 1 : o.density) * (ctx.lowEnd ? 0.5 : 1));
var area = o.area || [14, 9, 12], c = o.center || [0, 3.5, -2];
var speed = (o.speed || 1) * 11, wind = o.wind == null ? 0.25 : o.wind, len = o.length || 0.38;
var range = o.range || [0, 0.7];
var pos = new Float32Array(count * 6), drops = [];
for (var i = 0; i < count; i++) {
drops.push({ x: c[0] + (Math.random() - 0.5) * area[0], y: c[1] + (Math.random() - 0.5) * area[1], z: c[2] + (Math.random() - 0.5) * area[2], v: 0.8 + Math.random() * 0.4 });
}
var geo = new T.BufferGeometry();
geo.setAttribute('position', new T.BufferAttribute(pos, 3));
var base = o.opacity == null ? 0.55 : o.opacity;
var mat = new T.LineBasicMaterial({ color: new T.Color(o.color || '#aebfd6'), transparent: true, opacity: base, depthWrite: false, fog: false });
var lines = new T.LineSegments(geo, mat);
lines.frustumCulled = false;
var now = 1;
return {
group: lines,
reset: function () { now = 1; },
update: function (t, dt, p, fade) {
var target = 1 - U.clamp((p - range[0]) / (range[1] - range[0]));
now += (target - now) * Math.min(1, dt * 1.5);
ctx.shared.rain = now;
mat.opacity = Math.min(1, base * now * (fade == null ? 1 : fade) * (1 + (ctx.shared.flash || 0) * 1.4));
lines.visible = now > 0.01;
if (!lines.visible) return;
var live = Math.floor(count * (0.25 + 0.75 * now));
geo.setDrawRange(0, live * 2);
var bottom = c[1] - area[1] / 2;
for (var i = 0; i < live; i++) {
var d = drops[i];
d.y -= speed * d.v * dt;
d.x += wind * speed * d.v * dt * 0.1;
if (d.y < bottom) { d.y += area[1]; d.x = c[0] + (Math.random() - 0.5) * area[0]; }
var k = i * 6;
pos[k] = d.x; pos[k + 1] = d.y; pos[k + 2] = d.z;
pos[k + 3] = d.x - wind * len; pos[k + 4] = d.y + len; pos[k + 5] = d.z;
}
geo.attributes.position.needsUpdate = true;
}
};
});
})();
