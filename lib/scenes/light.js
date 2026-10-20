(function () {
'use strict';
if (!Card.three) return;
Card.three.module('light', function (ctx, o) {
var T = ctx.THREE, U = Card.util, L = ctx.lights;
var group = new T.Group();
var a = o.from || {}, b = o.to || a, range = o.range || [0, 1];
var cA = {}, cB = {}, tmp = new T.Color();
['bg', 'sky', 'ground', 'keyColor', 'rimColor', 'fog'].forEach(function (k) {
if (a[k]) cA[k] = new T.Color(a[k]);
if (b[k] || a[k]) cB[k] = new T.Color(b[k] || a[k]);
});
function num(k, d) { var x = a[k] == null ? d : a[k], y = b[k] == null ? x : b[k]; return [x, y]; }
var hemi = num('hemi', L.hemi.intensity), key = num('key', L.key.intensity), rim = num('rim', L.rim.intensity);
var glow = null, g = o.glow;
if (g) {
glow = new T.Sprite(new T.SpriteMaterial({ map: ctx.dot(), color: new T.Color(g.color || '#ffe2b0'), transparent: true,
depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
var gp = g.position || [0, 1, -4];
glow.position.set(gp[0], gp[1], gp[2]);
glow.scale.setScalar(g.size || 3);
group.add(glow);
}
var forced = null, now = 0;
function apply(m, fade) {
if (cA.bg) ctx.setBackground(tmp.copy(cA.bg).lerp(cB.bg, m));
if (cA.sky) L.hemi.color.copy(cA.sky).lerp(cB.sky, m);
if (cA.ground) L.hemi.groundColor.copy(cA.ground).lerp(cB.ground, m);
if (cA.keyColor) L.key.color.copy(cA.keyColor).lerp(cB.keyColor, m);
if (cA.rimColor) L.rim.color.copy(cA.rimColor).lerp(cB.rimColor, m);
L.hemi.intensity = U.lerp(hemi[0], hemi[1], m);
L.key.intensity = U.lerp(key[0], key[1], m);
L.rim.intensity = U.lerp(rim[0], rim[1], m);
if (cA.fog && ctx.scene.fog) ctx.scene.fog.color.copy(cA.fog).lerp(cB.fog, m);
if (glow) {
var gm = U.clamp((m - (g.from || 0)) / ((g.to == null ? 1 : g.to) - (g.from || 0)));
glow.material.opacity = gm * (g.opacity == null ? 0.9 : g.opacity) * fade;
glow.scale.setScalar((g.size || 3) * (0.8 + gm * 0.3));
}
}
return {
group: group,
mix: function (v) { forced = U.clamp(v); },
reset: function () { now = 0; forced = null; },
update: function (t, dt, p, fade) {
var target = forced != null ? forced : U.clamp((p - range[0]) / (range[1] - range[0]));
now += (target - now) * Math.min(1, dt * 2.2);
apply(now, fade == null ? 1 : fade);
}
};
});
})();
