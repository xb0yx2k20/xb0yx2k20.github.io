(function () {
'use strict';
if (!Card.three) return;
function rosePetal(T, w, h, cup, roll, sx, sy, seed) {
var g = new T.PlaneGeometry(1, 1, sx, sy), p = g.attributes.position;
for (var i = 0; i < p.count; i++) {
var x = p.getX(i), y = p.getY(i) + 0.5;
var wp = Math.pow(Math.sin(Math.PI * Math.min(0.97, Math.pow(y, 0.78))), 0.32) * (0.55 + 0.45 * Math.min(1, y * 1.6));
var ax = Math.abs(x * 2);
var X = x * w * wp;
var Z = -cup * ax * ax * h * 0.36 * wp
+ roll * Math.pow(ax, 4) * Math.pow(y, 1.5) * h * 0.5
+ roll * Math.pow(y, 6) * h * 0.35
+ 0.018 * h * Math.sin(x * 9 + seed) * y;
p.setXYZ(i, X, y * h * (1 - 0.06 * ax * ax), Z);
}
g.computeVertexNormals();
return g;
}
Card.three.module('flower', function (ctx, o) {
var T = ctx.THREE;
var rose = o.shape === 'rose', detail = o.detail || 1, flutter = o.flutter || 0, excite = 0, exciteNow = 0;
var layers = o.layers || 3, per = o.petals || 6, size = o.size || 1;
var group = new T.Group();
var head = new T.Group();
group.add(head);
if (o.position) group.position.set(o.position[0], o.position[1], o.position[2]);
group.scale.setScalar(size);
var mat = o.material === 'velvet'
? new T.MeshPhysicalMaterial({ vertexColors: true, side: T.DoubleSide, roughness: o.roughness == null ? 0.7 : o.roughness, metalness: 0,
sheen: 1, sheenRoughness: 0.45, sheenColor: new T.Color(o.sheen || '#ffd0d8'),
emissive: new T.Color(o.color || '#f2a7b5'), emissiveIntensity: o.glow == null ? 0.02 : o.glow })
: new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: o.roughness == null ? 0.55 : o.roughness, metalness: 0,
emissive: new T.Color(o.color || '#f2a7b5'), emissiveIntensity: o.glow == null ? 0.16 : o.glow });
var petals = [], pick = [], seq = o.open === 'sequence', bud = !!o.bud;
for (var L = 0; L < layers; L++) {
var inner = L / Math.max(1, layers - 1);
var len = 1.25 - inner * 0.35, wid = 0.78 - inner * 0.18;
var geos = [];
for (var v = 0; v < (rose ? 3 : 1); v++) {
var gw = wid * (rose ? 1.25 + (v - 1) * 0.07 : 1), gl = len * (rose ? 0.92 + (v - 1) * 0.05 : 1);
geos.push(ctx.gradeColors(rose
? rosePetal(T, gw, gl, 0.75 + inner * 0.35, 0.22 - inner * 0.08, 10 * detail, 14 * detail, v * 2.1 + L)
: ctx.petalGeometry(wid, len, 0.55 + inner * 0.25, 0.08, 6 * detail, 12 * detail),
o.base || '#b8576d', o.color || '#f2a7b5', o.tip || '#fff1f2'));
}
var n = per + (L === 0 ? 1 : 0);
for (var i = 0; i < n; i++) {
var pivot = new T.Group();
pivot.rotation.y = (i / n) * Math.PI * 2 + L * 0.55 + (rose ? (Math.random() - 0.5) * 0.18 : 0);
var m = new T.Mesh(geos[i % geos.length], mat);
if (rose) m.rotation.z = (Math.random() - 0.5) * 0.12;
m.position.z = 0.04 + (1 - inner) * 0.08;
pivot.add(m);
head.add(pivot);
petals.push({ mesh: m, layer: L, inner: inner, jitter: Math.random() * 0.12, i: i, n: n, ph: Math.random() * 6.28, sp: 0.8 + Math.random() * 0.7 });
pick.push(m);
}
}
petals.slice().sort(function (A, B) {
return A.layer - B.layer || ((A.i % 2) - (B.i % 2)) || A.i - B.i;
}).forEach(function (P, k) { P.order = k; });
var count = petals.length;
function slice(P) { var w = 1 / count; return [P.order * w * 0.9, P.order * w * 0.9 + w * 2.2]; }
var heartMat = new T.MeshStandardMaterial({ color: o.center || '#f3c969', roughness: 0.8, emissive: new T.Color(o.center || '#f3c969'), emissiveIntensity: 0.15 });
var heart = new T.Mesh(new T.SphereGeometry(0.16, 16 * detail, 12 * detail), heartMat);
heart.scale.y = 0.7;
heart.position.y = 0.06;
head.add(heart);
pick.push(heart);
var stamMat = new T.MeshStandardMaterial({ color: o.stamen || '#fff4d6', roughness: 0.6 });
var tipMat = new T.MeshStandardMaterial({ color: o.pollen || '#e0a43a', roughness: 0.7, emissive: new T.Color(o.pollen || '#e0a43a'), emissiveIntensity: 0.2 });
var stamens = new T.Group();
head.add(stamens);
for (var s = 0; s < 7; s++) {
var a = (s / 7) * Math.PI * 2, st = new T.Group();
st.rotation.y = a;
var stalk = new T.Mesh(new T.CylinderGeometry(0.008, 0.012, 0.42, 5), stamMat);
stalk.position.y = 0.21; stalk.rotation.z = 0.25;
var knob = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), tipMat);
knob.position.set(-0.1, 0.42, 0);
st.add(stalk, knob);
stamens.add(st);
}
var stemColor = o.stemColor || (typeof o.stem === 'string' ? o.stem : '#4f7a52');
var stemMat = new T.MeshStandardMaterial({ color: stemColor, roughness: 0.7 });
var curve = new T.CatmullRomCurve3([new T.Vector3(0, 0, 0), new T.Vector3(0.05, -0.9, 0.05), new T.Vector3(-0.08, -2.1, 0), new T.Vector3(0.04, -3.6, -0.05)]);
var stemGroup = new T.Group();
group.add(stemGroup);
if (o.stem === false) stemGroup.visible = false;
stemGroup.add(new T.Mesh(new T.TubeGeometry(curve, 24 * detail, 0.045, 6 * detail, false), stemMat));
var leafGeo = ctx.gradeColors(ctx.petalGeometry(0.42, 1.1, 0.5, 0.12, 4 * detail, 8 * detail), '#3e6a45', typeof o.stem === 'string' ? o.stem : (o.stemColor || '#5d8a5e'), '#86ad7c');
var leafMat = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.7 });
[[-1.2, 0.9, 1.0], [-2.1, -0.8, -2.2]].forEach(function (l) {
var leaf = new T.Mesh(leafGeo, leafMat);
leaf.position.set(0, l[0], 0);
leaf.rotation.set(0, l[2], l[1]);
stemGroup.add(leaf);
});
var photoMesh = null, photoTex = [], photoIdx = 0, photoMat = null;
var srcs = (o.photos || []).slice(0, 10);
if (srcs.length) {
photoMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, depthTest: false });
photoMesh = new T.Mesh(new T.CircleGeometry(o.photoSize || 0.5, 48), photoMat);
photoMesh.rotation.x = -Math.PI / 2;
photoMesh.position.y = 0.02;
photoMesh.renderOrder = 4;
var ring = new T.Mesh(new T.RingGeometry((o.photoSize || 0.5), (o.photoSize || 0.5) * 1.08, 48),
new T.MeshBasicMaterial({ color: new T.Color(o.photoRing || '#fff6ee'), transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, depthTest: false }));
ring.renderOrder = 3;
ring.position.z = -0.001;
photoMesh.add(ring);
head.add(photoMesh);
pick.push(photoMesh);
srcs.forEach(function (src, k) {
var img = new Image();
img.onload = function () {
var c = document.createElement('canvas'); c.width = c.height = 512;
var x = c.getContext('2d'), r = Math.max(512 / (img.width || 512), 512 / (img.height || 512));
var w = (img.width || 512) * r, h = (img.height || 512) * r;
x.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
var tx = new T.CanvasTexture(c);
tx.colorSpace = T.SRGBColorSpace;
photoTex[k] = tx;
if (k === photoIdx) { photoMat.map = tx; photoMat.needsUpdate = true; }
};
img.src = src;
});
}
var pulse = 0, bloomNow = typeof o.bloom === 'number' ? o.bloom : 0;
var from = o.bloomFrom != null ? o.bloomFrom : 0.08, to = o.bloomTo != null ? o.bloomTo : 0.7;
var sway = o.sway == null ? 1 : o.sway;
return {
group: group,
pick: pick,
count: count,
excite: function (v) { excite = Card.util.clamp(v); },
opened: function (p) { return petals.filter(function (P) { return p >= slice(P)[1] * 0.92; }).length; },
nextPhoto: function () {
if (srcs.length < 2) return;
photoIdx = (photoIdx + 1) % srcs.length;
if (!photoTex[photoIdx]) return;
photoMat.map = photoTex[photoIdx]; photoMat.needsUpdate = true;
pulse = 1;
},
tap: function (hit) {
if (photoMesh && hit && hit.object === photoMesh && photoMat.opacity > 0.5) { this.nextPhoto(); return; }
pulse = 1;
},
update: function (t, dt, p) {
var target = (o.bloom === 'scroll' || seq) ? Card.util.clamp((p - from) / (to - from)) : bloomNow;
if (seq) target = Card.util.clamp(p);
bloomNow += (target - bloomNow) * Math.min(1, dt * 3);
exciteNow += (excite - exciteNow) * Math.min(1, dt * 4);
var b = bloomNow + Math.sin(t * 0.9) * 0.012;
var photoUp = photoMesh ? Card.util.clamp((bloomNow - 0.88) / 0.12) : 0;
for (var i = 0; i < petals.length; i++) {
var P = petals[i], lb;
if (seq) {
var sl = slice(P);
lb = Card.util.clamp((b - sl[0]) / (sl[1] - sl[0]));
} else {
lb = Card.util.clamp(b * 1.35 - P.inner * 0.35);
}
lb = lb * lb * (3 - 2 * lb);
var closed = bud ? -0.12 - P.inner * 0.08 : 0.1 + P.jitter;
var wide = seq ? (o.openAngle || 1.2) - P.inner * 0.45 + P.inner * (rose ? 1.1 : 0.55) * photoUp : 1.35 - P.inner * 0.75;
P.mesh.rotation.x = closed + lb * (wide - closed + (bud ? 0.1 : 0));
if (rose && photoMesh) P.mesh.scale.setScalar(1 - photoUp * Math.max(0, P.inner - 0.35) * 0.9);
if (flutter) {
var amp = flutter * (0.012 + lb * 0.02) + exciteNow * (0.015 + (lb > 0 && lb < 1 ? 0.03 : 0));
P.mesh.rotation.x += Math.sin(t * P.sp * 1.7 + P.ph) * amp + Math.sin(t * 9 * P.sp + P.ph) * exciteNow * 0.006;
}
}
if (photoMesh) {
var ph = Card.util.clamp((bloomNow - 0.88) / 0.12);
photoMat.opacity = ph;
photoMesh.children[0].material.opacity = ph;
photoMesh.position.y = 0.02 + ph * 0.32;
heart.scale.set(1 - ph * 0.6, 0.7 * (1 - ph * 0.6), 1 - ph * 0.6);
stamens.scale.setScalar(Math.max(0.001, 1 - ph));
}
pulse = Math.max(0, pulse - dt * 1.6);
var k = 1 + Math.sin(pulse * Math.PI) * 0.08;
head.scale.setScalar(k);
heartMat.emissiveIntensity = 0.15 + pulse * 0.6;
group.rotation.z = Math.sin(t * 0.55) * 0.035 * sway;
group.rotation.x = Math.sin(t * 0.4 + 1) * 0.025 * sway;
head.rotation.y = t * 0.06 * sway;
}
};
});
})();
