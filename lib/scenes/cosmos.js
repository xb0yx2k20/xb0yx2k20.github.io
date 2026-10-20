(function () {
'use strict';
if (!Card.three) return;
var U = Card.util;
var NOISE = [
'float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
'float noise3(vec3 x) {',
'  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
'  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),',
'             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);',
'}',
'float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise3(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }',
'float stars(vec3 d, float scale, float density, float sharp) {',
'  vec3 q = d * scale, c = floor(q), f = fract(q) - 0.5;',
'  float h = hash3(c);',
'  if (h > density) return 0.0;',
'  vec3 o = vec3(hash3(c + 1.7), hash3(c + 4.1), hash3(c + 7.3)) - 0.5;',
'  float r = length(f - o * 0.6);',
'  return pow(max(0.0, 1.0 - r * sharp), 3.0) * (0.4 + h / density * 0.6);',
'}'
].join('\n');
var DOME_FRAG = [
'uniform vec3 uDeep; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uTime; uniform float uFade; uniform float uStars; uniform float uSpeed;',
'varying vec3 vDir;',
NOISE,
'void main() {',
'  vec3 d = normalize(vDir);',
'  float n1 = fbm(d * 2.2 + vec3(0.0, 0.0, uTime * 0.004));',
'  float n2 = fbm(d * 4.5 + vec3(5.2, 1.3, -uTime * 0.006));',
'  float clouds = smoothstep(0.38, 0.82, n1);',
'  float wisps = smoothstep(0.45, 0.9, n2) * clouds;',
'  float band = exp(-pow(dot(d, normalize(vec3(0.35, 1.0, 0.2))) * 3.2, 2.0));',
'  vec3 col = uDeep;',
'  col += uA * clouds * 0.55 * (0.5 + band);',
'  col += uB * wisps * 0.8;',
'  col += uC * pow(clouds * band, 2.0) * 0.6;',
'  col *= 1.0 - 0.55 * smoothstep(0.55, 0.75, fbm(d * 7.0 + 3.0)) * band;',
'  float s = stars(d, 160.0, 0.18, 9.0) * 0.9 + stars(d, 90.0, 0.08, 7.0) * 1.6 + stars(d, 38.0, 0.035, 5.0) * 3.2;',
'  s *= 0.75 + 0.25 * sin(uTime * 2.0 + hash3(floor(d * 160.0)) * 40.0);',
'  s += stars(d, 260.0, 0.3, 10.0) * 0.5 * band;',
'  float ahead = smoothstep(0.6, 1.0, -d.z);',
'  col *= 1.0 + uSpeed * (ahead * 0.8 - (1.0 - ahead) * 0.4);',
'  col += vec3(0.9, 0.95, 1.0) * s * uStars * (1.0 - uSpeed * 0.6);',
'  gl_FragColor = vec4(col * uFade, 1.0);',
'}'
].join('\n');
var DOME_VERT = 'varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }';
var WARP_VERT = [
'attribute float aTail; attribute float aSeed;',
'uniform float uTravel; uniform float uStretch; uniform float uSpeed;',
'varying float vA; varying float vT; varying float vSeed;',
'void main() {',
'  vec3 p = position;',
'  float z = mod(p.z + uTravel + 70.0, 76.0) - 70.0;',
'  z -= aTail * (0.05 + uStretch * (0.6 + aSeed));',
'  vec4 mv = modelViewMatrix * vec4(p.x, p.y, z, 1.0);',
'  vA = smoothstep(-70.0, -40.0, z) * (1.0 - smoothstep(2.0, 6.0, z));',
'  vT = aTail; vSeed = aSeed;',
'  gl_Position = projectionMatrix * mv;',
'}'
].join('\n');
var WARP_FRAG = [
'uniform float uSpeed; uniform float uFade; uniform vec3 uTint;',
'varying float vA; varying float vT; varying float vSeed;',
'void main() {',
'  vec3 c = mix(vec3(1.0), uTint, vSeed);',
'  float k = vA * (1.0 - vT * 0.85) * uSpeed * uFade;',
'  gl_FragColor = vec4(c * k * 4.0, 1.0);',
'}'
].join('\n');
Card.three.module('cosmos', function (ctx, o) {
var T = ctx.THREE;
var cols = Object.assign({ deep: '#03030a', a: '#3a1d7a', b: '#1d4fb8', c: '#c04a9a' }, o.colors || {});
var group = new T.Group();
var dome = new T.Mesh(new T.SphereGeometry(150, 48, 24), new T.ShaderMaterial({
side: T.BackSide, depthWrite: false, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG,
uniforms: {
uDeep: { value: new T.Color(cols.deep) }, uA: { value: new T.Color(cols.a) }, uB: { value: new T.Color(cols.b) }, uC: { value: new T.Color(cols.c) },
uTime: { value: 0 }, uFade: { value: 1 }, uStars: { value: o.stars == null ? 1 : o.stars }, uSpeed: { value: 0 }
}
}));
dome.renderOrder = -10;
dome.frustumCulled = false;
if (o.bake) {
var bakeScene = new T.Scene(), size = ctx.lowEnd ? 512 : 1024;
bakeScene.add(new T.Mesh(dome.geometry, dome.material));
var cubeRT = new T.WebGLCubeRenderTarget(size, { type: T.HalfFloatType, generateMipmaps: false });
var cubeCam = new T.CubeCamera(1, 400, cubeRT);
cubeCam.update(ctx.renderer, bakeScene);
dome.material = new T.ShaderMaterial({
side: T.BackSide, depthWrite: false, vertexShader: DOME_VERT,
fragmentShader: 'uniform samplerCube tCube; uniform float uFade; varying vec3 vDir; void main() { gl_FragColor = vec4(textureCube(tCube, normalize(vDir)).rgb * uFade, 1.0); }',
uniforms: { tCube: { value: cubeRT.texture }, uFade: { value: 1 }, uTime: { value: 0 }, uSpeed: { value: 0 } }
});
}
group.add(dome);
var N = Math.round((o.streaks == null ? 900 : o.streaks) * (ctx.lowEnd ? 0.5 : 1));
var pos = new Float32Array(N * 6), tail = new Float32Array(N * 2), seed = new Float32Array(N * 2);
for (var i = 0; i < N; i++) {
var ang = Math.random() * Math.PI * 2, r = 2.2 + Math.pow(Math.random(), 0.7) * 16;
var x = Math.cos(ang) * r, y = Math.sin(ang) * r * 0.85, z = -Math.random() * 76 + 6, s = Math.random();
pos.set([x, y, z, x, y, z], i * 6);
tail[i * 2] = 0; tail[i * 2 + 1] = 1;
seed[i * 2] = seed[i * 2 + 1] = s;
}
var wg = new T.BufferGeometry();
wg.setAttribute('position', new T.BufferAttribute(pos, 3));
wg.setAttribute('aTail', new T.BufferAttribute(tail, 1));
wg.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
var wu = { uTravel: { value: 0 }, uStretch: { value: 0 }, uSpeed: { value: 0 }, uFade: { value: 1 }, uTint: { value: new T.Color(o.tint || '#9db8ff') } };
var warp = new T.LineSegments(wg, new T.ShaderMaterial({ vertexShader: WARP_VERT, fragmentShader: WARP_FRAG, uniforms: wu,
transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
warp.frustumCulled = false;
group.add(warp);
var W = o.warp || [0.3, 0.42, 0.62, 0.72];
var throttle = 0, thrNow = 0, speed = 0, travel = 0, boost = 0;
function curve(p) {
if (p <= W[0] || p >= W[3]) return 0;
if (p < W[1]) return U.inOut((p - W[0]) / (W[1] - W[0]));
if (p <= W[2]) return 1;
return 1 - U.inOut((p - W[2]) / (W[3] - W[2]));
}
return {
group: group,
throttle: function (v) { throttle = U.clamp(v); },
boost: function (v) { boost = v; },
get speed() { return speed; },
reset: function () { throttle = thrNow = speed = travel = boost = 0; },
update: function (time, dt, p, fade) {
thrNow += (throttle - thrNow) * Math.min(1, dt * 3);
var target = Math.min(1, curve(p) * (0.35 + 0.65 * thrNow) + boost);
speed += (target - speed) * Math.min(1, dt * 2.5);
travel += dt * (2 + speed * 70);
group.position.copy(ctx.camera.position);
var du = dome.material.uniforms;
du.uTime.value = time; du.uFade.value = fade; du.uSpeed.value = speed;
wu.uTravel.value = travel; wu.uStretch.value = speed * 9; wu.uSpeed.value = Math.min(1, speed * 1.4); wu.uFade.value = fade;
}
};
});
Card.three.module('startlights', function (ctx, o) {
var T = ctx.THREE;
var group = new T.Group();
if (o.position) group.position.fromArray(o.position);
group.scale.setScalar(o.size || 1);
var housing = new T.MeshPhysicalMaterial({ color: new T.Color('#0c0d10'), roughness: 0.35, metalness: 0.6, clearcoat: 0.6, envMapIntensity: 0.9 });
var beam = new T.Mesh(new T.BoxGeometry(3.6, 0.16, 0.22), housing);
beam.position.y = 0.58;
group.add(beam);
[-1.5, 1.5].forEach(function (x) {
var h = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 6, 8), housing);
h.position.set(x, 3.6, -0.05); group.add(h);
});
var lamps = [], off = new T.Color('#1a0306'), on = new T.Color('#ff1a12').multiplyScalar(3.2);
for (var i = 0; i < 5; i++) {
var x = (i - 2) * 0.68;
var box = new T.Mesh(new T.BoxGeometry(0.5, 1.02, 0.28), housing);
box.position.set(x, 0, 0);
group.add(box);
var col = { mats: [], glow: null, v: 0, to: 0 };
for (var j = 0; j < 2; j++) {
var y = 0.22 - j * 0.44;
var m = new T.MeshBasicMaterial({ color: off.clone(), toneMapped: false });
var disc = new T.Mesh(new T.CircleGeometry(0.15, 32), m);
disc.position.set(x, y, 0.145);
group.add(disc);
var hood = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.12, 24, 1, true, Math.PI * 0.5, Math.PI), housing);
hood.rotation.x = Math.PI / 2; hood.position.set(x, y, 0.2);
group.add(hood);
col.mats.push(m);
}
var glow = new T.Sprite(new T.SpriteMaterial({ map: ctx.dot(), color: new T.Color('#ff2a1a'), transparent: true, opacity: 0,
depthWrite: false, blending: T.AdditiveBlending }));
glow.position.set(x, 0, 0.3); glow.scale.set(1.3, 1.9, 1);
group.add(glow);
col.glow = glow;
lamps.push(col);
}
var from = o.from == null ? 0.6 : o.from, appear = 0, n = 0;
return {
group: group,
lit: function (k) { n = k; lamps.forEach(function (L, i) { L.to = i < k ? 1 : 0; }); },
out: function () { this.lit(0); },
reset: function () { this.lit(0); appear = 0; lamps.forEach(function (L) { L.v = 0; }); },
update: function (time, dt, p, fade) {
appear += (U.clamp((p - from) / 0.08) - appear) * Math.min(1, dt * 3);
group.visible = appear > 0.01;
group.position.y = (o.position ? o.position[1] : 0) + (1 - appear) * 2.5;
for (var i = 0; i < lamps.length; i++) {
var L = lamps[i];
L.v += (L.to - L.v) * Math.min(1, dt * (L.to > L.v ? 30 : 12));
L.mats.forEach(function (m) { m.color.copy(off).lerp(on, L.v); });
L.glow.material.opacity = L.v * 0.4 * fade * appear;
}
}
};
});
})();
