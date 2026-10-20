(function () {
'use strict';
if (!Card.three) return;
var U = Card.util;
function paintPetal(T, c) {
var W = 256, H = 512;
var col = document.createElement('canvas'); col.width = W; col.height = H;
var hgt = document.createElement('canvas'); hgt.width = W; hgt.height = H;
var x = col.getContext('2d'), h = hgt.getContext('2d');
var g = x.createLinearGradient(0, H, 0, 0);
g.addColorStop(0, c.base); g.addColorStop(0.32, c.body); g.addColorStop(0.86, c.body); g.addColorStop(1, c.edge);
x.fillStyle = g; x.fillRect(0, 0, W, H);
var gs = x.createLinearGradient(0, 0, W, 0);
gs.addColorStop(0, 'rgba(20,0,6,0.35)'); gs.addColorStop(0.18, 'rgba(20,0,6,0)'); gs.addColorStop(0.82, 'rgba(20,0,6,0)'); gs.addColorStop(1, 'rgba(20,0,6,0.35)');
x.fillStyle = gs; x.fillRect(0, 0, W, H);
h.fillStyle = '#808080'; h.fillRect(0, 0, W, H);
var seed = 3, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
for (var i = 0; i < 46; i++) {
var sx = W / 2 + (rnd() - 0.5) * 30, spread = (i / 45 - 0.5) * W * 1.15 + (rnd() - 0.5) * 12;
x.beginPath(); h.beginPath();
x.moveTo(sx, H); h.moveTo(sx, H);
for (var k = 1; k <= 12; k++) {
var t = k / 12, py = H - t * H * (0.75 + rnd() * 0.22), px = sx + spread * Math.pow(t, 1.25) + Math.sin(t * 9 + i) * 3;
x.lineTo(px, py); h.lineTo(px, py);
}
x.strokeStyle = 'rgba(255,190,200,' + (0.05 + rnd() * 0.06) + ')'; x.lineWidth = 0.8 + rnd(); x.stroke();
h.strokeStyle = 'rgba(160,160,160,0.7)'; h.lineWidth = 1.6; h.stroke();
}
var id = x.getImageData(0, 0, W, H), d = id.data;
for (var p = 0; p < d.length; p += 4) { var n = (Math.random() - 0.5) * 14; d[p] += n; d[p + 1] += n * 0.5; d[p + 2] += n * 0.6; }
x.putImageData(id, 0, 0);
var hd = h.getImageData(0, 0, W, H).data, nm = x.createImageData(W, H), nd = nm.data;
function at(ix, iy) { ix = Math.min(W - 1, Math.max(0, ix)); iy = Math.min(H - 1, Math.max(0, iy)); return hd[(iy * W + ix) * 4] / 255; }
for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < W; xx++) {
var dx = (at(xx + 1, yy) - at(xx - 1, yy)) * 2.5, dy = (at(xx, yy + 1) - at(xx, yy - 1)) * 2.5;
var l = Math.hypot(dx, dy, 1), o = (yy * W + xx) * 4;
nd[o] = (-dx / l * 0.5 + 0.5) * 255; nd[o + 1] = (dy / l * 0.5 + 0.5) * 255; nd[o + 2] = (1 / l * 0.5 + 0.5) * 255; nd[o + 3] = 255;
}
var nc = document.createElement('canvas'); nc.width = W; nc.height = H; nc.getContext('2d').putImageData(nm, 0, 0);
var map = new T.CanvasTexture(col); map.colorSpace = T.SRGBColorSpace; map.anisotropy = 4;
var normal = new T.CanvasTexture(nc); normal.anisotropy = 4;
return { map: map, normal: normal };
}
function petalPositions(P, sx, sy, open) {
var out = new Float32Array((sx + 1) * (sy + 1) * 3), uv = new Float32Array((sx + 1) * (sy + 1) * 2);
var rc = U.lerp(P.rcClosed, P.rcOpen, Math.pow(open, 0.8));
var bend = U.lerp(P.bendClosed, P.bendOpen, open), roll = P.roll * open;
var k = 0, q = 0;
for (var j = 0; j <= sy; j++) {
var v = j / sy;
for (var i = 0; i <= sx; i++) {
var u = i / sx, xn = u * 2 - 1;
var notch = 0.06 * Math.exp(-xn * xn / 0.04);
var vy = v * (1 - notch * Math.pow(v, 6));
var sm = Math.min(1, vy / 0.55); sm = sm * sm * (3 - 2 * sm);
var width = (0.22 + 0.78 * sm) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, vy - 0.5) / 0.52, 4)));
var X0 = xn * 0.5 * P.W * width;
var r = rc * (1 + vy * 0.35 * (1 - open * 0.3));
var th = X0 / r;
var X = r * Math.sin(th);
var Z = -r * (1 - Math.cos(th));
var Y = vy * P.L;
var ax = Math.abs(xn);
Z += -bend * vy * vy * P.L;
var up = Math.max(0, vy - 0.35) / 0.65;
Z += roll * up * up * up * P.L * 0.3 * (0.6 + 0.4 * ax * ax);
var side = roll * ax * ax * Math.pow(vy, 1.8) * P.W * 0.22;
X += Math.sign(xn) * side * 0.25; Z += side;
Z += 0.012 * P.L * Math.sin(xn * 6.5 + P.seed) * Math.pow(vy, 3) * (0.35 + open);
Z += 0.006 * P.L * Math.exp(-xn * xn / 0.01) * (1 - vy);
out[k++] = X; out[k++] = Y; out[k++] = Z;
uv[q++] = u; uv[q++] = v;
}
}
return { pos: out, uv: uv };
}
function petalGeometry(T, P, sx, sy) {
var g = new T.PlaneGeometry(1, 1, sx, sy);
var bud = petalPositions(P, sx, sy, 0), open = petalPositions(P, sx, sy, 1);
var pos = new T.BufferAttribute(new Float32Array(bud.pos), 3);
pos.setUsage(T.DynamicDrawUsage);
g.setAttribute('position', pos);
g.setAttribute('uv', new T.BufferAttribute(bud.uv, 2));
g.computeVertexNormals();
g.attributes.normal.setUsage(T.DynamicDrawUsage);
g.userData = { bud: bud.pos, open: open.pos };
return g;
}
function Envelope(nA, nY, y0, y1) {
this.nA = nA; this.nY = nY; this.y0 = y0; this.y1 = y1;
this.r = new Float32Array(nA * nY);
}
Envelope.prototype.clear = function () { this.r.fill(0); };
Envelope.prototype.cell = function (a, y) {
var ia = Math.floor((a / (Math.PI * 2) + 0.5) * this.nA); ia = ((ia % this.nA) + this.nA) % this.nA;
var iy = Math.floor((y - this.y0) / (this.y1 - this.y0) * this.nY);
if (iy < 0 || iy >= this.nY) return -1;
return iy * this.nA + ia;
};
Envelope.prototype.sample = function (a, y) {
var fa = (a / (Math.PI * 2) + 0.5) * this.nA - 0.5, fy = (y - this.y0) / (this.y1 - this.y0) * this.nY - 0.5;
var ia = Math.floor(fa), iy = Math.floor(fy), ta = fa - ia, ty = fy - iy, nA = this.nA, nY = this.nY, R = this.r;
function g(x, z) { if (z < 0 || z >= nY) return 0; x = ((x % nA) + nA) % nA; return R[z * nA + x]; }
var top = g(ia, iy) * (1 - ta) + g(ia + 1, iy) * ta, bot = g(ia, iy + 1) * (1 - ta) + g(ia + 1, iy + 1) * ta;
return Math.max(top * (1 - ty) + bot * ty, 0.8 * Math.max(g(ia, iy), g(ia + 1, iy), g(ia, iy + 1), g(ia + 1, iy + 1)));
};
Envelope.prototype.add = function (a, y, r) {
for (var d = -2; d <= 2; d++) for (var e = -2; e <= 2; e++) {
var c = this.cell(a + d * Math.PI * 2 / this.nA, y + e * (this.y1 - this.y0) / this.nY);
var rr = r - (Math.abs(d) + Math.abs(e)) * 0.004;
if (c >= 0 && this.r[c] < rr) this.r[c] = rr;
}
};
function translucent(T, mat, color, amount) {
var uni = { uLightView: { value: new T.Vector3(0, 1, 0) }, uTransColor: { value: new T.Color(color) }, uTrans: { value: amount },
uTime: { value: 0 }, uExcite: { value: 0 } };
mat.onBeforeCompile = function (sh) {
Object.assign(sh.uniforms, uni);
sh.vertexShader = sh.vertexShader
.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uExcite; attribute vec2 aLife;')
.replace('#include <begin_vertex>', [
'#include <begin_vertex>',
'{',
'  float tip = uv.y * uv.y;',
'  float br = sin(uTime * aLife.y * 1.4 + aLife.x) * (0.004 + 0.006 * tip);',
'  float tr = uExcite * (sin(uTime * 8.5 * aLife.y + aLife.x + uv.x * 3.0) * 0.003 + sin(uTime * 3.1 + aLife.x) * 0.006) * tip;',
'  transformed += objectNormal * (br + tr);',
'}'
].join('\n'));
sh.fragmentShader = sh.fragmentShader
.replace('#include <common>', '#include <common>\nuniform vec3 uLightView; uniform vec3 uTransColor; uniform float uTrans;')
.replace('#include <opaque_fragment>', [
'{',
'  vec3 Vt = normalize(vViewPosition);',
'  vec3 Lt = normalize(uLightView);',
'  float back = max(dot(-normal, Lt), 0.0);',
'  float through = pow(max(dot(-Vt, Lt), 0.0), 3.0);',
'  outgoingLight += uTransColor * diffuseColor.rgb * uTrans * (back * 0.55 + through * 0.9);',
'}',
'#include <opaque_fragment>'
].join('\n'));
};
mat.customProgramCacheKey = function () { return 'rose-translucent'; };
return uni;
}
function leafTexture(T) {
var W = 256, H = 384, c = document.createElement('canvas'); c.width = W; c.height = H;
var x = c.getContext('2d');
x.beginPath();
for (var i = 0; i <= 60; i++) {
var t = i / 60, a = t * Math.PI;
var r = Math.sin(a) * (0.92 + 0.08 * ((i % 2) ? 1 : -0.6));
var px = W / 2 + Math.sin(a) * r * W * 0.46 * (t < 0.5 ? 1 : 1), py = H * (1 - t);
if (i === 0) x.moveTo(W / 2, H); else x.lineTo(px, py);
}
for (var k = 60; k >= 0; k--) {
var t2 = k / 60, a2 = t2 * Math.PI, r2 = Math.sin(a2) * (0.92 + 0.08 * ((k % 2) ? 1 : -0.6));
x.lineTo(W / 2 - Math.sin(a2) * r2 * W * 0.46, H * (1 - t2));
}
x.closePath();
var g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#3f6a3a'); g.addColorStop(1, '#1e3b22');
x.fillStyle = g; x.fill();
x.strokeStyle = 'rgba(160,200,140,0.35)'; x.lineWidth = 2;
x.beginPath(); x.moveTo(W / 2, H); x.lineTo(W / 2, 8); x.stroke();
for (var v = 1; v < 9; v++) {
var y0 = H - v * H / 10;
x.lineWidth = 1;
x.beginPath(); x.moveTo(W / 2, y0); x.quadraticCurveTo(W / 2 + 40, y0 - 30, W / 2 + 90, y0 - 60); x.stroke();
x.beginPath(); x.moveTo(W / 2, y0); x.quadraticCurveTo(W / 2 - 40, y0 - 30, W / 2 - 90, y0 - 60); x.stroke();
}
var tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
return tx;
}
Card.three.module('rose', function (ctx, o) {
var T = ctx.THREE;
var N = Math.round((o.petals || 34) * (ctx.lowEnd ? 0.65 : 1));
var phone = Math.min(screen.width, screen.height) < 600;
var sx = ctx.lowEnd ? 10 : phone ? 14 : 18, sy = ctx.lowEnd ? 14 : phone ? 20 : 24;
var cols = Object.assign({ base: '#3a0410', body: '#a3132f', edge: '#7a0a24', vein: '#ff9fb0' }, o.colors || {});
var group = new T.Group(), head = new T.Group();
group.add(head);
if (o.position) group.position.fromArray(o.position);
group.scale.setScalar(o.size || 1);
var tex = paintPetal(T, cols);
var petalMat = new T.MeshPhysicalMaterial({
map: tex.map, normalMap: tex.normal, normalScale: new T.Vector2(0.35, 0.35),
roughness: 0.64, metalness: 0, side: T.DoubleSide,
sheen: 1, sheenRoughness: 0.32, sheenColor: new T.Color(o.sheen || '#ff8aa6'),
envMapIntensity: 0.9
});
var trans = translucent(T, petalMat, o.translucency || '#ff4a6a', 0.9);
var petals = [], pick = [];
var golden = Math.PI * (3 - Math.sqrt(5));
for (var i = 0; i < N; i++) {
var t = i / (N - 1);
var P = {
t: t,
L: 0.32 + 0.78 * Math.pow(t, 0.8), W: 0,
rcClosed: 0, rcOpen: 0.22 + 0.75 * t,
bendClosed: 0.1 + (1 - t) * 0.1, bendOpen: -0.02 - t * 0.08,
roll: 0.25 + t * 0.55, seed: i * 2.39
};
P.W = P.L * (0.92 + 0.12 * Math.sin(i * 1.7));
P.dist = 0.012 + 0.2 * Math.pow(t, 0.85);
P.rcClosed = Math.max(P.dist + 0.01, P.W * 0.5 / 1.3);
var geo = petalGeometry(T, P, sx, sy);
var nv = geo.attributes.position.count, life = new Float32Array(nv * 2), ph0 = Math.random() * 6.28, sp0 = 0.8 + Math.random() * 0.6;
for (var lv = 0; lv < nv; lv++) { life[lv * 2] = ph0; life[lv * 2 + 1] = sp0; }
geo.setAttribute('aLife', new T.BufferAttribute(life, 2));
var mesh = new T.Mesh(geo, petalMat);
mesh.castShadow = mesh.receiveShadow = true;
mesh.frustumCulled = false;
head.add(mesh);
petals.push({ mesh: mesh, geo: geo, t: t, i: i, ph: ph0, sp: sp0, laid: new Float32Array(nv * 3), snap: null, prevO: -1,
angle: i * golden + (Math.random() - 0.5) * 0.08, dist: P.dist, y: -0.05 * t,
closed: 0.02 - (1 - t) * 0.05, openTilt: 0.04 + 1.0 * Math.pow(t, 2.2),
maxOpen: 0.08 + 0.92 * Math.pow(Math.min(1, Math.max(0, (t - 0.12) / 0.75)), 1.2), o: -1, tilt: 0 });
pick.push(mesh);
}
var order = petals.slice().sort(function (a, b) { return b.t - a.t; });
order.forEach(function (P, k) { P.order = k; });
var count = N;
function slice(P) { var w = 1 / count; return [P.order * w * 0.82, P.order * w * 0.82 + w * 3.2]; }
var greenMat = new T.MeshPhysicalMaterial({ color: new T.Color('#2f5a33'), roughness: 0.6, sheen: 0.6, sheenColor: new T.Color('#9fd28a'), side: T.DoubleSide, envMapIntensity: 0.6 });
for (var s = 0; s < 5; s++) {
var sg = new T.PlaneGeometry(0.14, 0.42, 4, 12), sp = sg.attributes.position;
for (var q = 0; q < sp.count; q++) {
var yy = sp.getY(q) + 0.21, xx = sp.getX(q), w = Math.pow(1 - yy / 0.42, 0.8) * (0.4 + 0.6 * Math.min(1, yy * 8));
sp.setXYZ(q, xx * w, yy, Math.pow(yy, 2) * 2.2 - Math.abs(xx) * 0.3);
}
sg.computeVertexNormals();
var sep = new T.Mesh(sg, greenMat), sv = new T.Group();
sep.castShadow = true;
sep.rotation.x = 2.2; sep.position.set(0, -0.08, 0.08);
sv.rotation.y = s / 5 * Math.PI * 2 + 0.3;
sv.add(sep); group.add(sv);
}
var curve = new T.CatmullRomCurve3([new T.Vector3(0, -0.05, 0), new T.Vector3(0.04, -0.9, 0.04), new T.Vector3(-0.06, -2.0, 0), new T.Vector3(0.03, -3.8, -0.05)]);
var stem = new T.Mesh(new T.TubeGeometry(curve, 64, 0.042, 12, false), greenMat);
stem.castShadow = true;
group.add(stem);
var receptacle = new T.Mesh(new T.SphereGeometry(0.11, 24, 16), greenMat);
receptacle.scale.set(1, 0.8, 1); receptacle.position.y = -0.07;
group.add(receptacle);
var thornMat = new T.MeshStandardMaterial({ color: new T.Color('#5a3a2a'), roughness: 0.5 });
[0.35, 0.6, 0.82].forEach(function (u, k) {
var p = curve.getPointAt(u), th = new T.Mesh(new T.ConeGeometry(0.018, 0.09, 8), thornMat);
th.position.copy(p); th.rotation.z = k % 2 ? 1.1 : -1.1; th.rotation.y = k * 2.1;
th.position.x += k % 2 ? -0.04 : 0.04;
group.add(th);
});
var leafMat = new T.MeshPhysicalMaterial({ map: leafTexture(T), alphaTest: 0.5, side: T.DoubleSide, roughness: 0.45, sheen: 0.4, sheenColor: new T.Color('#b9e0a0'), envMapIntensity: 0.8 });
[[-1.25, 0.8, 1.1], [-2.2, -0.9, -2.0]].forEach(function (l) {
var lg = new T.PlaneGeometry(0.42, 0.62, 8, 12), lp = lg.attributes.position;
for (var q = 0; q < lp.count; q++) { var yy = lp.getY(q) + 0.31; lp.setZ(q, -Math.abs(lp.getX(q)) * 0.25 - yy * yy * 0.35); lp.setY(q, yy); }
lg.computeVertexNormals();
var leaf = new T.Mesh(lg, leafMat), holder = new T.Group();
leaf.castShadow = true;
leaf.rotation.x = 0.9;
holder.position.copy(curve.getPointAt(l[0] < -2 ? 0.55 : 0.3));
holder.rotation.set(0, l[2], l[1]);
holder.add(leaf); group.add(holder);
});
var dewMat = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, metalness: 0, transmission: 1, ior: 1.33, thickness: 0.03, envMapIntensity: 1.6, specularIntensity: 1 });
var drops = [];
var outer = petals.filter(function (P) { return P.t > 0.6; });
for (var dI = 0; dI < (o.dew == null ? 7 : o.dew) && outer.length; dI++) {
var host = outer[(dI * 5) % outer.length], rad = 0.016 + Math.random() * 0.014;
var drop = new T.Mesh(new T.SphereGeometry(rad, 16, 12), dewMat);
drop.scale.set(1, 0.6, 1);
var col = Math.round(sx * (0.3 + Math.random() * 0.4)), row = Math.round(sy * (0.45 + Math.random() * 0.35));
drops.push({ mesh: drop, host: host, v: row * (sx + 1) + col, r: rad });
head.add(drop);
}
var photoMesh = null, photoMat = null, photoTex = [], photoIdx = 0, srcs = (o.photos || []).slice(0, 10);
if (srcs.length) {
var R = o.photoSize || 0.42;
photoMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false });
photoMesh = new T.Mesh(new T.CircleGeometry(R, 64), photoMat);
var ring = new T.Mesh(new T.RingGeometry(R, R * 1.07, 64), new T.MeshBasicMaterial({ color: new T.Color('#f6eee6'), transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, depthTest: false }));
ring.renderOrder = 5; photoMesh.renderOrder = 6;
photoMesh.add(ring);
photoMesh.rotation.x = -Math.PI / 2;
head.add(photoMesh);
pick.push(photoMesh);
srcs.forEach(function (src, k) {
var img = new Image();
img.onload = function () {
var c = document.createElement('canvas'); c.width = c.height = 512;
var x = c.getContext('2d'), r = Math.max(512 / (img.width || 512), 512 / (img.height || 512));
x.drawImage(img, (512 - (img.width || 512) * r) / 2, (512 - (img.height || 512) * r) / 2, (img.width || 512) * r, (img.height || 512) * r);
var tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; photoTex[k] = tx;
if (k === photoIdx) { photoMat.map = tx; photoMat.needsUpdate = true; }
};
img.src = src;
});
}
var key = ctx.lights.key;
if (ctx.renderer.shadowMap.enabled) {
key.castShadow = true;
key.shadow.mapSize.set(ctx.lowEnd || phone ? 1024 : 2048, ctx.lowEnd || phone ? 1024 : 2048);
ctx.renderer.shadowMap.autoUpdate = false;
ctx.renderer.shadowMap.needsUpdate = true;
var sc = key.shadow.camera; sc.left = sc.bottom = -1.6; sc.right = sc.top = 1.6; sc.near = 0.5; sc.far = 20;
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
key.target.position.copy(group.position);
ctx.scene.add(key.target);
}
var bloom = 0, excite = 0, exciteNow = 0, pulse = 0, tmp = new T.Vector3(), frameN = 0;
var env = new Envelope(ctx.lowEnd ? 96 : 160, ctx.lowEnd ? 56 : 90, -0.3, 1.6);
var baked = null;
function layAll(b) {
env.clear();
for (var n = 0; n < petals.length; n++) {
var Q = petals[n], sl = slice(Q);
var w = U.clamp((b - sl[0]) / (sl[1] - sl[0])); w = w * w * (3 - 2 * w) * Q.maxOpen;
var tilt = U.lerp(Q.closed, Q.openTilt, w);
var g = Q.geo, posA = g.attributes.position.array, bud = g.userData.bud, opn = g.userData.open, laid = Q.laid;
var ca = Math.cos(Q.angle), sa = Math.sin(Q.angle), ct = Math.cos(tilt), st = Math.sin(tilt), gap = 0.005 + Q.t * 0.004;
for (var vI = 0; vI < posA.length; vI += 3) {
var lx = bud[vI] + (opn[vI] - bud[vI]) * w, ly = bud[vI + 1] + (opn[vI + 1] - bud[vI + 1]) * w, lz = bud[vI + 2] + (opn[vI + 2] - bud[vI + 2]) * w;
var ty = ly * ct - lz * st, tz = ly * st + lz * ct + Q.dist;
var hx = lx * ca + tz * sa, hz = -lx * sa + tz * ca, hy = ty + Q.y;
var r = Math.sqrt(hx * hx + hz * hz), a = Math.atan2(hx, hz);
if (n > 0) {
var need = env.sample(a, hy) + gap;
if (need > gap && r < need) { var k = need / Math.max(r, 1e-4); hx *= k; hz *= k; r = need; }
}
posA[vI] = hx; posA[vI + 1] = hy; posA[vI + 2] = hz;
laid[vI] = a; laid[vI + 1] = hy; laid[vI + 2] = r;
}
for (var m = 0; m < laid.length; m += 3) env.add(laid[m], laid[m + 1], laid[m + 2]);
g.computeVertexNormals();
}
}
if (o.bake) {
var K = o.bake === true ? 12 : o.bake, top = o.bloomMax || 1;
petals.forEach(function (P) { P.keys = []; P.nkeys = []; });
for (var kf = 0; kf <= K; kf++) {
layAll(top * kf / K);
petals.forEach(function (P) {
P.keys.push(new Float32Array(P.geo.attributes.position.array));
P.nkeys.push(new Float32Array(P.geo.attributes.normal.array));
});
}
petals.forEach(function (P) {
var g = P.geo;
g.setAttribute('position', new T.BufferAttribute(new Float32Array(P.keys[0]), 3));
g.setAttribute('normal', new T.BufferAttribute(new Float32Array(P.nkeys[0]), 3));
g.morphAttributes.position = P.keys.slice(1).map(function (a) { return new T.BufferAttribute(a, 3); });
g.morphAttributes.normal = P.nkeys.slice(1).map(function (a) { return new T.BufferAttribute(a, 3); });
P.mesh.updateMorphTargets();
});
baked = { K: K, top: top, at: -1 };
}
function showBaked(b) {
var x = U.clamp(b / baked.top) * baked.K, k0 = Math.min(baked.K - 1, Math.floor(x)), t = x - k0;
if (Math.abs(x - baked.at) < 0.002) return;
baked.at = x;
for (var i = 0; i < petals.length; i++) {
var inf = petals[i].mesh.morphTargetInfluences;
for (var j = 0; j < inf.length; j++) inf[j] = 0;
if (k0 > 0) inf[k0 - 1] = 1 - t;
inf[k0] = t;
}
for (var d = 0; d < drops.length; d++) {
var D = drops[d], A = D.host.keys[k0], B = D.host.keys[k0 + 1], NA = D.host.nkeys[k0], NB = D.host.nkeys[k0 + 1], j3 = D.v * 3;
for (var c = 0; c < 3; c++) D.at[c] = A[j3 + c] + (B[j3 + c] - A[j3 + c]) * t + (NA[j3 + c] + (NB[j3 + c] - NA[j3 + c]) * t) * D.r * 0.6;
D.mesh.position.set(D.at[0], D.at[1], D.at[2]);
D.mesh.visible = x / baked.K * baked.top > 0.2;
}
}
drops.forEach(function (D) { D.at = [0, 0, 0]; });
return {
group: group,
pick: pick,
count: count,
opened: function (p) { return petals.filter(function (P) { return p >= slice(P)[1] * 0.92; }).length; },
excite: function (v) { excite = U.clamp(v); },
reset: function () { bloom = 0; excite = exciteNow = 0; if (baked) baked.at = -1; petals.forEach(function (P) { P.prevO = -1; P.laidOnce = false; }); },
nextPhoto: function () {
if (srcs.length < 2) return;
photoIdx = (photoIdx + 1) % srcs.length;
if (photoTex[photoIdx]) { photoMat.map = photoTex[photoIdx]; photoMat.needsUpdate = true; }
pulse = 1;
},
tap: function (hit) {
if (photoMesh && hit && hit.object === photoMesh && photoMat.opacity > 0.5) { this.nextPhoto(); return; }
pulse = 1;
},
update: function (time, dt, p) {
var br = o.bloomRange, bp = br ? U.clamp((p - br[0]) / (br[1] - br[0])) * (o.bloomMax || 1) : U.clamp(p);
if (o.bloom != null) bloom = o.bloom; else bloom += (bp - bloom) * Math.min(1, dt * (o.bloomRate || 2.6));
exciteNow += (excite - exciteNow) * Math.min(1, dt * 4);
var photoUp = photoMesh ? U.clamp((bloom - 0.9) / 0.1) : 0;
if (baked) showBaked(bloom);
var first = -1;
for (var i = 0; i < (baked ? 0 : petals.length); i++) {
var P = petals[i], sl = slice(P);
var o2 = U.clamp((bloom - sl[0]) / (sl[1] - sl[0]));
o2 = o2 * o2 * (3 - 2 * o2) * P.maxOpen;
o2 = Math.min(1, o2 + photoUp * (1 - P.t) * 0.5);
P.oNow = o2;
P.tiltNow = U.lerp(P.closed, P.openTilt, o2);
if (first < 0 && (P.prevO < 0 || Math.abs(o2 - P.prevO) > 0.0015 || P.moving)) first = i;
}
if (first >= 0) {
if (first === 0) env.clear(); else env.r.set(petals[first - 1].snap);
var glide = o.settle ? 1 - Math.exp(-dt * o.settle) : 1;
for (var n = first; n < petals.length; n++) {
var Q = petals[n], g = Q.geo, posA = g.attributes.position.array, bud = g.userData.bud, opn = g.userData.open, laid = Q.laid;
var ca = Math.cos(Q.angle), sa = Math.sin(Q.angle), ct = Math.cos(Q.tiltNow), st = Math.sin(Q.tiltNow), w = Q.oNow;
var gap = 0.005 + Q.t * 0.004, moved = 0;
for (var vI = 0; vI < posA.length; vI += 3) {
var lx = bud[vI] + (opn[vI] - bud[vI]) * w, ly = bud[vI + 1] + (opn[vI + 1] - bud[vI + 1]) * w, lz = bud[vI + 2] + (opn[vI + 2] - bud[vI + 2]) * w;
var ty = ly * ct - lz * st, tz = ly * st + lz * ct + Q.dist;
var hx = lx * ca + tz * sa, hz = -lx * sa + tz * ca, hy = ty + Q.y;
var r = Math.sqrt(hx * hx + hz * hz), a = Math.atan2(hx, hz);
if (n > 0) {
var need = env.sample(a, hy) + gap;
if (need > gap && r < need) { var k = need / Math.max(r, 1e-4); hx *= k; hz *= k; r = need; }
}
if (glide < 1 && Q.laidOnce) {
var nx = posA[vI] + (hx - posA[vI]) * glide, ny = posA[vI + 1] + (hy - posA[vI + 1]) * glide, nz = posA[vI + 2] + (hz - posA[vI + 2]) * glide;
moved = Math.max(moved, Math.abs(nx - posA[vI]) + Math.abs(ny - posA[vI + 1]) + Math.abs(nz - posA[vI + 2]));
hx = nx; hy = ny; hz = nz;
r = Math.sqrt(hx * hx + hz * hz); a = Math.atan2(hx, hz);
}
posA[vI] = hx; posA[vI + 1] = hy; posA[vI + 2] = hz;
laid[vI] = a; laid[vI + 1] = hy; laid[vI + 2] = r;
}
for (var m = 0; m < laid.length; m += 3) env.add(laid[m], laid[m + 1], laid[m + 2]);
if (!Q.snap) Q.snap = new Float32Array(env.r.length);
Q.snap.set(env.r);
Q.prevO = Q.oNow;
Q.laidOnce = true;
Q.moving = moved > 0.0002;
g.attributes.position.needsUpdate = true;
g.computeVertexNormals();
g.attributes.normal.needsUpdate = true;
}
if (ctx.renderer.shadowMap.enabled) ctx.renderer.shadowMap.needsUpdate = true;
g = null;
}
trans.uTime.value = time;
trans.uExcite.value = exciteNow;
if (ctx.renderer.shadowMap.enabled && (++frameN % 6 === 0)) ctx.renderer.shadowMap.needsUpdate = true;
for (var dd = 0; dd < (baked ? 0 : drops.length); dd++) {
var D = drops[dd], ga = D.host.geo.attributes, j3 = D.v * 3;
D.mesh.position.set(ga.position.array[j3] + ga.normal.array[j3] * D.r * 0.6,
ga.position.array[j3 + 1] + ga.normal.array[j3 + 1] * D.r * 0.6,
ga.position.array[j3 + 2] + ga.normal.array[j3 + 2] * D.r * 0.6);
D.mesh.visible = D.host.oNow > 0.35;
}
if (photoMesh) {
photoMat.opacity = photoUp;
photoMesh.children[0].material.opacity = photoUp;
photoMesh.position.y = 0.12 + photoUp * 0.42;
}
pulse = Math.max(0, pulse - dt * 1.6);
head.scale.setScalar(1 + Math.sin(pulse * Math.PI) * 0.05);
group.rotation.z = Math.sin(time * 0.5) * 0.025;
group.rotation.x = Math.sin(time * 0.37 + 1) * 0.018;
head.rotation.y = time * 0.035;
tmp.copy(key.position).sub(key.target.position).normalize().transformDirection(ctx.camera.matrixWorldInverse);
trans.uLightView.value.copy(tmp);
}
};
});
})();
