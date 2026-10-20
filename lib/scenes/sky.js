(function () {
'use strict';
if (!Card.three) return;
var VERT = [
'varying vec3 vDir;',
'void main() {',
'  vDir = normalize(position);',
'  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
'  gl_Position = p.xyww;',
'}'
].join('\n');
var FRAG = [
'uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon;',
'uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunSize; uniform float uSun;',
'uniform vec3 uMoonDir; uniform vec3 uMoonColor; uniform float uMoon;',
'uniform float uStars; uniform float uTime;',
'varying vec3 vDir;',
'float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }',
'void main() {',
'  vec3 d = normalize(vDir);',
'  float y = d.y;',
'  vec3 col = mix(uMid, uZenith, smoothstep(0.05, 0.75, y));',
'  col = mix(uHorizon, col, smoothstep(-0.03, 0.22, y));',
'  col = mix(col, uHorizon * 0.55, smoothstep(0.0, -0.25, y));',
'  float s = max(dot(d, uSunDir), 0.0);',
'  col += uSunColor * uSun * (smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.7, s) * 2.4 + pow(s, 900.0) * 0.9 + pow(s, 60.0) * 0.35 + pow(s, 8.0) * 0.12);',
'  col += uSunColor * uSun * 0.18 * exp(-abs(y) * 9.0) * pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0), 3.0);',
'  float m = max(dot(d, uMoonDir), 0.0);',
'  col += uMoonColor * uMoon * (smoothstep(0.99935, 0.9996, m) * 1.2 + pow(m, 400.0) * 0.25 + pow(m, 30.0) * 0.06);',
'  vec3 q = floor(d * 220.0);',
'  float h = hash(q);',
'  float star = step(0.9972, h) * smoothstep(0.04, 0.35, y);',
'  col += vec3(0.95, 0.97, 1.0) * star * uStars * (0.55 + 0.45 * sin(uTime * (1.5 + h * 3.0) + h * 60.0));',
'  gl_FragColor = vec4(col, 1.0);',
'  #include <tonemapping_fragment>',
'  #include <colorspace_fragment>',
'}'
].join('\n');
Card.three.skyGLSL = [
'uniform vec3 uZenith; uniform vec3 uMid; uniform vec3 uHorizon;',
'uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSun; uniform vec3 uMoonDir; uniform float uMoon;',
'vec3 skyColor(vec3 d, float sunSharp) {',
'  float y = d.y;',
'  vec3 col = mix(uMid, uZenith, smoothstep(0.05, 0.75, y));',
'  col = mix(uHorizon, col, smoothstep(-0.03, 0.22, y));',
'  col = mix(col, uHorizon * 0.5, smoothstep(0.0, -0.3, y));',
'  float s = max(dot(d, uSunDir), 0.0);',
'  col += uSunColor * uSun * (pow(s, 60.0) * 0.4 + pow(s, 8.0) * 0.14 + pow(s, sunSharp) * 30.0);',
'  col += uSunColor * uSun * 0.2 * exp(-abs(y) * 9.0);',
'  float m = max(dot(d, uMoonDir), 0.0);',
'  col += vec3(0.85, 0.9, 1.0) * uMoon * (pow(m, sunSharp) * 4.0 + pow(m, 40.0) * 0.08);',
'  return col;',
'}'
].join('\n');
Card.three.skyUniforms = function (T) {
return { uZenith: { value: new T.Color() }, uMid: { value: new T.Color() }, uHorizon: { value: new T.Color() },
uSunDir: { value: new T.Vector3(0, -1, 0) }, uSunColor: { value: new T.Color() }, uSun: { value: 0 },
uMoonDir: { value: new T.Vector3(0, 1, 0) }, uMoon: { value: 0 } };
};
Card.three.syncSky = function (u, sky) {
if (!sky) return;
u.uZenith.value.copy(sky.zenith); u.uMid.value.copy(sky.mid); u.uHorizon.value.copy(sky.horizon);
u.uSunDir.value.copy(sky.sun); u.uSunColor.value.copy(sky.sunColor); u.uSun.value = sky.sunAmount;
u.uMoonDir.value.copy(sky.moon); u.uMoon.value = sky.moonAmount;
};
Card.three.module('sky', function (ctx, o) {
var T = ctx.THREE, U = Card.util;
var C = function (x, d) { return new T.Color(x || d); };
var n = o.night || {}, a = o.dawn || {};
var N = { z: C(n.zenith, '#03060f'), m: C(n.mid, '#0b1328'), h: C(n.horizon, '#1d2840') };
var D = { z: C(a.zenith, '#33456f'), m: C(a.mid, '#9a7f9c'), h: C(a.horizon, '#f3a77c') };
var range = o.range || [0.1, 1];
var sun = o.sun || {}, sFrom = new T.Vector3().fromArray(sun.from || [0.35, -0.12, -1]).normalize(), sTo = new T.Vector3().fromArray(sun.to || [0.3, 0.16, -1]).normalize();
var moon = o.moon || {};
var uni = {
uZenith: { value: N.z.clone() }, uMid: { value: N.m.clone() }, uHorizon: { value: N.h.clone() },
uSunDir: { value: sFrom.clone() }, uSunColor: { value: C(sun.color, '#ffb27a') }, uSunSize: { value: sun.size || 0.0011 }, uSun: { value: 0 },
uMoonDir: { value: new T.Vector3().fromArray(moon.dir || [-0.5, 0.42, -1]).normalize() }, uMoonColor: { value: C(moon.color, '#dfe6ff') }, uMoon: { value: 1 },
uStars: { value: o.stars == null ? 1 : o.stars }, uTime: { value: 0 }, uFade: { value: 1 }
};
var mat = new T.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG, side: T.BackSide, depthWrite: false, depthTest: false, fog: false });
var dome = new T.Mesh(new T.SphereGeometry(80, 48, 24), mat);
dome.renderOrder = -10;
dome.frustumCulled = false;
var group = new T.Group();
group.add(dome);
var shared = ctx.shared.sky = { sun: uni.uSunDir.value, sunColor: uni.uSunColor.value, horizon: uni.uHorizon.value, mid: uni.uMid.value, zenith: uni.uZenith.value,
moon: uni.uMoonDir.value, sunAmount: 0, moonAmount: 1, dawn: 0 };
var now = 0;
return {
group: group,
reset: function () { now = 0; },
update: function (t, dt, p) {
var target = U.clamp((p - range[0]) / (range[1] - range[0]));
now += (target - now) * Math.min(1, dt * 1.6);
var k = now * now * (3 - 2 * now);
uni.uZenith.value.copy(N.z).lerp(D.z, k);
uni.uMid.value.copy(N.m).lerp(D.m, k);
uni.uHorizon.value.copy(N.h).lerp(D.h, Math.min(1, k * 1.2));
uni.uSunDir.value.copy(sFrom).lerp(sTo, U.clamp((now - 0.35) / 0.65)).normalize();
uni.uSun.value = U.clamp((now - 0.25) / 0.5);
uni.uMoon.value = 1 - U.clamp(now / 0.45);
uni.uStars.value = (o.stars == null ? 1 : o.stars) * (1 - U.clamp(now / 0.5)) * (1 - (ctx.shared.cloud || 0) * 0.8);
uni.uTime.value = t;
dome.position.copy(ctx.camera.position);
shared.dawn = now;
shared.sunAmount = uni.uSun.value;
shared.moonAmount = uni.uMoon.value;
}
};
});
})();
