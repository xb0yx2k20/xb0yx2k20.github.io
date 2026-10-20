(function () {
'use strict';
if (!Card.three) return;
var U = Card.util;
var painted = {};
function paint(T, c, key) {
if (painted[key]) return painted[key];
var W = 256, H = 256;
var col = document.createElement('canvas'); col.width = W; col.height = H;
var gl = document.createElement('canvas'); gl.width = W; gl.height = H;
var x = col.getContext('2d'), g = gl.getContext('2d');
var lin = x.createLinearGradient(0, H, 0, 0);
lin.addColorStop(0, c.heart); lin.addColorStop(0.3, c.body); lin.addColorStop(0.78, c.body); lin.addColorStop(1, c.edge);
x.fillStyle = lin; x.fillRect(0, 0, W, H);
var side = x.createLinearGradient(0, 0, W, 0);
side.addColorStop(0, c.edge); side.addColorStop(0.2, 'rgba(0,0,0,0)'); side.addColorStop(0.8, 'rgba(0,0,0,0)'); side.addColorStop(1, c.edge);
x.globalAlpha = 0.7; x.fillStyle = side; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
var seed = 7, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
for (var i = 0; i < 34; i++) {
var sx = W / 2 + (rnd() - 0.5) * 16, spread = (i / 33 - 0.5) * W * 1.1;
x.beginPath(); x.moveTo(sx, H);
for (var k = 1; k <= 10; k++) {
var t = k / 10;
x.lineTo(sx + spread * Math.pow(t, 1.3) + Math.sin(t * 7 + i) * 2, H - t * H * (0.8 + rnd() * 0.18));
}
x.strokeStyle = c.vein; x.globalAlpha = 0.08 + rnd() * 0.1; x.lineWidth = 0.8 + rnd() * 1.2; x.stroke();
}
x.globalAlpha = 1;
for (var b = 0; b < 26; b++) {
var bx = rnd() * W, by = rnd() * H, br = 10 + rnd() * 30, rg = x.createRadialGradient(bx, by, 0, bx, by, br);
rg.addColorStop(0, rnd() > 0.5 ? 'rgba(120,170,255,0.10)' : 'rgba(40,10,90,0.14)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
x.fillStyle = rg; x.fillRect(bx - br, by - br, br * 2, br * 2);
}
g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
for (var s = 0; s < 420; s++) {
var gy = Math.pow(rnd(), 0.6) * H, gx = rnd() * W, r = 0.5 + rnd() * 0.8;
g.fillStyle = 'rgba(255,255,255,' + (0.5 + rnd() * 0.5) + ')';
g.beginPath(); g.arc(gx, H - gy, r, 0, 6.283); g.fill();
}
var map = new T.CanvasTexture(col); map.colorSpace = T.SRGBColorSpace; map.anisotropy = 4;
var glit = new T.CanvasTexture(gl); glit.anisotropy = 4;
return (painted[key] = { map: map, glitter: glit });
}
function blade(T, L, W, shape, cup, bend, sx, sy) {
var g = new T.PlaneGeometry(1, 1, sx, sy), p = g.attributes.position;
for (var i = 0; i < p.count; i++) {
var u = p.getX(i) * 2, v = p.getY(i) + 0.5;
var hw = shape(v) * W;
var X = u * hw, Y = v * L;
var Z = -cup * u * u * hw * 0.5 - bend * v * v * L + 0.012 * L * Math.sin(u * 5 + v * 4) * v;
p.setXYZ(i, X, Y, Z);
}
g.computeVertexNormals();
return g;
}
function sepalShape(v) { return Math.pow(Math.sin(Math.PI * Math.min(0.99, Math.pow(v, 0.8))), 0.8) * 0.5; }
function petalShape(v) { return Math.pow(Math.sin(Math.PI * Math.min(0.995, Math.pow(v, 0.55))), 0.6) * 0.5 * (0.35 + 0.65 * Math.min(1, v * 3)); }
function lipShape(v) { return (0.18 + 0.5 * Math.sin(Math.PI * v) * (v < 0.55 ? 1 : 0.7)) * 0.5; }
function sparkle(T, mat, amount) {
var uni = { uTime: { value: 0 }, uGlit: { value: amount }, uExcite: { value: 0 } };
mat.onBeforeCompile = function (sh) {
Object.assign(sh.uniforms, uni);
sh.vertexShader = sh.vertexShader
.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uExcite; attribute vec2 aLife;')
.replace('#include <begin_vertex>', [
'#include <begin_vertex>',
'{',
'  float tip = uv.y * uv.y;',
'  float br = sin(uTime * aLife.y + aLife.x) * 0.006 * tip;',
'  float tr = uExcite * sin(uTime * 9.0 * aLife.y + aLife.x + uv.x * 4.0) * 0.006 * tip;',
'  transformed += objectNormal * (br + tr);',
'}'
].join('\n'));
sh.fragmentShader = sh.fragmentShader
.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uGlit;\nfloat glHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }')
.replace('#include <emissivemap_fragment>', [
'#ifdef USE_EMISSIVEMAP',
'{',
'  float speck = texture2D(emissiveMap, vEmissiveMapUv).r;',
'  vec2 cell = floor(vEmissiveMapUv * 180.0);',
'  float ph = glHash(cell) * 6.2831;',
'  float view = dot(normalize(vViewPosition), normal) * 9.0;',
'  float tw = pow(0.5 + 0.5 * sin(uTime * (1.6 + glHash(cell + 3.1) * 2.4) + ph + view), 6.0);',
'  totalEmissiveRadiance *= speck * (0.05 + tw * 2.4) * uGlit;',
'}',
'#endif'
].join('\n'));
};
mat.customProgramCacheKey = function () { return 'orchid-sparkle'; };
return uni;
}
Card.three.module('orchid', function (ctx, o) {
var T = ctx.THREE;
var phone = Math.min(screen.width, screen.height) < 600;
var sx = ctx.lowEnd ? 6 : phone ? 8 : 10, sy = ctx.lowEnd ? 8 : phone ? 10 : 14;
var c = Object.assign({ heart: '#9fb2ff', body: '#2b3cc8', edge: '#1a1160', lip: '#2a0f5e', vein: '#1a0c58', glitter: '#cfe4ff' }, o.colors || {});
var group = new T.Group();
if (o.position) group.position.fromArray(o.position);
group.rotation.y = o.turn || 0;
group.scale.setScalar(o.size || 1);
var tex = paint(T, c, [c.heart, c.body, c.edge, c.vein].join());
var lipTex = paint(T, { heart: '#f5e7ff', body: c.lip, edge: c.lip, vein: '#0b0420' }, 'lip' + c.lip);
function material(t) {
var m = new T.MeshPhysicalMaterial({
map: t.map, emissiveMap: t.glitter, emissive: new T.Color(c.glitter).multiplyScalar(1.4),
roughness: 0.42, metalness: 0, side: T.DoubleSide,
sheen: 0.8, sheenRoughness: 0.35, sheenColor: new T.Color('#9fb8ff'),
iridescence: o.iridescence == null ? 0.6 : o.iridescence, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520],
envMapIntensity: 1.1
});
return { mat: m, uni: sparkle(T, m, o.glitter == null ? 1 : o.glitter) };
}
var petalM = material(tex), lipM = material(lipTex);
var columnMat = new T.MeshPhysicalMaterial({ color: new T.Color('#f4f0ff'), roughness: 0.3, sheen: 0.5, envMapIntensity: 1 });
var stemMat = new T.MeshPhysicalMaterial({ color: new T.Color('#2c3a26'), roughness: 0.55, sheen: 0.4, sheenColor: new T.Color('#7f9a70'), envMapIntensity: 0.7 });
var budMat = new T.MeshPhysicalMaterial({ color: new T.Color(c.body), roughness: 0.4, sheen: 0.7, sheenColor: new T.Color('#9fb8ff'), iridescence: 0.5, iridescenceIOR: 1.35, envMapIntensity: 1 });
function withLife(g) {
var n = g.attributes.position.count, a = new Float32Array(n * 2), ph = Math.random() * 6.28, sp = 0.8 + Math.random() * 0.6;
for (var i = 0; i < n; i++) { a[i * 2] = ph; a[i * 2 + 1] = sp; }
g.setAttribute('aLife', new T.BufferAttribute(a, 2));
return g;
}
var gDorsal = withLife(blade(T, 0.5, 0.24, sepalShape, 0.35, 0.06, sx, sy));
var gLateral = withLife(blade(T, 0.48, 0.24, sepalShape, 0.3, 0.05, sx, sy));
var gPetal = withLife(blade(T, 0.5, 0.56, petalShape, 0.25, 0.08, sx + 2, sy));
var gLip = withLife(blade(T, 0.3, 0.28, lipShape, 1.1, -0.35, sx, sy));
var gLobe = withLife(blade(T, 0.16, 0.13, sepalShape, 0.9, -0.5, 6, 8));
var kinds = {}, gColumn = new T.CapsuleGeometry(0.022, 0.07, 4, 10);
function slot(key, geo, mat) {
var o3 = new T.Object3D();
(kinds[key] = kinds[key] || { geo: geo, mat: mat, slots: [] }).slots.push(o3);
return o3;
}
function flower(scale) {
var f = new T.Group();
var parts = [
['lateral', gLateral, petalM.mat, Math.PI * 0.80, 0.12],
['lateral', gLateral, petalM.mat, -Math.PI * 0.80, 0.12],
['dorsal', gDorsal, petalM.mat, 0, 0.1],
['petal', gPetal, petalM.mat, Math.PI * 0.40, 0.05],
['petal', gPetal, petalM.mat, -Math.PI * 0.40, 0.05],
['lip', gLip, lipM.mat, Math.PI, -0.55],
['lobe', gLobe, lipM.mat, Math.PI * 0.72, -0.9],
['lobe', gLobe, lipM.mat, -Math.PI * 0.72, -0.9]
];
parts.forEach(function (q, k) {
var m = slot(q[0], q[1], q[2]), h = new T.Group();
m.rotation.x = -q[4];
m.position.z = 0.004 * k;
h.rotation.z = q[3];
h.add(m); f.add(h);
});
var col = slot('column', gColumn, columnMat);
col.position.set(0, 0.03, 0.05); col.rotation.x = 0.6;
f.add(col);
f.scale.setScalar(scale);
return f;
}
var a = o.arch || [0.9, 0.5, 0.2];
var curve = new T.CatmullRomCurve3([
new T.Vector3(0, -2.6, 0), new T.Vector3(0, -1.2, 0.05), new T.Vector3(a[0] * 0.2, a[1] * 0.65, a[2] * 0.3),
new T.Vector3(a[0] * 0.6, a[1], a[2] * 0.7), new T.Vector3(a[0], a[1] * 0.72, a[2])
]);
group.add(new T.Mesh(new T.TubeGeometry(curve, 48, 0.022, 8, false), stemMat));
var n = o.flowers || 5, flowers = [], tmp = new T.Vector3();
for (var i = 0; i < n; i++) {
var u = 0.5 + 0.44 * (i / Math.max(1, n - 1)), pt = curve.getPointAt(u);
var f = flower(0.95 - i * 0.07);
var holder = new T.Group();
holder.position.copy(pt);
f.position.set(0, -0.12, 0.08);
var side = (i % 2 ? 1 : -1);
holder.rotation.set(-0.1 + side * 0.04, -(o.turn || 0) + side * 0.22 + (o.lean == null ? 0.35 : o.lean) * Math.sign(a[0] || 1), side * 0.18);
holder.add(f);
group.add(holder);
flowers.push({ g: holder, rx: holder.rotation.x, rz: holder.rotation.z, ph: Math.random() * 6.28 });
}
for (var bI = 0; bI < (o.buds == null ? 2 : o.buds); bI++) {
var bud = new T.Mesh(new T.SphereGeometry(0.06 - bI * 0.015, 16, 12), budMat);
bud.scale.set(1, 1.25, 0.85);
bud.position.copy(curve.getPointAt(0.95 + bI * 0.03 > 1 ? 1 : 0.95 + bI * 0.03)).add(tmp.set(0, -0.05, 0.02));
group.add(bud);
}
var meshes = Object.keys(kinds).map(function (key) {
var K = kinds[key], im = new T.InstancedMesh(K.geo, K.mat, K.slots.length);
im.frustumCulled = false;
im.instanceMatrix.setUsage(T.DynamicDrawUsage);
group.add(im);
return { im: im, slots: K.slots };
});
var inv = new T.Matrix4(), m4 = new T.Matrix4();
function writeInstances() {
group.updateMatrixWorld(true);
inv.copy(group.matrixWorld).invert();
for (var i = 0; i < meshes.length; i++) {
var M = meshes[i];
for (var j = 0; j < M.slots.length; j++) M.im.setMatrixAt(j, m4.multiplyMatrices(inv, M.slots[j].matrixWorld));
M.im.instanceMatrix.needsUpdate = true;
}
}
writeInstances();
var excite = 0, exciteNow = 0;
return {
group: group,
excite: function (v) { excite = U.clamp(v); },
reset: function () { excite = exciteNow = 0; },
update: function (time, dt) {
exciteNow += (excite - exciteNow) * Math.min(1, dt * 4);
petalM.uni.uTime.value = lipM.uni.uTime.value = time;
petalM.uni.uExcite.value = lipM.uni.uExcite.value = exciteNow;
for (var k = 0; k < flowers.length; k++) {
var F = flowers[k];
F.g.rotation.x = F.rx + Math.sin(time * 0.6 + F.ph) * 0.025 + exciteNow * Math.sin(time * 7 + F.ph) * 0.02;
F.g.rotation.z = F.rz + Math.sin(time * 0.45 + F.ph) * 0.03;
}
group.rotation.z = Math.sin(time * 0.3 + (o.turn || 0)) * 0.012;
writeInstances();
}
};
});
})();
