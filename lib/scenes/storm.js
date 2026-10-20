(function () {
'use strict';
if (!Card.three) return;
var VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
var FRAG = [
'uniform vec3 uColor; uniform float uPower; uniform float uSharp; varying vec2 vUv;',
'void main() {',
'  float a = pow(max(1.0 - abs(vUv.y * 2.0 - 1.0), 0.0), uSharp);',
'  gl_FragColor = vec4(uColor * uPower * a * mix(0.55, 1.0, vUv.x), 1.0);',
'}'
].join('\n');
function jag(a, b, rough, depth, out) {
if (depth === 0) { out.push(b); return; }
var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
var m = [(a[0] + b[0]) / 2 + (Math.random() - 0.5) * len * rough, (a[1] + b[1]) / 2 + (Math.random() - 0.5) * len * rough * 0.25];
jag(a, m, rough * 0.9, depth - 1, out);
jag(m, b, rough * 0.9, depth - 1, out);
}
Card.three.module('storm', function (ctx, o) {
var T = ctx.THREE, U = Card.util;
var every = o.every || [3.5, 8], dist = o.dist || [22, 34], spread = o.spread == null ? 5 : o.spread, top = o.top || 8.5;
var color = new T.Color(o.color || '#cfd6ff');
var group = new T.Group();
function mat(power, sharp) {
return new T.ShaderMaterial({ uniforms: { uColor: { value: color }, uPower: { value: 0 }, uSharp: { value: sharp }, base: { value: power } },
vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false });
}
var core = mat(14, 1.5), halo = mat(1.1, 2.2);
var boltCore = new T.Mesh(new T.BufferGeometry(), core), boltHalo = new T.Mesh(new T.BufferGeometry(), halo);
boltCore.frustumCulled = boltHalo.frustumCulled = false;
boltCore.renderOrder = boltHalo.renderOrder = 2;
group.add(boltHalo, boltCore);
var gc = document.createElement('canvas'); gc.width = gc.height = 128;
var gx = gc.getContext('2d'), gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.35, 'rgba(255,255,255,0.35)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
var glow = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(gc), color: color.clone(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, opacity: 0 }));
glow.scale.set(22, 11, 1);
group.add(glow);
var hemi = new T.HemisphereLight(color, new T.Color('#1a2340'), 0);
group.add(hemi);
function ribbon(paths, scale) {
var pos = [], uv = [], idx = [], base = 0;
paths.forEach(function (p) {
var pts = p.pts, w = p.w * scale;
for (var i = 0; i < pts.length; i++) {
var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
var nx = -dy / l, ny = dx / l, k = 1 - i / (pts.length - 1) * 0.6, ww = w * k;
pos.push(pts[i][0] + nx * ww, pts[i][1] + ny * ww, p.z, pts[i][0] - nx * ww, pts[i][1] - ny * ww, p.z);
var u = 1 - (top - pts[i][1]) / top;
uv.push(u, 0, u, 1);
if (i) idx.push(base + 2 * i - 2, base + 2 * i - 1, base + 2 * i, base + 2 * i - 1, base + 2 * i + 1, base + 2 * i);
}
base += pts.length * 2;
});
var g = new T.BufferGeometry();
g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
g.setIndex(idx);
return g;
}
function newBolt(x, z) {
var trunk = [[x, top]];
jag([x, top], [x + (Math.random() - 0.5) * 4, -0.2], 0.55, 6, trunk);
var paths = [{ pts: trunk, w: 0.075, z: z }];
var n = 2 + Math.floor(Math.random() * 4);
for (var b = 0; b < n; b++) {
var from = trunk[4 + Math.floor(Math.random() * (trunk.length * 0.6))];
var dir = Math.random() < 0.5 ? -1 : 1, len = 1 + Math.random() * 2.6;
var br = [from];
jag(from, [from[0] + dir * len, from[1] - len * (0.6 + Math.random() * 0.8)], 0.6, 4, br);
paths.push({ pts: br, w: 0.035, z: z + 0.01 });
}
boltCore.geometry.dispose(); boltHalo.geometry.dispose();
boltCore.geometry = ribbon(paths, 1);
boltHalo.geometry = ribbon(paths, 9);
}
var st, pulses = [];
function fresh() { st = { next: o.first == null ? 2.5 : o.first, clock: 0, at: -9, bolt: false, x: 0, flash: 0 }; pulses = []; }
fresh();
var skyAdd = new T.Color();
function strike(level, hold) {
var withBolt = Math.random() < (o.bolt == null ? 0.65 : o.bolt);
var near = Math.random();
st.x = (Math.random() - 0.5) * 2 * spread;
var z = -(dist[0] + (dist[1] - dist[0]) * near);
st.bolt = withBolt;
if (withBolt) newBolt(st.x, z);
glow.position.set(st.x, top - 1, z - 1);
var amp = (withBolt ? 1 : 0.55) * (0.75 + 0.25 * level);
st.at = st.clock;
pulses = [[0, amp, 0.07], [0.12, amp * 0.55, 0.05], [0.22, amp, 0.11]];
if (Math.random() < 0.5) pulses.push([0.42, amp * 0.7, 0.06]);
if (hold) pulses = [[0, amp, hold]];
Card.emit('storm', { power: amp * (1.2 - near * 0.5), delay: 0.5 + near * 2.2 });
}
return {
group: group,
reset: fresh,
strike: function (hold) { strike(ctx.shared.rain == null ? 1 : ctx.shared.rain, hold); },
update: function (t, dt, p, fade) {
var level = ctx.shared.rain == null ? 1 : ctx.shared.rain;
st.clock += dt;
if (st.clock > st.next) {
if (level > 0.3) strike(level);
st.next = st.clock + (every[0] + Math.random() * (every[1] - every[0])) / Math.max(0.5, level);
}
var e = st.clock - st.at, f = 0;
for (var i = 0; i < pulses.length; i++) {
var q = pulses[i], s = e - q[0];
if (s < 0) continue;
f = Math.max(f, s < q[2] ? q[1] : q[1] * Math.exp(-(s - q[2]) * 16));
}
f *= fade == null ? 1 : fade;
st.flash = f;
ctx.shared.flash = f; ctx.shared.flashX = st.x;
var on = f > 0.004;
boltCore.visible = boltHalo.visible = on && st.bolt;
core.uniforms.uPower.value = core.uniforms.base.value * f;
halo.uniforms.uPower.value = halo.uniforms.base.value * f;
glow.material.opacity = f * 0.9;
glow.visible = on;
hemi.intensity = f * 2.2;
if (on && ctx.shared.sky) {
var sk = ctx.shared.sky;
skyAdd.copy(color).multiplyScalar(f * 0.16);
sk.zenith.add(skyAdd); sk.mid.add(skyAdd.multiplyScalar(1.3)); sk.horizon.add(skyAdd);
}
}
};
});
})();
