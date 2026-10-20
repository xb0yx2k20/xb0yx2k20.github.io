(function () {
'use strict';
if (!Card.three) return;
Card.three.module('bokeh', function (ctx, o) {
var T = ctx.THREE;
var count = Math.max(8, Math.round(60 * (o.density == null ? 1 : o.density) * (ctx.lowEnd ? 0.6 : 1)));
var area = o.area || [14, 9, 10], c = o.center || [0, 1, -3], speed = o.speed || 1;
var pos = new Float32Array(count * 3), col = new Float32Array(count * 3), phase = [];
var colors = (o.colors || ['#ffd9a0', '#f6c1cc']).map(function (x) { return new T.Color(x); });
for (var i = 0; i < count; i++) {
pos[i * 3] = c[0] + (Math.random() - 0.5) * area[0];
pos[i * 3 + 1] = c[1] + (Math.random() - 0.5) * area[1];
pos[i * 3 + 2] = c[2] + (Math.random() - 0.5) * area[2];
var k = colors[i % colors.length];
col[i * 3] = k.r; col[i * 3 + 1] = k.g; col[i * 3 + 2] = k.b;
phase.push(Math.random() * 6.28);
}
var geo = new T.BufferGeometry();
geo.setAttribute('position', new T.BufferAttribute(pos, 3));
geo.setAttribute('color', new T.BufferAttribute(col, 3));
var mat = new T.PointsMaterial({ size: 0.45 * (o.size || 1), map: ctx.dot(), vertexColors: true, transparent: true,
opacity: o.opacity == null ? 0.7 : o.opacity, depthWrite: false, blending: o.blend === 'normal' ? T.NormalBlending : T.AdditiveBlending, sizeAttenuation: true });
var points = new T.Points(geo, mat);
points.frustumCulled = false;
return {
group: points,
update: function (t, dt) {
for (var i = 0; i < count; i++) {
pos[i * 3] += Math.sin(t * 0.2 * speed + phase[i]) * 0.12 * dt;
pos[i * 3 + 1] += (Math.cos(t * 0.17 * speed + phase[i]) * 0.1 + 0.03) * dt * speed;
if (pos[i * 3 + 1] > c[1] + area[1] / 2) pos[i * 3 + 1] = c[1] - area[1] / 2;
}
geo.attributes.position.needsUpdate = true;
}
};
});
})();
