(function () {
'use strict';
if (!Card.three) return;
var NW = 12;
var VERT = [
'uniform float uTime; uniform vec4 uW[' + NW + ']; uniform float uQ[' + NW + ']; uniform float uShoreZ;',
'varying vec3 vPos; varying vec3 vN; varying float vFold; varying float vH;',
'void main() {',
'  vec3 p0 = (modelMatrix * vec4(position, 1.0)).xyz;',
'  vec3 p = p0; vec3 n = vec3(0.0, 1.0, 0.0); float fold = 0.0;',
'  float fade = 1.0 - smoothstep(25.0, 60.0, length(p0.xz - cameraPosition.xz));',
'  float shoal = 1.0 - smoothstep(uShoreZ - 3.0, uShoreZ + 0.6, p0.z);',
'  shoal = 0.12 + 0.88 * shoal;',
'  for (int i = 0; i < ' + NW + '; i++) {',
'    vec2 D = uW[i].xy; float A = uW[i].z * (i > 5 ? fade : 1.0) * shoal; float k = uW[i].w; float Q = uQ[i];',
'    float w = sqrt(9.81 * k);',
'    float f = k * dot(D, p0.xz) - w * uTime;',
'    float c = cos(f), s = sin(f);',
'    p.xz += Q * A * D * c;',
'    p.y += A * s;',
'    n.xz -= D * k * A * c;',
'    n.y -= Q * k * A * s;',
'    fold += Q * k * A * s;',
'  }',
'  vPos = p; vN = normalize(n); vFold = fold; vH = p.y;',
'  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);',
'}'
].join('\n');
var FRAG = [
'uniform float uTime; uniform vec3 uDeep; uniform vec3 uScatter; uniform vec3 uSand;',
'uniform float uRain; uniform float uShoreZ; uniform float uFade; uniform float uFoam;',
'uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;',
'varying vec3 vPos; varying vec3 vN; varying float vFold; varying float vH;',
'__SKY__',
'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
'float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
'  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }',
'float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }',
'vec2 ripple(vec2 p, float t) {',
'  vec2 g = vec2(0.0);',
'  g += vec2(0.83, 0.55) * cos(dot(p, vec2(0.83, 0.55)) * 7.0 + t * 3.1) * 0.10;',
'  g += vec2(-0.6, 0.8) * cos(dot(p, vec2(-0.6, 0.8)) * 11.0 - t * 3.9) * 0.07;',
'  g += vec2(0.3, -0.95) * cos(dot(p, vec2(0.3, -0.95)) * 17.0 + t * 5.0) * 0.05;',
'  g += vec2(-0.95, -0.3) * cos(dot(p, vec2(-0.95, -0.3)) * 26.0 - t * 6.3) * 0.035;',
'  return g;',
'}',
'float ggx(float NdH, float a) { float a2 = a * a; float d = NdH * NdH * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }',
'void main() {',
'  float dist = length(cameraPosition - vPos);',
'  vec3 N = normalize(vN);',
'  float detail = 1.0 - smoothstep(6.0, 30.0, dist);',
'  vec2 rg = ripple(vPos.xz, uTime) * detail;',
'  vec2 q = vPos.xz * 2.6; vec2 cell = floor(q); vec2 f = fract(q) - 0.5;',
'  float age = fract(uTime * 0.85 + hash(cell));',
'  float rr = length(f);',
'  float ring = sin((rr - age * 0.48) * 70.0) * (1.0 - age) * smoothstep(age * 0.48 + 0.06, age * 0.48, rr);',
'  rg += uRain * 0.6 * ring * f / max(rr, 0.001) * detail;',
'  N = normalize(vec3(N.x - rg.x, N.y, N.z - rg.y));',
'  vec3 V = normalize(cameraPosition - vPos);',
'  if (dot(N, V) < 0.02) N = normalize(N + V * (0.02 - dot(N, V)));',
'  float NdV = max(dot(N, V), 0.0);',
'  float F = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);',
'  vec3 R = reflect(-V, N); R.y = abs(R.y);',
'  vec3 refl = skyColor(R, 900.0);',
'  vec3 L = normalize(uSunDir);',
'  float sss = pow(max(dot(V, -vec3(L.x, -0.15, L.z)), 0.0), 4.0) * clamp(vH * 2.2 + 0.25, 0.0, 1.0);',
'  vec3 body = uDeep * (0.6 + 0.4 * max(N.y, 0.0)) + uScatter * (sss * (0.35 + uSun * 0.9) + 0.06 * max(vH + 0.1, 0.0));',
'  vec3 col = mix(body, refl, F);',
'  float rough = mix(0.05, 0.16, smoothstep(5.0, 45.0, dist));',
'  vec3 Hs = normalize(L + V); vec3 Hm = normalize(normalize(uMoonDir) + V);',
'  col += uSunColor * uSun * ggx(max(dot(N, Hs), 0.0), rough) * F * 2.2;',
'  col += vec3(0.75, 0.82, 1.0) * uMoon * ggx(max(dot(N, Hm), 0.0), rough) * F * 0.9;',
'  float foamN = fbm(vPos.xz * 1.7 + uTime * 0.12);',
'  float crest = smoothstep(0.55, 0.95, vFold + foamN * 0.35) * uFoam;',
'  float toShore = uShoreZ - vPos.z;',
'  float shallow = 1.0 - smoothstep(0.0, 3.5, toShore);',
'  col = mix(col, mix(uSand, refl, F * 0.8 + 0.1), shallow * 0.55);',
'  float swash = uShoreZ - 0.35 + sin(uTime * 0.55 + vPos.x * 0.4) * 0.35 + (fbm(vPos.xz * 3.0) - 0.5) * 0.3;',
'  float lace = smoothstep(0.35, 0.0, abs(vPos.z - swash)) * (0.5 + 0.5 * fbm(vPos.xz * 6.0 + uTime * 0.3));',
'  float foam = clamp(crest + lace * 0.9, 0.0, 1.0);',
'  float lit = 0.12 + 0.88 * max(uSun, uMoon * 0.3);',
'  vec3 foamCol = mix(uHorizon, vec3(0.92), 0.55) * lit * (0.6 + 0.4 * max(dot(N, L), 0.0));',
'  col = mix(col, foamCol, foam * 0.85);',
'  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, dist));',
'  col = mix(uFogColor, col, uFade);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <tonemapping_fragment>',
'  #include <colorspace_fragment>',
'}'
].join('\n');
var SAND_VERT = 'varying vec3 vPos; varying vec3 vN; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vPos = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';
var SAND_FRAG = [
'uniform float uTime; uniform vec3 uSand; uniform float uShoreZ; uniform float uFade; uniform vec3 uFogColor;',
'varying vec3 vPos; varying vec3 vN;',
'__SKY__',
'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
'float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
'  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }',
'void main() {',
'  vec3 V = normalize(cameraPosition - vPos);',
'  float grain = noise(vPos.xz * 60.0) * 0.5 + noise(vPos.xz * 9.0) * 0.5;',
'  float wet = 1.0 - smoothstep(0.2, 1.6, vPos.z - uShoreZ + sin(uTime * 0.55 + vPos.x * 0.4) * 0.3);',
'  vec3 dry = uSand * (0.85 + grain * 0.3);',
'  vec3 col = mix(dry, dry * 0.45, wet);',
'  vec3 N = normalize(vN + vec3((noise(vPos.xz * 40.0) - 0.5) * 0.1, 0.0, (noise(vPos.zx * 40.0) - 0.5) * 0.1));',
'  float F = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);',
'  vec3 R = reflect(-V, N); R.y = abs(R.y);',
'  col = mix(col, skyColor(R, 400.0), F * wet * 0.9);',
'  col += uSunColor * uSun * 0.15 * max(dot(N, normalize(uSunDir)), 0.0) * (1.0 - wet);',
'  col = mix(uFogColor, col, uFade);',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <tonemapping_fragment>',
'  #include <colorspace_fragment>',
'}'
].join('\n');
Card.three.module('water', function (ctx, o) {
var T = ctx.THREE, U = Card.util;
var C = function (x, d) { return new T.Color(x || d); };
var size = o.size || 70, seg = Math.round(200 * (o.detail || 1) * (ctx.lowEnd ? 0.55 : 1));
var night = o.night || {}, dawn = o.dawn || {};
var deepN = C(night.deep, '#020811'), deepD = C(dawn.deep, '#123049'), scN = C(night.scatter, '#0b2a3a'), scD = C(dawn.scatter, '#2f8f8a');
var shore = o.shore === false ? null : (o.shore || {});
var shoreZ = shore ? (shore.z == null ? 2.6 : shore.z) : 999;
var wind = new T.Vector2().fromArray(o.wind || [0.9, -0.45]).normalize(), swell = o.swell == null ? 1 : o.swell, choppy = o.choppy == null ? 0.85 : o.choppy;
var waves = [], Qs = [], seed = 11;
var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
for (var i = 0; i < NW; i++) {
var L = 22 * Math.pow(0.68, i) + 0.35;
var k = 2 * Math.PI / L;
var ang = Math.atan2(wind.y, wind.x) + (rnd() - 0.5) * (0.5 + i * 0.12);
var A = swell * 0.028 * L * Math.pow(0.82, i) * (0.7 + rnd() * 0.5) / (1 + i * 0.15);
A = Math.min(A, 0.11 / k);
waves.push(new T.Vector4(Math.cos(ang), Math.sin(ang), A, k));
Qs.push(Math.min(1, choppy / (k * A * NW)) );
}
var sky = Card.three.skyUniforms(T);
var uni = Object.assign({
uTime: { value: 0 }, uW: { value: waves }, uQ: { value: Qs },
uDeep: { value: deepN.clone() }, uScatter: { value: scN.clone() }, uSand: { value: C(shore && shore.sand, '#1d1b1a') },
uRain: { value: 0 }, uShoreZ: { value: shoreZ }, uFade: { value: 1 }, uFoam: { value: o.foam == null ? 1 : o.foam },
uFogColor: { value: new T.Color('#0b1328') }, uFogNear: { value: 22 }, uFogFar: { value: size * 0.62 }
}, sky);
var geo = new T.PlaneGeometry(size, size, seg, seg);
geo.rotateX(-Math.PI / 2);
var gp = geo.attributes.position;
for (var v = 0; v < gp.count; v++) {
var z = gp.getZ(v) / (size / 2);
gp.setZ(v, (Math.sign(z) * Math.pow(Math.abs(z), z > 0 ? 1.0 : 1.6)) * size / 2);
}
var mat = new T.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG.replace('__SKY__', Card.three.skyGLSL) });
var sea = new T.Mesh(geo, mat);
sea.position.z = -size / 2 + (shore ? shoreZ + 7 : 8);
sea.frustumCulled = false;
var group = new T.Group();
group.add(sea);
var sand = null, sandN = null, sandD = null, sandU = null;
if (shore) {
sandN = C(shore.sand, '#1d1b1a'); sandD = C(shore.sandDawn, '#7a6150');
var sg = new T.PlaneGeometry(size, 9, 80, 24);
sg.rotateX(-Math.PI / 2);
var sp = sg.attributes.position;
for (var j = 0; j < sp.count; j++) {
var zz = sp.getZ(j);
var up = Math.max(0, zz + 4.5);
sp.setY(j, -0.06 + up * 0.11 - up * up * 0.004 + Math.sin(sp.getX(j) * 0.7) * 0.025 + Math.sin(sp.getX(j) * 2.3 + zz) * 0.01);
}
sg.computeVertexNormals();
sandU = Object.assign({ uTime: { value: 0 }, uSand: { value: sandN.clone() }, uShoreZ: { value: shoreZ }, uFade: { value: 1 }, uFogColor: { value: new T.Color() } }, Card.three.skyUniforms(T));
sand = new T.Mesh(sg, new T.ShaderMaterial({ uniforms: sandU, vertexShader: SAND_VERT, fragmentShader: SAND_FRAG.replace('__SKY__', Card.three.skyGLSL) }));
sand.position.set(0, 0, shoreZ + 4.5);
group.add(sand);
}
function height(x, z, t) {
var h = 0;
for (var i = 0; i < NW; i++) {
var w = waves[i], f = w.w * (w.x * x + w.y * z) - Math.sqrt(9.81 * w.w) * t;
h += w.z * Math.sin(f);
}
return h;
}
function normal(x, z, t) {
var e = 0.15, hx = height(x + e, z, t) - height(x - e, z, t), hz = height(x, z + e, t) - height(x, z - e, t);
return new T.Vector3(-hx, 2 * e, -hz).normalize();
}
function slope(x, z, t) { return [height(x + 0.2, z, t) - height(x - 0.2, z, t), height(x, z + 0.2, t) - height(x, z - 0.2, t)]; }
ctx.shared.water = { height: height, normal: normal, slope: slope, time: 0 };
return {
group: group,
update: function (t, dt, p, fade) {
uni.uTime.value = t;
ctx.shared.water.time = t;
var sk = ctx.shared.sky, d = sk ? sk.dawn : 0;
Card.three.syncSky(uni, sk);
if (sk) uni.uFogColor.value.copy(sk.horizon);
uni.uDeep.value.copy(deepN).lerp(deepD, d);
uni.uScatter.value.copy(scN).lerp(scD, d);
uni.uRain.value = ctx.shared.rain || 0;
uni.uFade.value = fade == null ? 1 : fade;
if (sand) {
Card.three.syncSky(sandU, sk);
sandU.uTime.value = t;
sandU.uSand.value.copy(sandN).lerp(sandD, d);
uni.uSand.value.copy(sandU.uSand.value);
sandU.uFade.value = uni.uFade.value;
if (sk) sandU.uFogColor.value.copy(sk.horizon);
}
}
};
});
})();
