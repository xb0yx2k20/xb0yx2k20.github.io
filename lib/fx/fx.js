(function () {
'use strict';
var Card = window.Card;
var dpr = Math.min(window.devicePixelRatio || 1, 2);
var lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
(navigator.deviceMemory && navigator.deviceMemory <= 3);
function makeCanvas(z) {
var c = document.createElement('canvas');
c.className = 'fx-canvas';
c.setAttribute('aria-hidden', 'true');
if (z != null) c.style.zIndex = z;
document.body.appendChild(c);
return c;
}
function run(step, opts) {
opts = opts || {};
var canvas = makeCanvas(opts.z);
var ctx = canvas.getContext('2d');
var w = 0, h = 0, raf = 0, last = 0, running = false;
function size() {
w = window.innerWidth;
h = window.innerHeight;
canvas.width = Math.round(w * dpr);
canvas.height = Math.round(h * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function tick(now) {
var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
last = now;
ctx.clearRect(0, 0, w, h);
if (step(ctx, dt, w, h) === false) { running = false; ctx.clearRect(0, 0, w, h); return; }
raf = requestAnimationFrame(tick);
}
function start() {
if (running || document.hidden) return;
running = true;
last = performance.now();
raf = requestAnimationFrame(tick);
}
function stop() { running = false; cancelAnimationFrame(raf); }
size();
window.addEventListener('resize', size);
document.addEventListener('visibilitychange', function () {
if (document.hidden) { cancelAnimationFrame(raf); }
else if (running) { last = performance.now(); raf = requestAnimationFrame(tick); }
});
return { start: start, stop: stop, canvas: canvas, get running() { return running; } };
}
function sprite(wpx, hpx, draw) {
var c = document.createElement('canvas');
c.width = Math.ceil(wpx * dpr);
c.height = Math.ceil(hpx * dpr);
var x = c.getContext('2d');
x.scale(dpr, dpr);
draw(x, wpx, hpx);
return { img: c, w: wpx, h: hpx };
}
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
Card.fx = { run: run, sprite: sprite, rand: rand, pick: pick, dpr: dpr, lowEnd: !!lowEnd, reduce: Card.util.reduce };
})();
