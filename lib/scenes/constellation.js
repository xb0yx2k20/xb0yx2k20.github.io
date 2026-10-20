(function () {
'use strict';
if (!Card.three) return;
var U = Card.util;
var LOOP = [[0, 0], [0, -40], [6, -62], [24, -70], [40, -60], [42, -42], [30, -30], [30, -16], [46, -6], [62, -14],
[72, -34], [86, -40], [98, -28], [96, 0], [80, 16], [56, 20], [36, 12], [20, 20], [6, 16]];
var DUST_VERT = [
'attribute vec3 aStart; attribute float aDelay; attribute float aSeed;',
'uniform float uForm; uniform float uTime; uniform float uSize; uniform float uGlow;',
'varying float vTw; varying float vSeed; varying float vSet;',
'void main() {',
'  float f = clamp((uForm - aDelay * 0.55) / 0.45, 0.0, 1.0);',
'  f = f * f * (3.0 - 2.0 * f);',
'  vec3 s = aStart + vec3(sin(uTime * 0.4 + aSeed * 9.0), cos(uTime * 0.33 + aSeed * 7.0), 0.0) * 0.05;',
'  vec3 p = mix(s, position, f);',
'  p.y += sin(f * 3.14159) * (0.35 + aSeed * 0.4);',
'  p.x += sin(f * 3.14159) * (aSeed - 0.5) * 0.6;',
'  p += vec3(sin(uTime * 1.3 + aSeed * 30.0), cos(uTime * 1.1 + aSeed * 20.0), 0.0) * 0.008 * f;',
'  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
'  vTw = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 40.0);',
'  vSeed = aSeed; vSet = f;',
'  gl_PointSize = uSize * (0.6 + aSeed * 0.9) * (1.0 + uGlow * 0.3) / -mv.z;',
'  gl_Position = projectionMatrix * mv;',
'}'
].join('\n');
var DUST_FRAG = [
'uniform vec3 uA; uniform vec3 uB; uniform float uFade; uniform float uGlow;',
'varying float vTw; varying float vSeed; varying float vSet;',
'void main() {',
'  vec2 c = gl_PointCoord - 0.5; float r = length(c);',
'  float core = smoothstep(0.5, 0.0, r); core *= core;',
'  float cross = max(0.0, 1.0 - abs(c.x) * 14.0) * smoothstep(0.5, 0.0, abs(c.y)) + max(0.0, 1.0 - abs(c.y) * 14.0) * smoothstep(0.5, 0.0, abs(c.x));',
'  float k = core + cross * step(0.8, vSeed) * 0.5;',
'  vec3 col = mix(uA, uB, vSeed);',
'  gl_FragColor = vec4(col * k * vTw * (1.4 + vSet * 0.8 + uGlow), 1.0) * uFade;',
'}'
].join('\n');
var LINE_VERT = 'attribute float aU; varying float vU; void main() { vU = aU; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
var LINE_FRAG = [
'uniform float uDraw; uniform vec3 uColor; uniform float uFade; uniform float uGlow; varying float vU;',
'void main() {',
'  if (vU > uDraw) discard;',
'  float dash = step(0.35, fract(vU * 60.0));',
'  float head = smoothstep(uDraw - 0.04, uDraw, vU);',
'  gl_FragColor = vec4(uColor * (0.5 + dash * 0.6 + head * 1.6 + uGlow * 0.4), 1.0) * uFade;',
'}'
].join('\n');
Card.three.module('constellation', function (ctx, o) {
var T = ctx.THREE;
var cols = Object.assign({ dust: '#d9cfff', dust2: '#ffd1e6', star: '#ffffff', line: '#cbbcff', comet: '#ffe1ef' }, o.colors || {});
var center = o.center || [0, 1.9, -1.2], width = o.width || 2.4;
var form = o.form || [0.3, 0.68], draw = o.draw || [0.55, 0.78], runAt = o.run == null ? 0.78 : o.run;
var group = new T.Group();
group.position.fromArray(center);
var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
LOOP.forEach(function (p) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minZ = Math.min(minZ, p[1]); maxZ = Math.max(maxZ, p[1]); });
var sc = width / (maxX - minX), cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
var curve = new T.CatmullRomCurve3(LOOP.map(function (p) {
return new T.Vector3((p[0] - cx) * sc, -(p[1] - cz) * sc, 0);
}), true, 'centripetal');
var N = Math.round((o.dust || 600) * (ctx.lowEnd ? 0.6 : 1));
var pos = new Float32Array(N * 3), start = new Float32Array(N * 3), delay = new Float32Array(N), seed = new Float32Array(N);
var from = o.from || [0, 0.3, 0.2];
for (var i = 0; i < N; i++) {
var u = Math.random(), p = curve.getPointAt(u);
pos[i * 3] = p.x + (Math.random() - 0.5) * 0.05; pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.05; pos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
var a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 1.1;
start[i * 3] = from[0] - center[0] + Math.cos(a) * r;
start[i * 3 + 1] = from[1] - center[1] + Math.sin(a) * r * 0.7;
start[i * 3 + 2] = from[2] - center[2] + (Math.random() - 0.5) * 0.8;
delay[i] = (u + Math.random() * 0.35) / 1.35;
seed[i] = Math.random();
}
var dg = new T.BufferGeometry();
dg.setAttribute('position', new T.BufferAttribute(pos, 3));
dg.setAttribute('aStart', new T.BufferAttribute(start, 3));
dg.setAttribute('aDelay', new T.BufferAttribute(delay, 1));
dg.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
var du = { uForm: { value: 0 }, uTime: { value: 0 }, uSize: { value: 26 * Math.min(2, ctx.renderer.getPixelRatio()) }, uGlow: { value: 0 },
uA: { value: new T.Color(cols.dust) }, uB: { value: new T.Color(cols.dust2) }, uFade: { value: 1 } };
var dust = new T.Points(dg, new T.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, uniforms: du,
transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
dust.frustumCulled = false;
group.add(dust);
var M = 400, lp = new Float32Array((M + 1) * 3), la = new Float32Array(M + 1);
for (var j = 0; j <= M; j++) { var q = curve.getPointAt(j / M); lp.set([q.x, q.y, 0], j * 3); la[j] = j / M; }
var lg = new T.BufferGeometry();
lg.setAttribute('position', new T.BufferAttribute(lp, 3));
lg.setAttribute('aU', new T.BufferAttribute(la, 1));
var lu = { uDraw: { value: 0 }, uColor: { value: new T.Color(cols.line) }, uFade: { value: 1 }, uGlow: { value: 0 } };
var line = new T.Line(lg, new T.ShaderMaterial({ vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, uniforms: lu,
transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
line.frustumCulled = false;
group.add(line);
var K = o.stars || 9, stars = [];
for (var k = 0; k < K; k++) {
var su = k / K, sp = new T.Sprite(new T.SpriteMaterial({ map: ctx.dot(), color: new T.Color(cols.star).multiplyScalar(1.6), transparent: true,
opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
sp.position.copy(curve.getPointAt(su));
sp.scale.setScalar(0.16);
group.add(sp);
stars.push({ s: sp, u: su, v: 0, ph: Math.random() * 6.28 });
}
var TAIL = 28, comet = [];
for (var c = 0; c < TAIL; c++) {
var cs = new T.Sprite(new T.SpriteMaterial({ map: ctx.dot(), color: new T.Color(cols.comet).multiplyScalar(c === 0 ? 3 : 1.6), transparent: true,
opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
cs.scale.setScalar(c === 0 ? 0.2 : 0.12 * (1 - c / TAIL) + 0.02);
group.add(cs);
comet.push(cs);
}
var formNow = 0, drawNow = 0, run = 0, runV = 0, cometOn = 0, glow = 0, glowTo = 0;
return {
group: group,
finale: function (v) { glowTo = U.clamp(v); },
reset: function () { formNow = drawNow = run = runV = cometOn = glow = glowTo = 0; stars.forEach(function (S) { S.v = 0; }); },
update: function (time, dt, prog, fade) {
var fT = U.clamp((prog - form[0]) / (form[1] - form[0])), dT = U.clamp((prog - draw[0]) / (draw[1] - draw[0]));
formNow += (fT - formNow) * Math.min(1, dt * 2.2);
drawNow += (dT - drawNow) * Math.min(1, dt * (o.drawRate || 2.6));
glow += (glowTo - glow) * Math.min(1, dt * 1.2);
du.uForm.value = formNow * 1.0001; du.uTime.value = time; du.uFade.value = fade; du.uGlow.value = glow;
lu.uDraw.value = drawNow; lu.uFade.value = fade; lu.uGlow.value = glow;
for (var k = 0; k < stars.length; k++) {
var S = stars[k];
var on = (drawNow >= S.u - 0.002 && formNow > 0.6) ? 1 : 0;
S.v += (on - S.v) * Math.min(1, dt * 3);
var tw = 0.75 + 0.25 * Math.sin(time * 2 + S.ph);
S.s.material.opacity = S.v * tw * fade;
S.s.scale.setScalar(0.05 + S.v * 0.05 + Math.sin(S.v * Math.PI) * 0.08 + glow * 0.02);
}
var speed = o.cometSpeed || 0.11, loops = o.cometLoops || 0, landed = loops && run >= loops - 0.001;
var want = prog >= runAt && drawNow > 0.95 && !landed ? 1 : 0;
cometOn += ((want || (loops && run > 0 && !landed) ? 1 : 0) - cometOn) * Math.min(1, dt * (landed ? 1.2 : 1.5));
if (landed) { run = loops; runV = 0; }
else {
var near = loops ? Math.min(1, Math.max(0.12, (loops - run) / 0.15)) : 1;
runV += ((want ? speed * near : 0) - runV) * Math.min(1, dt * 1.5);
run = loops ? Math.min(loops, run + runV * dt) : run + runV * dt;
}
var stretch = Math.min(1, runV / speed);
for (var c = 0; c < comet.length; c++) {
var cu = ((run - c * 0.006 * stretch) % 1 + 1) % 1;
comet[c].position.copy(curve.getPointAt(cu));
comet[c].material.opacity = cometOn * fade * (1 - c / comet.length) * (c === 0 ? 1 : 0.7);
}
group.rotation.z = Math.sin(time * 0.15) * 0.015;
}
};
});
})();
