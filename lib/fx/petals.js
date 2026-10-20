(function () {
'use strict';
var fx = Card.fx;
function drawPetal(x, w, h, color) {
x.save();
x.translate(w / 2, h / 2);
x.beginPath();
x.moveTo(0, h * 0.46);
x.bezierCurveTo(-w * 0.55, h * 0.2, -w * 0.4, -h * 0.42, 0, -h * 0.46);
x.bezierCurveTo(w * 0.4, -h * 0.42, w * 0.55, h * 0.2, 0, h * 0.46);
x.closePath();
var g = x.createRadialGradient(-w * 0.1, -h * 0.15, 1, 0, 0, w * 0.6);
g.addColorStop(0, 'rgba(255,255,255,0.35)');
g.addColorStop(1, 'rgba(255,255,255,0)');
x.fillStyle = color; x.fill();
x.fillStyle = g; x.fill();
x.strokeStyle = 'rgba(90,60,50,0.18)'; x.lineWidth = 0.7;
x.beginPath(); x.moveTo(0, h * 0.42); x.quadraticCurveTo(w * 0.05, 0, 0, -h * 0.36); x.stroke();
x.restore();
}
fx.petals = function (opt) {
opt = opt || {};
var colors = opt.colors || ['#e7b7b0', '#efcfb8', '#d9a3a8', '#f2dccb'];
var count = fx.reduce ? 3 : Math.round((opt.count || 10) * (fx.lowEnd ? 0.6 : 1));
var sprites = colors.map(function (c) { return fx.sprite(18, 26, function (x, w, h) { drawPetal(x, w, h, c); }); });
var petals = [], t = 0;
function spawn(p, w, h, anywhere) {
p.s = fx.rand(0.7, 1.3);
p.x = anywhere ? fx.rand(0, w) : -30;
p.y = fx.rand(h * 0.05, h * 0.95);
p.vx = fx.rand(10, 22);
p.vy = fx.rand(-4, 6);
p.rot = fx.rand(0, 6); p.vr = fx.rand(-0.5, 0.5);
p.flip = fx.rand(0, 6); p.vf = fx.rand(0.6, 1.4);
p.ph = fx.rand(0, 6);
p.sp = fx.pick(sprites);
return p;
}
return fx.run(function (ctx, dt, w, h) {
if (!petals.length) for (var i = 0; i < count; i++) petals.push(spawn({}, w, h, true));
t += dt;
for (var j = 0; j < petals.length; j++) {
var p = petals[j];
p.x += p.vx * dt;
p.y += (p.vy + Math.sin(t * 0.7 + p.ph) * 8) * dt;
p.rot += p.vr * dt; p.flip += p.vf * dt;
if (p.x > w + 40) spawn(p, w, h, false);
ctx.save();
ctx.globalAlpha = 0.7;
ctx.translate(p.x, p.y);
ctx.rotate(p.rot);
ctx.scale(p.s * (0.35 + 0.65 * Math.abs(Math.cos(p.flip))), p.s);
ctx.drawImage(p.sp.img, -p.sp.w / 2, -p.sp.h / 2, p.sp.w, p.sp.h);
ctx.restore();
}
}, { z: opt.z });
};
fx.paper = function (opt) {
opt = opt || {};
var size = 360;
var c = document.createElement('canvas');
c.width = c.height = size;
var x = c.getContext('2d');
x.fillStyle = opt.base || '#f4ece2';
x.fillRect(0, 0, size, size);
var img = x.getImageData(0, 0, size, size);
for (var i = 0; i < img.data.length; i += 4) {
var n = (Math.random() - 0.5) * 14;
img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
}
x.putImageData(img, 0, 0);
x.lineWidth = 0.6;
for (var f = 0; f < 90; f++) {
x.strokeStyle = 'rgba(120,95,80,' + fx.rand(0.03, 0.08).toFixed(3) + ')';
var sx = fx.rand(0, size), sy = fx.rand(0, size), a = fx.rand(0, Math.PI), l = fx.rand(6, 22);
x.beginPath();
x.moveTo(sx, sy);
x.quadraticCurveTo(sx + Math.cos(a) * l * 0.5 + fx.rand(-3, 3), sy + Math.sin(a) * l * 0.5 + fx.rand(-3, 3), sx + Math.cos(a) * l, sy + Math.sin(a) * l);
x.stroke();
}
Card.util.root.style.setProperty('--paper', 'url(' + c.toDataURL('image/png') + ')');
var layer = document.createElement('div');
layer.className = 'paper-wash';
layer.setAttribute('aria-hidden', 'true');
var washes = opt.washes || [
['231,183,176', 18, 14, 52, 30],
['184,206,196', 86, 40, 48, 26],
['240,214,170', 30, 78, 58, 32],
['220,196,224', 92, 92, 40, 24]
];
layer.style.background = washes.map(function (w) {
return 'radial-gradient(' + w[3] + '% ' + w[4] + '% at ' + w[1] + '% ' + w[2] + '%, rgba(' + w[0] + ',0.32), rgba(' + w[0] + ',0.12) 45%, rgba(' + w[0] + ',0) 72%)';
}).join(',');
document.body.insertBefore(layer, document.body.firstChild);
};
})();
