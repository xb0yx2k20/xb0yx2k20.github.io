(function () {
'use strict';
if (!Card.three) return;
var GLASS_VERT = [
'varying vec3 vN; varying vec3 vPos;',
'void main() {',
'  vec4 w = modelMatrix * vec4(position, 1.0);',
'  vPos = w.xyz; vN = normalize(mat3(modelMatrix) * normal);',
'  gl_Position = projectionMatrix * viewMatrix * w;',
'}'
].join('\n');
var GLASS_FRAG = [
'uniform sampler2D tScene; uniform vec2 uResolution; uniform vec3 uTint; uniform float uThick; uniform float uIor; uniform float uOpacity;',
'varying vec3 vN; varying vec3 vPos;',
'__SKY__',
'float ggx(float NdH, float a) { float a2 = a * a; float d = NdH * NdH * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }',
'void main() {',
'  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vPos);',
'  if (!gl_FrontFacing) N = -N;',
'  float NdV = clamp(dot(N, V), 0.0, 1.0);',
'  float path = uThick / max(NdV, 0.12);',
'  vec3 absorb = exp(-(vec3(1.0) - uTint) * path * 11.0) * mix(vec3(1.0), uTint, 0.35);',
'  vec3 rd = refract(-V, N, 1.0 / uIor);',
'  vec2 uv = gl_FragCoord.xy / uResolution;',
'  vec2 off = (rd.xy + V.xy) * 0.09 * (1.0 + path * 2.0);',
'  vec3 behind = vec3(texture2D(tScene, uv + off * 1.03).r, texture2D(tScene, uv + off).g, texture2D(tScene, uv + off * 0.97).b);',
'  float F = 0.04 + 0.7 * pow(1.0 - NdV, 5.0);',
'  vec3 R = reflect(-V, N);',
'  vec3 refl = skyColor(R, 2200.0);',
'  vec3 col = mix(behind * absorb, refl, F);',
'  vec3 L = normalize(uSunDir); vec3 H = normalize(L + V);',
'  col += uSunColor * uSun * ggx(max(dot(N, H), 0.0), 0.035) * F * 3.0;',
'  vec3 Hm = normalize(normalize(uMoonDir) + V);',
'  col += vec3(0.8, 0.85, 1.0) * uMoon * ggx(max(dot(N, Hm), 0.0), 0.05) * F;',
'  gl_FragColor = vec4(col, uOpacity);',
'}'
].join('\n');
Card.three.module('bottle', function (ctx, o) {
var T = ctx.THREE, U = Card.util;
var group = new T.Group(), body = new T.Group();
group.add(body);
var from = o.from || [3, -22], to = o.to || [0.35, 1.7], travel = o.travel || 9;
var prof = [[0, 0.03], [0.05, 0.012], [0.12, 0.0], [0.165, 0.004], [0.178, 0.025], [0.18, 0.08], [0.18, 0.52], [0.176, 0.565],
[0.15, 0.62], [0.11, 0.672], [0.08, 0.715], [0.068, 0.76], [0.065, 0.92], [0.07, 0.93], [0.077, 0.945], [0.077, 0.985], [0.066, 1.0]];
var outer = prof.map(function (p) { return new T.Vector2(p[0], p[1]); });
var inner = prof.slice(1, -1).map(function (p) { return new T.Vector2(Math.max(0.001, p[0] - 0.009), Math.min(0.995, p[1] + 0.012)); });
function glassMat(side) {
return new T.ShaderMaterial({
uniforms: Object.assign({ tScene: { value: null }, uResolution: { value: new T.Vector2(1, 1) },
uTint: { value: new T.Color(o.glass || '#3f7a55') }, uThick: { value: 0.07 }, uIor: { value: 1.5 }, uOpacity: { value: 1 } }, Card.three.skyUniforms(T)),
vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG.replace('__SKY__', Card.three.skyGLSL),
side: side, transparent: true, depthWrite: false
});
}
var mats = [glassMat(T.BackSide), glassMat(T.FrontSide)];
var refractive = !!ctx.pipeline;
var glassMeshes = [];
[[inner, mats[0]], [outer, mats[1]]].forEach(function (pair, k) {
var m = new T.Mesh(new T.LatheGeometry(pair[0], 56), refractive ? pair[1] :
new T.MeshPhysicalMaterial({ color: new T.Color(o.glass || '#4f7d63'), roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1, side: k ? T.FrontSide : T.BackSide, depthWrite: false }));
if (refractive) { m.layers.set(1); ctx.pipeline.refract(pair[1]); }
m.renderOrder = 3 + k;
body.add(m); glassMeshes.push(m);
});
var paperMat = new T.MeshStandardMaterial({ color: new T.Color(o.paper || '#efe4cc'), roughness: 0.92, side: T.DoubleSide });
var spiral = [];
for (var a = 0; a <= Math.PI * 2 * 2.6; a += 0.25) { var r = 0.03 + a * 0.0028; spiral.push(new T.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
var shape = new T.Shape(); shape.moveTo(spiral[0].x, spiral[0].y);
spiral.forEach(function (p) { shape.lineTo(p.x, p.y); });
for (var b = spiral.length - 1; b >= 0; b--) shape.lineTo(spiral[b].x * 1.04, spiral[b].y * 1.04);
var rollGeo = new T.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false, curveSegments: 4 });
rollGeo.rotateX(-Math.PI / 2); rollGeo.translate(0, 0.1, 0);
var roll = new T.Mesh(rollGeo, paperMat);
var ribbon = new T.Mesh(new T.TorusGeometry(0.06, 0.006, 8, 32), new T.MeshStandardMaterial({ color: new T.Color(o.ribbon || '#8e1835'), roughness: 0.55 }));
ribbon.rotation.x = Math.PI / 2; ribbon.position.y = 0.3;
body.add(roll, ribbon);
var cc = document.createElement('canvas'); cc.width = 128; cc.height = 64;
var cx = cc.getContext('2d'); cx.fillStyle = o.cork || '#8a6a4a'; cx.fillRect(0, 0, 128, 64);
for (var i = 0; i < 900; i++) { cx.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '40,25,10,' : '220,190,150,') + (Math.random() * 0.35) + ')'; cx.fillRect(Math.random() * 128, Math.random() * 64, 1 + Math.random() * 2, 1 + Math.random() * 2); }
var corkTex = new T.CanvasTexture(cc); corkTex.colorSpace = T.SRGBColorSpace;
var cork = new T.Mesh(new T.CylinderGeometry(0.058, 0.053, 0.12, 24), new T.MeshStandardMaterial({ map: corkTex, roughness: 0.95 }));
cork.position.y = 1.0;
body.add(cork);
body.rotation.z = Math.PI / 2 - 0.16;
body.position.set(0.5, 0, 0);
group.scale.setScalar((o.size || 1) * 1.15);
group.visible = false;
var st = { t: 0, going: false, arrived: false, opened: 0, y: 0, vy: 0, pitch: 0, vp: 0, roll: 0, vr: 0 };
return {
group: group,
pick: glassMeshes.concat([roll, cork]),
get arrived() { return st.arrived; },
arrive: function () { if (st.going) return; st.going = true; group.visible = true; },
reset: function () {
st = { t: 0, going: false, arrived: false, opened: 0, y: 0, vy: 0, pitch: 0, vp: 0, roll: 0, vr: 0 };
group.visible = false;
cork.position.y = 1.0; cork.rotation.z = 0; cork.material.opacity = 1; roll.position.y = 0; ribbon.position.y = 0.3;
},
open: function () { st.opened = 0.0001; },
tap: function () {},
update: function (t, dt) {
mats.forEach(function (m) { Card.three.syncSky(m.uniforms, ctx.shared.sky); });
if (!st.going) return;
dt = Math.min(dt, 0.05);
st.t = Math.min(travel, st.t + dt);
var k = U.outCubic(st.t / travel);
var x = U.lerp(from[0], to[0], k), z = U.lerp(from[1], to[1], k);
if (k >= 1 && !st.arrived) { st.arrived = true; Card.emit('bottle', 'arrived'); }
if (st.arrived) { x += Math.sin(t * 0.5) * 0.05; z += Math.sin(t * 0.7 + 1) * 0.07; }
var w = ctx.shared.water;
var yaw = (o.turn == null ? 0.35 : o.turn) + (1 - k) * 1.4 + Math.sin(t * 0.27) * 0.06;
var ax = Math.cos(yaw), az = -Math.sin(yaw);
var len = 0.55 * (o.size || 1), hs = [];
for (var s = -2; s <= 2; s++) hs.push(w ? w.height(x + ax * len * s / 2, z + az * len * s / 2, t) : 0);
var mean = (hs[0] + hs[1] + hs[2] + hs[3] + hs[4]) / 5;
var targetPitch = Math.atan2(hs[4] - hs[0], len * 2) * 0.9;
var side = w ? Math.atan2(w.height(x - az * 0.15, z + ax * 0.15, t) - w.height(x + az * 0.15, z - ax * 0.15, t), 0.3) : 0;
st.vy += ((mean - 0.02) - st.y) * 30 * dt; st.vy *= Math.pow(0.04, dt); st.y += st.vy * dt;
st.vp += (targetPitch - st.pitch) * 24 * dt; st.vp *= Math.pow(0.05, dt); st.pitch += st.vp * dt;
st.vr += (side * 0.8 - st.roll) * 18 * dt; st.vr *= Math.pow(0.05, dt); st.roll += st.vr * dt;
group.position.set(x, st.y, z);
group.rotation.set(st.roll, yaw, st.pitch, 'YXZ');
if (st.opened) {
st.opened = Math.min(1, st.opened + dt * 1.2);
cork.position.y = 1.0 + U.outCubic(st.opened) * 0.7;
cork.rotation.z = st.opened * 2.4;
cork.material.transparent = true; cork.material.opacity = 1 - st.opened;
roll.position.y = U.outCubic(Math.max(0, st.opened - 0.25) / 0.75) * 1.0;
ribbon.position.y = 0.3 + roll.position.y;
}
}
};
});
})();
