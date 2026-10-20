(function () {
'use strict';
var fx = Card.fx;
function drawLeaf(x, w, h, color) {
var cx = w / 2, cy = h * 0.55;
x.save();
x.translate(cx, cy);
x.beginPath();
var lobes = [[-0.5, 0.05], [-0.42, -0.4], [-0.1, -0.5], [0.1, -0.5], [0.42, -0.4], [0.5, 0.05]];
x.moveTo(0, h * 0.32);
x.bezierCurveTo(-w * 0.18, h * 0.25, -w * 0.48, h * 0.2, lobes[0][0] * w, lobes[0][1] * h);
x.quadraticCurveTo(-w * 0.32, -h * 0.05, lobes[1][0] * w, lobes[1][1] * h);
x.quadraticCurveTo(-w * 0.18, -h * 0.22, lobes[2][0] * w, lobes[2][1] * h);
x.quadraticCurveTo(0, -h * 0.38, 0, -h * 0.55);
x.quadraticCurveTo(0, -h * 0.38, lobes[3][0] * w, lobes[3][1] * h);
x.quadraticCurveTo(w * 0.18, -h * 0.22, lobes[4][0] * w, lobes[4][1] * h);
x.quadraticCurveTo(w * 0.32, -h * 0.05, lobes[5][0] * w, lobes[5][1] * h);
x.bezierCurveTo(w * 0.48, h * 0.2, w * 0.18, h * 0.25, 0, h * 0.32);
x.closePath();
var g = x.createLinearGradient(-w * 0.4, -h * 0.4, w * 0.4, h * 0.3);
g.addColorStop(0, 'rgba(255,240,210,0.35)');
g.addColorStop(0.4, 'rgba(0,0,0,0)');
g.addColorStop(1, 'rgba(0,0,0,0.28)');
x.fillStyle = color;
x.fill();
x.fillStyle = g;
x.fill();
x.strokeStyle = 'rgba(40,20,5,0.35)';
x.lineWidth = 0.8;
x.beginPath();
x.moveTo(0, h * 0.32); x.lineTo(0, -h * 0.45);
x.moveTo(0, h * 0.05); x.lineTo(-w * 0.32, -h * 0.28);
x.moveTo(0, h * 0.05); x.lineTo(w * 0.32, -h * 0.28);
x.stroke();
x.beginPath();
x.moveTo(0, h * 0.32); x.quadraticCurveTo(w * 0.04, h * 0.4, w * 0.02, h * 0.45);
x.strokeStyle = color; x.lineWidth = 1.2; x.stroke();
x.restore();
}
fx.leaves = function (opt) {
opt = opt || {};
var colors = opt.colors || ['#c8692b', '#d9963f', '#a8471f', '#e0b04f', '#8c3a1a'];
var count = fx.reduce ? 4 : Math.round((opt.count || 14) * (fx.lowEnd ? 0.55 : 1));
var sprites = colors.map(function (c) { return fx.sprite(40, 44, function (x, w, h) { drawLeaf(x, w, h, c); }); });
function spawn(leaf, w, h, anywhere) {
leaf.s = fx.rand(0.45, 1.05);
leaf.x = fx.rand(-20, w + 20);
leaf.y = anywhere ? fx.rand(-h * 0.2, h) : fx.rand(-120, -40);
leaf.vy = fx.rand(22, 42) * (0.6 + leaf.s * 0.5);
leaf.sway = fx.rand(18, 46);
leaf.phase = fx.rand(0, Math.PI * 2);
leaf.freq = fx.rand(0.5, 1.1);
leaf.rot = fx.rand(0, Math.PI * 2);
leaf.vr = fx.rand(-0.9, 0.9);
leaf.flip = fx.rand(0, Math.PI * 2);
leaf.vf = fx.rand(1.2, 2.6);
leaf.sp = fx.pick(sprites);
return leaf;
}
var leaves = [], t = 0;
return fx.run(function (ctx, dt, w, h) {
if (!leaves.length) for (var i = 0; i < count; i++) leaves.push(spawn({}, w, h, true));
t += dt;
for (var j = 0; j < leaves.length; j++) {
var L = leaves[j];
L.y += L.vy * dt;
L.rot += L.vr * dt;
L.flip += L.vf * dt;
var x = L.x + Math.sin(t * L.freq + L.phase) * L.sway;
if (L.y > h + 60) spawn(L, w, h, false);
ctx.save();
ctx.globalAlpha = 0.45 + L.s * 0.5;
ctx.translate(x, L.y);
ctx.rotate(L.rot);
ctx.scale(L.s * Math.cos(L.flip), L.s);
ctx.drawImage(L.sp.img, -L.sp.w / 2, -L.sp.h / 2, L.sp.w, L.sp.h);
ctx.restore();
}
}, { z: opt.z });
};
})();
