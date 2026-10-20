(function () {
'use strict';
if (!Card.three) return;
Card.three.module('petals', function (ctx, o) {
var T = ctx.THREE, U = Card.util;
var count = Math.max(6, Math.round(90 * (o.density == null ? 1 : o.density) * (ctx.lowEnd ? 0.5 : 1)));
var area = o.area || [9, 9, 6], c = o.center || [0, 1, 0], speed = o.speed || 1, wind = o.wind == null ? 0.35 : o.wind;
var s = (o.size || 1) * 0.16;
var geo = ctx.petalGeometry(s * 0.9, s * 1.2, 0.6, 0.15, 3, 4);
var mat = new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: 0.6, transparent: true, opacity: 0.92 });
var mesh = new T.InstancedMesh(geo, mat, count);
mesh.frustumCulled = false;
var colors = (o.colors || ['#f6c1cc', '#fbe3e8', '#f2a7b5']).map(function (x) { return new T.Color(x); });
var items = [], dummy = new T.Object3D();
function reset(it, anywhere) {
it.x = c[0] + (Math.random() - 0.5) * area[0];
it.y = anywhere ? c[1] + (Math.random() - 0.5) * area[1] : c[1] + area[1] / 2 + Math.random();
it.z = c[2] + (Math.random() - 0.5) * area[2];
it.vy = -(0.25 + Math.random() * 0.35) * speed;
it.vx = 0; it.vz = 0;
it.rx = Math.random() * 6; it.ry = Math.random() * 6; it.rz = Math.random() * 6;
it.sx = (Math.random() - 0.5) * 1.6; it.sy = (Math.random() - 0.5) * 1.6;
it.ph = Math.random() * 6;
it.scale = 0.7 + Math.random() * 0.6;
}
for (var i = 0; i < count; i++) {
var it = {};
reset(it, true);
items.push(it);
mesh.setColorAt(i, colors[i % colors.length]);
}
var burst = 0;
if (o.burstOnTap !== false) ctx.on('tap3d', function () { burst = 1; });
return {
group: mesh,
update: function (t, dt) {
var lift = burst > 0;
for (var i = 0; i < count; i++) {
var P = items[i];
if (lift && i % 3 === 0) { P.vy = 0.9 + Math.random() * 0.8; P.vx = (Math.random() - 0.5) * 1.2; P.vz = (Math.random() - 0.5) * 1.2; }
P.vy += (-(0.25 * speed) - P.vy) * dt * 0.6;
P.vx *= 1 - dt * 0.8; P.vz *= 1 - dt * 0.8;
P.x += (P.vx + wind * (0.6 + Math.sin(t * 0.7 + P.ph) * 0.5)) * dt;
P.y += P.vy * dt;
P.z += (P.vz + Math.cos(t * 0.5 + P.ph) * 0.12) * dt;
P.rx += P.sx * dt; P.ry += P.sy * dt;
if (P.y < c[1] - area[1] / 2 || P.x > c[0] + area[0] / 2 + 1) reset(P, false);
dummy.position.set(P.x, P.y, P.z);
dummy.rotation.set(P.rx, P.ry, P.rz);
dummy.scale.setScalar(P.scale);
dummy.updateMatrix();
mesh.setMatrixAt(i, dummy.matrix);
}
burst = 0;
mesh.instanceMatrix.needsUpdate = true;
}
};
});
})();
