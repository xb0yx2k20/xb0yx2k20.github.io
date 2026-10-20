(function () {
'use strict';
var Card = window.Card;
var T = null;
var U = Card.util;
var lowEnd = !!((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
(navigator.deviceMemory && navigator.deviceMemory <= 3));
var factories = {};
var renderer, scene, camera, canvas, ctx, pipeline = null;
var sets = {}, active = null, raf = 0, running = false, last = 0, time = 0;
var bg, bgTarget, camPos, camLook, tmpPos, tmpLook, loader;
var vars = {};
function ensureThree() {
if (window.THREE) return Promise.resolve(window.THREE);
return new Promise(function (resolve) {
var s = document.createElement('script');
s.src = (Card.three.base || '../../lib/') + 'vendor/three.min.js';
s.onload = function () { resolve(window.THREE || null); };
s.onerror = function () { resolve(null); };
document.head.appendChild(s);
});
}
function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function vec(a, d) { return a ? new T.Vector3(a[0], a[1], a[2]) : d.clone(); }
function scratch() {
bg = new T.Color('#000'); bgTarget = new T.Color('#000');
camPos = new T.Vector3(); camLook = new T.Vector3(); tmpPos = new T.Vector3(); tmpLook = new T.Vector3();
loader = new T.TextureLoader();
}
function fill(v) {
if (typeof v === 'string') return v.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
if (Array.isArray(v)) return v.map(fill);
if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = fill(v[k]); }); return o; }
return v;
}
function petalGeometry(w, h, cup, curl, sx, sy) {
var g = new T.PlaneGeometry(1, 1, sx || 6, sy || 10);
var p = g.attributes.position;
for (var i = 0; i < p.count; i++) {
var x = p.getX(i), y = p.getY(i) + 0.5;
var wp = Math.pow(Math.sin(Math.PI * Math.min(0.985, Math.pow(y, 0.62))), 0.55) * (1 - 0.1 * y);
var X = x * w * wp;
var Z = -cup * (x * x * 4) * h * 0.32 * wp + curl * y * y * h;
p.setXYZ(i, X, y * h, Z);
}
g.computeVertexNormals();
return g;
}
function gradeColors(g, base, body, tip) {
var p = g.attributes.position, h = 0;
for (var i = 0; i < p.count; i++) h = Math.max(h, p.getY(i));
var c0 = new T.Color(base), c1 = new T.Color(body), c2 = new T.Color(tip), c = new T.Color(), arr = [];
for (var j = 0; j < p.count; j++) {
var t = p.getY(j) / (h || 1);
if (t < 0.45) c.copy(c0).lerp(c1, t / 0.45); else c.copy(c1).lerp(c2, (t - 0.45) / 0.55);
arr.push(c.r, c.g, c.b);
}
g.setAttribute('color', new T.Float32BufferAttribute(arr, 3));
return g;
}
function texture(src, cb) {
return loader.load(src, function (tx) { tx.colorSpace = T.SRGBColorSpace; if (cb) cb(tx); });
}
var dotTex = null;
function dot() {
if (dotTex) return dotTex;
var c = document.createElement('canvas'); c.width = c.height = 64;
var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
x.fillStyle = g; x.fillRect(0, 0, 64, 64);
dotTex = new T.CanvasTexture(c);
return dotTex;
}
var sizedW = 0, sizedH = 0;
function size() {
var w = window.innerWidth, h = Math.round(Card.viewport.vh * 100);
if (w === sizedW && Math.abs(h - sizedH) / (sizedH || 1) < 0.3) return;
sizedW = w; sizedH = h;
renderer.setSize(w, h, false);
camera.aspect = w / h;
camera.fov = w < h ? 52 : 42;
camera.updateProjectionMatrix();
if (!running) renderOnce();
}
function applyFade(set, f) {
set.group.traverse(function (o) {
var m = o.material;
if (!m) return;
(Array.isArray(m) ? m : [m]).forEach(function (mat) {
if (mat.uniforms && mat.uniforms.uFade) { mat.uniforms.uFade.value = f; return; }
if (mat._base == null) { mat._base = mat.opacity; mat._transparent = mat.transparent; }
var tr = f < 1 || mat._transparent;
if (mat.transparent !== tr) { mat.transparent = tr; mat.needsUpdate = true; }
mat.opacity = mat._base * f;
});
});
}
function build(set) {
set.group = new T.Group();
scene.add(set.group);
set.mods = (set.def.modules || []).map(function (m) {
var f = factories[m.use];
if (!f) { console.warn('Card.three: no module "' + m.use + '"'); return null; }
var inst = f(ctx, fill(m));
inst.name = m.use;
inst.opts = m;
set.group.add(inst.group);
return inst;
}).filter(Boolean);
set.built = true;
applyFade(set, 0);
set.group.visible = false;
}
function cameraFor(set) {
var c = set.def.camera || {};
var from = vec(c.pos, new T.Vector3(0, 0, 6)), look = vec(c.look, new T.Vector3());
var to = c.to || {};
var r = to.range || [0, 1];
var k = ease(U.clamp((set.p - r[0]) / (r[1] - r[0])));
tmpPos.copy(from).lerp(vec(to.pos, from), k);
tmpLook.copy(look).lerp(vec(to.look, look), k);
}
function frame(now) {
if (tick(Math.min(0.05, (now - last) / 1000 || 0.016))) raf = requestAnimationFrame(frame);
else running = false;
last = now;
}
function tick(dt) {
time += dt;
var anyVisible = false;
Object.keys(sets).forEach(function (name) {
var s = sets[name];
if (!s.built) return;
var target = name === active ? 1 : 0;
s.fade += (target - s.fade) * Math.min(1, dt * 2.6);
if (target === 0 && s.fade < 0.004) s.fade = 0;
if (target === 1 && s.fade > 0.996) s.fade = 1;
var vis = s.fade > 0;
s.group.visible = vis;
if (!vis) return;
anyVisible = true;
if (Math.abs(s.fade - (s.lastFade || 0)) > 0.002 || (s.fade === 1 && s.lastFade !== 1)) {
applyFade(s, s.fade);
s.lastFade = s.fade;
}
for (var i = 0; i < s.mods.length; i++) s.mods[i].update(time, dt, s.p, s.fade);
});
if (active) {
cameraFor(sets[active]);
var k = 1 - Math.exp(-dt * 3.2);
camPos.lerp(tmpPos, k);
camLook.lerp(tmpLook, k);
}
camera.position.copy(camPos);
var drift = active && sets[active].def.camera && sets[active].def.camera.drift;
if (drift) {
camera.position.x += Math.sin(time * 0.31) * drift + Math.sin(time * 0.83) * drift * 0.3;
camera.position.y += Math.sin(time * 0.27 + 1.3) * drift * 0.6;
}
camera.lookAt(camLook);
bg.lerp(bgTarget, 1 - Math.exp(-dt * 2.4));
renderer.setClearColor(bg);
if (scene.fog) scene.fog.color.copy(bg);
if (pipeline) pipeline.render(time); else renderer.render(scene, camera);
return anyVisible || !!active;
}
function start() {
if (running || document.hidden) return;
running = true;
last = performance.now();
raf = requestAnimationFrame(frame);
}
function renderOnce() { if (!renderer) return; if (pipeline) pipeline.render(time); else renderer.render(scene, camera); }
function pointer() {
var down = null, ray = new T.Raycaster(), ndc = new T.Vector2();
function ignored(e) {
return !active || e.target.closest && e.target.closest('button, a, textarea, input, .gate, .lightbox, .chrome, .close, .sound');
}
window.addEventListener('pointerdown', function (e) {
if (ignored(e)) { down = null; return; }
down = { x: e.clientX, y: e.clientY, t: performance.now(), lx: e.clientX, horizontal: null };
}, { passive: true });
window.addEventListener('pointermove', function (e) {
if (!down) return;
var dx = e.clientX - down.x, dy = e.clientY - down.y;
if (down.horizontal == null && Math.hypot(dx, dy) > 8) down.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
if (down.horizontal) {
var step = e.clientX - down.lx;
down.lx = e.clientX;
sets[active].mods.forEach(function (m) { if (m.drag) m.drag(step); });
}
}, { passive: true });
window.addEventListener('pointerup', function (e) {
if (!down) return;
var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 450;
down = null;
if (moved > 10 || !quick) return;
ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
ray.setFromCamera(ndc, camera);
var s = sets[active], best = null;
s.mods.forEach(function (m) {
if (!m.pick || !m.pick.length) return;
var hit = ray.intersectObjects(m.pick, true)[0];
if (hit && (!best || hit.distance < best.hit.distance)) best = { mod: m, hit: hit };
});
if (!best) return;
if (best.mod.tap) best.mod.tap(best.hit);
Card.emit('tap3d', { set: active, module: best.mod.name });
}, { passive: true });
window.addEventListener('pointercancel', function () { down = null; }, { passive: true });
}
Card.three = {
lowEnd: lowEnd,
module: function (name, factory) { factories[name] = factory; },
init: async function (world, content) {
if (renderer) return true;
T = await ensureThree();
if (!T) return false;
try {
var probe = document.createElement('canvas');
if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return false;
} catch (e) { return false; }
scratch();
vars = { name: content.name || '', date: content.date || '' };
canvas = document.createElement('canvas');
canvas.className = 'three-canvas';
canvas.setAttribute('aria-hidden', 'true');
document.body.insertBefore(canvas, document.querySelector('.story') || document.body.firstChild);
var dpr = window.devicePixelRatio || 1, phone = Math.min(screen.width, screen.height) < 600;
var high = world.quality === 'high';
renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !world.post && (high || (!lowEnd && dpr < 2)), alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(dpr, world.maxDpr || 9, high ? (lowEnd ? 1.75 : 2.5) : lowEnd ? 1.25 : phone ? 1.5 : 2));
if (high) { renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = world.exposure || 1; }
scene = new T.Scene();
camera = new T.PerspectiveCamera(48, 1, 0.1, 220);
var hemi = new T.HemisphereLight(0xfff6ea, 0x3a4636, 1.6);
var key = new T.DirectionalLight(0xfff1dc, 2.4);
key.position.set(3, 6, 5);
var rim = new T.DirectionalLight(0xbcd2ff, 0.9);
rim.position.set(-4, 2, -5);
scene.add(hemi, key, rim);
ctx = { THREE: T, scene: scene, camera: camera, renderer: renderer, lowEnd: lowEnd,
lights: { hemi: hemi, key: key, rim: rim },
shared: {},
setBackground: function (c) { bgTarget.set(c); },
petalGeometry: petalGeometry, gradeColors: gradeColors, texture: texture, dot: dot, emit: Card.emit, on: Card.on };
Object.keys(world.sets || {}).forEach(function (name) {
sets[name] = { def: world.sets[name], group: null, mods: [], fade: 0, p: 0, built: false };
});
if (world.post && Card.three.pipeline) {
pipeline = Card.three.pipeline(ctx, world.post);
ctx.pipeline = pipeline;
}
if (world.env && Card.three.environment) {
var envTex = Card.three.environment.build(ctx, world.env);
if (envTex) scene.environment = envTex;
}
if (world.shadows) {
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
}
size();
window.addEventListener('resize', size);
document.addEventListener('visibilitychange', function () {
if (document.hidden) { cancelAnimationFrame(raf); running = false; } else if (active) start();
});
pointer();
return true;
},
activate: function (name) {
if (!renderer || active === name) return;
var s = name && sets[name];
if (name && !s) return;
active = name || null;
if (s) {
if (!s.built) build(s);
bgTarget.set(s.def.bg || '#000');
if (s.def.fog) scene.fog = new T.Fog(bg.getHex(), s.def.fog[0], s.def.fog[1]);
else scene.fog = null;
if (!camPos.lengthSq()) { cameraFor(s); camPos.copy(tmpPos); camLook.copy(tmpLook); }
}
setTimeout(function () { Object.keys(sets).forEach(function (n) { if (!sets[n].built) build(sets[n]); }); }, 1200);
start();
},
progress: function (name, p) { if (sets[name]) sets[name].p = p; },
reset: function (name) {
var s = sets[name];
if (!s) return;
s.p = 0;
s.mods.forEach(function (m) { if (m.reset) m.reset(); });
cameraFor(s); camPos.copy(tmpPos); camLook.copy(tmpLook);
},
get: function (name, use) {
var s = sets[name];
if (!s) return null;
if (!s.built) build(s);
return s.mods.filter(function (m) { return m.name === use; })[0] || null;
},
all: function (name, use) {
var s = sets[name];
if (!s) return [];
if (!s.built) build(s);
return s.mods.filter(function (m) { return m.name === use; });
},
get shared() { return ctx ? ctx.shared : {}; },
get canvas() { return canvas; },
get ready() { return !!renderer; },
step: function (n, dt) { if (!renderer) return; for (var i = 0; i < (n || 1); i++) tick(dt || 1 / 60); },
get active() { return active; }
};
})();
