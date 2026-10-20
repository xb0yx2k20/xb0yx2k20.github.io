(function () {
'use strict';
if (!Card.three) return;
var QUAD_VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var COPY = 'uniform sampler2D tMap; varying vec2 vUv; void main() { gl_FragColor = texture2D(tMap, vUv); }';
var BRIGHT = [
'uniform sampler2D tMap; uniform float uThreshold; varying vec2 vUv;',
'void main() {',
'  vec3 c = texture2D(tMap, vUv).rgb;',
'  float l = max(max(c.r, c.g), c.b);',
'  float k = smoothstep(uThreshold * 0.6, uThreshold * 1.4, l);',
'  gl_FragColor = vec4(min(c * k, vec3(24.0)), 1.0);',
'}'
].join('\n');
var DOWN = [
'uniform sampler2D tMap; uniform vec2 uTexel; varying vec2 vUv;',
'void main() {',
'  vec2 h = uTexel * 0.5;',
'  vec3 s = texture2D(tMap, vUv).rgb * 4.0;',
'  s += texture2D(tMap, vUv - h).rgb; s += texture2D(tMap, vUv + h).rgb;',
'  s += texture2D(tMap, vUv + vec2(h.x, -h.y)).rgb; s += texture2D(tMap, vUv - vec2(h.x, -h.y)).rgb;',
'  gl_FragColor = vec4(s / 8.0, 1.0);',
'}'
].join('\n');
var UP = [
'uniform sampler2D tMap; uniform sampler2D tBase; uniform vec2 uTexel; varying vec2 vUv;',
'void main() {',
'  vec2 h = uTexel * 0.5;',
'  vec3 s = texture2D(tMap, vUv + vec2(-h.x * 2.0, 0.0)).rgb;',
'  s += texture2D(tMap, vUv + vec2(-h.x, h.y)).rgb * 2.0;',
'  s += texture2D(tMap, vUv + vec2(0.0, h.y * 2.0)).rgb;',
'  s += texture2D(tMap, vUv + vec2(h.x, h.y)).rgb * 2.0;',
'  s += texture2D(tMap, vUv + vec2(h.x * 2.0, 0.0)).rgb;',
'  s += texture2D(tMap, vUv + vec2(h.x, -h.y)).rgb * 2.0;',
'  s += texture2D(tMap, vUv + vec2(0.0, -h.y * 2.0)).rgb;',
'  s += texture2D(tMap, vUv + vec2(-h.x, -h.y)).rgb * 2.0;',
'  gl_FragColor = vec4(s / 12.0 + texture2D(tBase, vUv).rgb, 1.0);',
'}'
].join('\n');
var COMPOSITE = [
'uniform sampler2D tMap; uniform sampler2D tBloom; uniform vec2 uRes; uniform float uTime;',
'uniform float uBloom; uniform float uExposure; uniform float uContrast; uniform float uSaturation; uniform float uWarmth;',
'uniform float uVignette; uniform float uGrain; uniform float uAberration;',
'varying vec2 vUv;',
'vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }',
'vec3 aces(vec3 c) {',
'  const mat3 I = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);',
'  const mat3 O = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);',
'  return clamp(O * RRTAndODTFit(I * c), 0.0, 1.0);',
'}',
'vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }',
'float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }',
'void main() {',
'  vec2 d = vUv - 0.5;',
'  vec2 ca = d * dot(d, d) * uAberration * 40.0;',
'  vec3 c = vec3(texture2D(tMap, vUv + ca).r, texture2D(tMap, vUv).g, texture2D(tMap, vUv - ca).b);',
'  c += texture2D(tBloom, vUv).rgb * uBloom;',
'  c *= uExposure / 0.6;',
'  c *= vec3(1.0 + uWarmth * 0.06, 1.0, 1.0 - uWarmth * 0.06);',
'  c = aces(c);',
'  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
'  c = mix(vec3(l), c, uSaturation);',
'  c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);',
'  c *= 1.0 - uVignette * smoothstep(0.25, 0.95, length(d * vec2(uRes.x / uRes.y, 1.0)) * 1.25);',
'  c = toSRGB(c);',
'  c += (hash(vUv * uRes) - 0.5) * uGrain;',
'  gl_FragColor = vec4(c, 1.0);',
'}'
].join('\n');
Card.three.pipeline = function (ctx, opts) {
var T = ctx.THREE, renderer = ctx.renderer, scene = ctx.scene, camera = ctx.camera;
var o = Object.assign({ bloom: 0.55, threshold: 1.0, grain: 0.035, vignette: 0.32, aberration: 0.0015,
exposure: 1, contrast: 1.04, saturation: 1.02, warmth: 0, msaa: 4 }, opts || {});
var low = ctx.lowEnd;
var gl2 = renderer.capabilities.isWebGL2;
var type = renderer.extensions.has('EXT_color_buffer_half_float') || gl2 ? T.HalfFloatType : T.UnsignedByteType;
function target(w, h, msaa) {
var t = new T.WebGLRenderTarget(w, h, { type: type, depthBuffer: !!msaa || msaa === 0, samples: msaa && gl2 && !low ? msaa : 0 });
t.texture.colorSpace = T.LinearSRGBColorSpace;
return t;
}
var main = target(1, 1, o.msaa), copy = target(1, 1), levels = [];
for (var i = 0; i < (low ? 4 : 5); i++) levels.push({ down: target(1, 1), up: target(1, 1) });
var quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadScene = new T.Scene();
var quad = new T.Mesh(new T.PlaneGeometry(2, 2), null);
quad.frustumCulled = false;
quadScene.add(quad);
function mat(frag, uniforms) { return new T.ShaderMaterial({ uniforms: uniforms, vertexShader: QUAD_VERT, fragmentShader: frag, depthTest: false, depthWrite: false }); }
var copyMat = mat(COPY, { tMap: { value: null } });
var brightMat = mat(BRIGHT, { tMap: { value: null }, uThreshold: { value: o.threshold } });
var downMat = mat(DOWN, { tMap: { value: null }, uTexel: { value: new T.Vector2() } });
var upMat = mat(UP, { tMap: { value: null }, tBase: { value: null }, uTexel: { value: new T.Vector2() } });
var compMat = mat(COMPOSITE, {
tMap: { value: main.texture }, tBloom: { value: null }, uRes: { value: new T.Vector2() }, uTime: { value: 0 },
uBloom: { value: o.bloom }, uExposure: { value: o.exposure }, uContrast: { value: o.contrast }, uSaturation: { value: o.saturation },
uWarmth: { value: o.warmth }, uVignette: { value: o.vignette }, uGrain: { value: o.grain }, uAberration: { value: o.aberration }
});
function pass(material, out) { quad.material = material; renderer.setRenderTarget(out); renderer.render(quadScene, quadCam); }
var size = new T.Vector2(), refractors = [];
function resize() {
renderer.getDrawingBufferSize(size);
var w = Math.max(1, size.x), h = Math.max(1, size.y);
main.setSize(w, h); copy.setSize(w, h);
var lw = w, lh = h;
levels.forEach(function (L) { lw = Math.max(1, lw >> 1); lh = Math.max(1, lh >> 1); L.down.setSize(lw, lh); L.up.setSize(lw, lh); });
compMat.uniforms.uRes.value.set(w, h);
refractors.forEach(function (m) { if (m.uniforms.uResolution) m.uniforms.uResolution.value.set(w, h); });
}
renderer.toneMapping = T.NoToneMapping;
resize();
return {
options: o,
resize: resize,
set: function (k, v) { var u = compMat.uniforms['u' + k.charAt(0).toUpperCase() + k.slice(1)]; if (u) u.value = v; if (k === 'threshold') brightMat.uniforms.uThreshold.value = v; },
refract: function (material) {
refractors.push(material);
material.uniforms.tScene.value = copy.texture;
if (material.uniforms.uResolution) material.uniforms.uResolution.value.copy(size);
},
render: function (time) {
var cur = renderer.getSize(new T.Vector2());
renderer.getDrawingBufferSize(size);
if (size.x !== main.width || size.y !== main.height) resize();
camera.layers.set(0);
renderer.setRenderTarget(main);
renderer.clear();
renderer.render(scene, camera);
if (refractors.length) {
copyMat.uniforms.tMap.value = main.texture;
pass(copyMat, copy);
camera.layers.set(1);
renderer.setRenderTarget(main);
var ac = renderer.autoClear; renderer.autoClear = false;
var bg = scene.background; scene.background = null;
renderer.render(scene, camera);
scene.background = bg; renderer.autoClear = ac;
camera.layers.set(0);
}
var src = main.texture;
if (o.bloom > 0) {
brightMat.uniforms.tMap.value = src;
pass(brightMat, levels[0].down);
for (var i = 1; i < levels.length; i++) {
downMat.uniforms.tMap.value = levels[i - 1].down.texture;
downMat.uniforms.uTexel.value.set(1 / levels[i - 1].down.width, 1 / levels[i - 1].down.height);
pass(downMat, levels[i].down);
}
var acc = levels[levels.length - 1].down.texture;
for (var j = levels.length - 2; j >= 0; j--) {
upMat.uniforms.tMap.value = acc;
upMat.uniforms.tBase.value = levels[j].down.texture;
upMat.uniforms.uTexel.value.set(1 / levels[j + 1].down.width, 1 / levels[j + 1].down.height);
pass(upMat, levels[j].up);
acc = levels[j].up.texture;
}
compMat.uniforms.tBloom.value = acc;
} else {
compMat.uniforms.tBloom.value = levels[levels.length - 1].down.texture;
compMat.uniforms.uBloom.value = 0;
}
compMat.uniforms.uTime.value = (time || 0) % 100;
pass(compMat, null);
void cur;
}
};
};
})();
