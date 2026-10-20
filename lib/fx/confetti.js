(function () {
'use strict';
var fx = Card.fx;
fx.confetti = function (opt) {
opt = opt || {};
var colors = opt.colors || ['#e8a0b4', '#f2c46d', '#9cc9b8', '#b9a6e0', '#f4efe6'];
var pieces = [];
var runner = fx.run(function (ctx, dt, w, h) {
var alive = 0;
for (var i = 0; i < pieces.length; i++) {
var p = pieces[i];
if (p.y > h + 30) continue;
alive++;
p.vy += 260 * dt;
p.vx *= Math.pow(0.35, dt); p.vy *= Math.pow(0.55, dt);
p.vy = Math.min(p.vy, p.fall);
p.x += (p.vx + Math.sin(p.t * p.wob) * 18) * dt;
p.y += p.vy * dt;
p.t += dt;
p.r += p.vr * dt;
ctx.save();
ctx.translate(p.x, p.y);
ctx.rotate(p.r);
ctx.scale(1, Math.cos(p.t * p.flip));
ctx.fillStyle = p.c;
ctx.globalAlpha = Math.min(1, (h + 30 - p.y) / 120);
if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2); ctx.fill(); }
else ctx.fillRect(-p.size / 2, -p.size * 0.22, p.size, p.size * 0.44);
ctx.restore();
}
if (!alive) { pieces.length = 0; return false; }
}, { z: opt.z == null ? 3 : opt.z });
return {
burst: function (b) {
b = b || {};
var n = fx.reduce ? 0 : Math.round((b.count || opt.count || 70) * (fx.lowEnd ? 0.55 : 1));
var w = window.innerWidth, h = window.innerHeight;
var ox = (b.x == null ? 0.5 : b.x) * w, oy = (b.y == null ? -0.02 : b.y) * h;
for (var i = 0; i < n; i++) {
var a = fx.rand(-Math.PI * 0.85, -Math.PI * 0.15);
var sp = fx.rand(260, 620);
pieces.push({
x: ox + fx.rand(-w * 0.15, w * 0.15), y: oy,
vx: Math.cos(a) * sp * fx.rand(0.6, 1.2), vy: oy < 0 ? fx.rand(40, 160) : Math.sin(a) * sp,
fall: fx.rand(70, 140), size: fx.rand(7, 12), c: fx.pick(colors), round: Math.random() < 0.25,
r: fx.rand(0, 6), vr: fx.rand(-6, 6), t: fx.rand(0, 3), flip: fx.rand(3, 8), wob: fx.rand(1, 3)
});
}
runner.start();
}
};
};
})();
