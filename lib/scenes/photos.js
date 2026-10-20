(function () {
'use strict';
if (!Card.three) return;
var box = null;
function lightbox(src, caption) {
if (!box) {
box = document.createElement('div');
box.className = 'lightbox';
box.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><span class="lightbox__close micro">Закрыть</span>';
box.addEventListener('click', function () {
box.classList.remove('is-open');
document.documentElement.classList.remove('is-lightbox');
});
document.body.appendChild(box);
}
box.querySelector('img').src = src;
box.querySelector('figcaption').textContent = caption || '';
requestAnimationFrame(function () {
box.classList.add('is-open');
document.documentElement.classList.add('is-lightbox');
});
}
function loadImage(src) {
return new Promise(function (resolve) {
var img = new Image();
img.onload = function () { resolve(img); };
img.onerror = function () { resolve(null); };
img.src = src;
});
}
function paint(T, img, item, frame) {
var W = 512, H = frame === 'polaroid' ? 620 : 512, pad = frame === 'polaroid' ? 26 : 0;
var c = document.createElement('canvas'); c.width = W; c.height = H;
var x = c.getContext('2d');
if (frame === 'polaroid') {
x.fillStyle = '#fbf8f2'; x.fillRect(0, 0, W, H);
}
var side = W - pad * 2;
x.fillStyle = '#d9d2c7'; x.fillRect(pad, pad, side, side);
if (img) {
var r = Math.max(side / img.width, side / img.height), w = img.width * r, h = img.height * r;
x.save(); x.beginPath(); x.rect(pad, pad, side, side); x.clip();
x.drawImage(img, pad + (side - w) / 2, pad + (side - h) / 2, w, h);
x.restore();
}
if (frame === 'polaroid' && item.caption) {
x.fillStyle = '#3b302a';
x.font = '600 40px Caveat, "Segoe Print", cursive';
x.textAlign = 'center';
x.fillText(item.caption, W / 2, side + pad + 62);
}
var tex = new T.CanvasTexture(c);
tex.colorSpace = T.SRGBColorSpace;
tex.anisotropy = 4;
return { tex: tex, aspect: H / W };
}
Card.three.module('photos', function (ctx, o) {
var T = ctx.THREE;
var items = (o.items || []).slice(0, 10);
var layout = o.layout || 'scatter', frame = o.frame || (layout === 'sky' ? 'glow' : 'polaroid');
var size = o.size || 1, c = o.center || [0, 1, 0], R = o.radius || 3.2;
var group = new T.Group(), spinGroup = new T.Group();
group.position.set(c[0], c[1], c[2]);
group.add(spinGroup);
var cards = [], pick = [];
var vel = 0, angle = 0, spin = o.spin == null ? (layout === 'sky' ? 0.04 : 0) : o.spin;
var step = Math.PI * 2 / Math.max(1, items.length), target = 0, idle = 0, dragging = 0;
items.forEach(function (item, i) {
var holder = new T.Group();
var mat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: T.DoubleSide, transparent: true });
if (frame === 'glow') { mat = new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide, transparent: true }); }
var mesh = new T.Mesh(new T.PlaneGeometry(1, frame === 'polaroid' ? 1.21 : 1), mat);
mesh.userData.item = item;
holder.add(mesh);
if (frame === 'glow') {
var halo = new T.Sprite(new T.SpriteMaterial({ map: ctx.dot(), color: new T.Color(o.glow || '#cfe0ff'), transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending }));
halo.scale.set(2.4, 2.4, 1);
halo.position.z = -0.05;
holder.add(halo);
}
var n = items.length, s = size * (layout === 'sky' ? 0.75 : 1);
holder.scale.setScalar(s);
if (layout === 'ring') {
var a = (i / n) * Math.PI * 2;
holder.position.set(Math.sin(a) * R, (i % 2 ? 0.25 : -0.2), Math.cos(a) * R);
holder.rotation.y = a;
} else if (layout === 'sky') {
var b = (i / n) * Math.PI * 2 + 0.4;
holder.position.set(Math.sin(b) * (3 + (i % 3)), (i % 2 ? 1.3 : -0.9) + Math.sin(i * 1.7) * 0.6, -4 - (i % 3) * 2.2);
} else {
var cols = Math.ceil(Math.sqrt(n)), row = Math.floor(i / cols), col = i % cols;
holder.position.set((col - (cols - 1) / 2) * 1.25 + (Math.random() - 0.5) * 0.3,
-(row - (Math.ceil(n / cols) - 1) / 2) * 1.45 + (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.8);
holder.rotation.set((Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3);
}
spinGroup.add(holder);
cards.push({ holder: holder, mesh: mesh, ph: Math.random() * 6.28, base: holder.position.clone() });
pick.push(mesh);
var draw = function () {
loadImage(item.src).then(function (img) {
var p = paint(T, img, item, frame);
mat.map = p.tex;
mat.needsUpdate = true;
});
};
if (frame === 'polaroid' && item.caption && document.fonts && document.fonts.load) document.fonts.load('600 40px Caveat').then(draw, draw);
else draw();
});
return {
group: group,
pick: pick,
drag: function (dx) {
if (layout === 'ring') { angle += dx * 0.006; target = angle; dragging = 0.25; idle = 0; return; }
vel += dx * 0.0045;
},
tap: function (hit) {
var it = hit.object.userData.item;
if (it) lightbox(it.src, it.caption);
},
update: function (t, dt, p) {
if (layout === 'ring') {
dragging = Math.max(0, dragging - dt);
if (!dragging) {
idle += dt;
if (idle > (o.advance || 3.6)) { idle = 0; target = (Math.round(angle / step) + 1) * step; }
else if (Math.abs(target - angle) < 1e-3 || target === angle) target = Math.round(angle / step) * step;
angle += (target - angle) * Math.min(1, dt * 3);
}
} else {
vel *= Math.pow(0.04, dt);
angle += vel + spin * dt;
}
spinGroup.rotation.y = -angle;
for (var i = 0; i < cards.length; i++) {
var C = cards[i];
C.holder.position.y = C.base.y + Math.sin(t * 0.6 + C.ph) * 0.06;
if (layout === 'ring') {
C.holder.rotation.y = angle;
}
if (layout === 'sky') C.holder.lookAt(ctx.camera.position);
}
group.position.y = c[1] + (p - 0.5) * 0.4;
}
};
});
})();
