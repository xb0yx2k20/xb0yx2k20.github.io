(function () {
'use strict';
if (!Card.three) return;
var U = Card.util;
var LOOP = [[0, 0], [0, -40], [6, -62], [24, -70], [40, -60], [42, -42], [30, -30], [30, -16], [46, -6], [62, -14],
[72, -34], [86, -40], [98, -28], [96, 0], [80, 16], [56, 20], [36, 12], [20, 20], [6, 16]];
function asphaltTexture(T, c) {
var S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
var x = cv.getContext('2d');
x.fillStyle = c; x.fillRect(0, 0, S, S);
var id = x.getImageData(0, 0, S, S), d = id.data;
for (var i = 0; i < d.length; i += 4) {
var n = (Math.random() - 0.5) * 26, sp = Math.random() > 0.996 ? 40 : 0;
d[i] += n + sp; d[i + 1] += n + sp; d[i + 2] += n + sp * 1.1;
}
x.putImageData(id, 0, 0);
for (var y = 0; y < S; y += 2) {
var cx = S * (0.5 + Math.sin(y / S * Math.PI * 2) * 0.12);
var g = x.createLinearGradient(cx - 90, 0, cx + 90, 0);
g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
x.fillStyle = g; x.fillRect(cx - 90, y, 180, 2);
}
for (var p = 0; p < 18; p++) {
x.fillStyle = 'rgba(' + (Math.random() > 0.5 ? '255,255,255,0.03' : '0,0,0,0.08') + ')';
x.fillRect(Math.random() * S, Math.random() * S, 30 + Math.random() * 80, 20 + Math.random() * 60);
}
var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
return t;
}
function stripes(T, a, b, n, chequer) {
var cv = document.createElement('canvas'); cv.width = 64; cv.height = 256;
var x = cv.getContext('2d');
for (var i = 0; i < n; i++) for (var j = 0; j < (chequer ? 2 : 1); j++) {
x.fillStyle = (i + j) % 2 ? b : a;
x.fillRect(j * (64 / (chequer ? 2 : 1)), i * 256 / n, 64 / (chequer ? 2 : 1), 256 / n);
}
var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
return t;
}
Card.three.module('track', function (ctx, o) {
var T = ctx.THREE;
var cols = Object.assign({ asphalt: '#2b2c31', grass: '#0b1410', kerb: '#d0202a' }, o.colors || {});
var W = o.width || 7, half = W / 2;
var group = new T.Group(), world = new T.Group();
group.add(world);
var curve = new T.CatmullRomCurve3(LOOP.map(function (p) { return new T.Vector3(p[0], 0, p[1]); }), true, 'centripetal');
var L = curve.getLength(), N = Math.round(L * 1.5);
var frames = [];
for (var i = 0; i <= N; i++) {
var u = i / N, pt = curve.getPointAt(u % 1), tg = curve.getTangentAt(u % 1).normalize();
frames.push({ p: pt, t: tg, r: new T.Vector3(-tg.z, 0, tg.x), k: 0 });
}
for (var k = 0; k <= N; k++) {
var a = frames[(k - 3 + N) % N].t, b = frames[(k + 3) % N].t;
frames[k].k = (a.x * b.z - a.z * b.x) / (6 / 1.5);
}
function ribbon(o0, o1, y, from, to, vScale) {
var pos = [], uv = [], idx = [], v = 0;
for (var i = from; i <= to; i++) {
var F = frames[i % (N + 1)];
if (i > from) v += F.p.distanceTo(frames[(i - 1) % (N + 1)].p) / vScale;
pos.push(F.p.x + F.r.x * o0, y, F.p.z + F.r.z * o0, F.p.x + F.r.x * o1, y, F.p.z + F.r.z * o1);
uv.push(0, v, 1, v);
var n = (i - from) * 2;
if (i > from) idx.push(n - 2, n - 1, n, n - 1, n + 1, n);
}
var g = new T.BufferGeometry();
g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
g.setIndex(idx);
g.computeVertexNormals();
return g;
}
var grass = new T.Mesh(new T.PlaneGeometry(600, 600), new T.MeshStandardMaterial({ color: new T.Color(cols.grass), roughness: 1 }));
grass.rotation.x = -Math.PI / 2; grass.position.set(48, -0.03, -20);
world.add(grass);
var asphalt = new T.Mesh(ribbon(-half, half, 0, 0, N, W), new T.MeshPhysicalMaterial({
map: asphaltTexture(T, cols.asphalt), roughness: 0.86, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 0.3
}));
world.add(asphalt);
var lineMat = new T.MeshStandardMaterial({ color: new T.Color('#e9e6dc'), roughness: 0.6 });
world.add(new T.Mesh(ribbon(-half + 0.15, -half + 0.32, 0.004, 0, N, 1), lineMat));
world.add(new T.Mesh(ribbon(half - 0.32, half - 0.15, 0.004, 0, N, 1), lineMat));
var kerbMat = new T.MeshStandardMaterial({ map: stripes(T, cols.kerb, '#f2efe8', 2), roughness: 0.55 });
var run = null;
for (var s = 0; s <= N; s++) {
var turning = Math.abs(frames[s].k) > 0.03;
if (turning && run == null) run = s;
if ((!turning || s === N) && run != null) {
if (s - run > 4) {
world.add(new T.Mesh(ribbon(-half - 0.9, -half, 0.02, Math.max(0, run - 3), Math.min(N, s + 3), 3.2), kerbMat));
world.add(new T.Mesh(ribbon(half, half + 0.9, 0.02, Math.max(0, run - 3), Math.min(N, s + 3), 3.2), kerbMat));
}
run = null;
}
}
var chq = new T.Mesh(new T.PlaneGeometry(W, 1.2), new T.MeshStandardMaterial({ map: stripes(T, '#111', '#eee', 2, true), roughness: 0.6 }));
chq.material.map.repeat.set(7, 1);
chq.rotation.x = -Math.PI / 2;
chq.position.copy(frames[6].p).setY(0.006);
chq.rotation.z = -Math.atan2(frames[6].t.x, -frames[6].t.z);
world.add(chq);
if (o.tyres !== false) {
var tyre = new T.TorusGeometry(0.3, 0.13, 8, 16);
tyre.rotateX(Math.PI / 2);
var tyreMat = new T.MeshStandardMaterial({ roughness: 0.75, metalness: 0 });
var step = 0.72, count = 0, spots = [];
var palette = ['#b81d26', '#bdb8ae', '#1d3a9a', '#151515', '#c99a18'];
[-1, 1].forEach(function (side) {
var acc = 0, block = 0;
for (var i = 1; i <= N; i++) {
acc += frames[i].p.distanceTo(frames[i - 1].p);
if (acc < step) continue;
acc = 0; block++;
var F = frames[i], outer = side * Math.sign(F.k || 1) < 0 || (Math.abs(F.k) < 0.03 && side > 0);
if (!outer) continue;
for (var h = 0; h < 3; h++) spots.push({ x: F.p.x + F.r.x * side * (half + 2.2), z: F.p.z + F.r.z * side * (half + 2.2), y: 0.13 + h * 0.26, c: palette[Math.floor(block / 7) % palette.length] });
}
});
var inst = new T.InstancedMesh(tyre, tyreMat, spots.length), m4 = new T.Matrix4(), col = new T.Color();
spots.forEach(function (S, i) { m4.makeTranslation(S.x, S.y, S.z); inst.setMatrixAt(i, m4); inst.setColorAt(i, col.set(S.c)); });
world.add(inst);
count = spots.length;
}
var poleMat = new T.MeshStandardMaterial({ color: new T.Color('#1a1c22'), roughness: 0.5, metalness: 0.5 });
var headMat = new T.MeshBasicMaterial({ color: new T.Color('#fff4e0').multiplyScalar(6), toneMapped: false });
var pool = new T.MeshBasicMaterial({ map: ctx.dot(), color: new T.Color('#ffe9c8'), transparent: true, opacity: 0.4, depthWrite: false, blending: T.AdditiveBlending });
var lamps = o.lamps || 14;
for (var l = 0; l < lamps; l++) {
var Fi = frames[Math.floor((l + 0.5) / lamps * N)], sd = l % 2 ? 1 : -1;
var base = Fi.p.clone().addScaledVector(Fi.r, sd * (half + 4.2));
var pole = new T.Mesh(new T.CylinderGeometry(0.08, 0.12, 9, 8), poleMat);
pole.position.copy(base).setY(4.5);
world.add(pole);
var head = new T.Mesh(new T.BoxGeometry(1.2, 0.3, 0.5), headMat);
head.position.copy(base).setY(9).addScaledVector(Fi.r, -sd * 0.4);
world.add(head);
var halo = new T.Sprite(new T.SpriteMaterial({ map: ctx.dot(), color: new T.Color('#ffe2b8'), transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending }));
halo.position.copy(head.position); halo.scale.setScalar(5);
world.add(halo);
var pl = new T.Mesh(new T.PlaneGeometry(14, 14), pool);
pl.rotation.x = -Math.PI / 2;
pl.position.copy(Fi.p).addScaledVector(Fi.r, sd * 1.5).setY(0.01);
world.add(pl);
}
var sNow = 2, v = 0, vTarget = 0, cruise = o.speed || 13, look = new T.Vector3(), yaw = null, tmp = new T.Vector3();
function sample(dist) {
var f = ((dist / L) % 1 + 1) % 1, i = f * N, i0 = Math.floor(i), t = i - i0;
var A = frames[i0], B = frames[Math.min(N, i0 + 1)];
return { p: tmp.copy(A.p).lerp(B.p, t).clone(), t: A.t.clone().lerp(B.t, t).normalize(), k: U.lerp(A.k, B.k, t) };
}
var lean = 0;
return {
group: group,
go: function () { vTarget = cruise; },
get speed() { return v / cruise; },
reset: function () { sNow = 2; v = 0; vTarget = 0; yaw = null; lean = 0; },
update: function (time, dt) {
v += (vTarget - v) * Math.min(1, dt * (v < vTarget * 0.6 ? 1.6 : 0.8));
sNow += v * dt;
var here = sample(sNow), ahead = sample(sNow + 6);
look.copy(ahead.p).sub(here.p).normalize().add(here.t).normalize();
var target = Math.atan2(look.x, -look.z);
if (yaw == null) yaw = target;
var dy = target - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
yaw += dy * Math.min(1, dt * 6);
lean += (-here.k * v * 0.06 - lean) * Math.min(1, dt * 3);
world.rotation.y = yaw;
world.position.set(0, 0, 0);
tmp.copy(here.p).applyAxisAngle(new T.Vector3(0, 1, 0), yaw);
world.position.set(-tmp.x, 0, -tmp.z);
group.rotation.z = U.clamp(lean, -0.06, 0.06) + Math.sin(time * 41) * 0.0012 * (v / cruise);
group.position.y = Math.sin(time * 33) * 0.006 * (v / cruise);
}
};
});
})();
