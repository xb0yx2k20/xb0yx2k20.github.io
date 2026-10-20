(function () {
'use strict';
if (!Card.three) return;
var GRAD_FRAG = [
'uniform vec3 uTop; uniform vec3 uFloor; varying vec3 vDir;',
'void main() { float y = normalize(vDir).y; gl_FragColor = vec4(mix(uFloor, uTop, smoothstep(-0.4, 0.6, y)), 1.0); }'
].join('\n');
var GRAD_VERT = 'varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
var pmrem = null;
function fromScene(ctx, envScene, sigma) {
var T = ctx.THREE;
if (!pmrem) { pmrem = new T.PMREMGenerator(ctx.renderer); pmrem.compileCubemapShader(); }
var rt = pmrem.fromScene(envScene, sigma || 0.02, 0.1, 100);
return rt.texture;
}
function studio(ctx, o) {
var T = ctx.THREE, s = new T.Scene(), k = o.intensity || 1;
var dome = new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.ShaderMaterial({
side: T.BackSide, vertexShader: GRAD_VERT, fragmentShader: GRAD_FRAG,
uniforms: { uTop: { value: new T.Color(o.top || '#2a2228') }, uFloor: { value: new T.Color(o.floor || '#1a1012') } }
}));
s.add(dome);
function panel(color, power, w, h, pos) {
var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(power * k), side: T.DoubleSide }));
m.position.set(pos[0], pos[1], pos[2]);
m.lookAt(0, 0, 0);
s.add(m);
}
panel(o.key || '#fff1e2', 9, 7, 5, [-5, 8, 6]);
panel(o.fill || '#6b4a5a', 1.6, 10, 6, [9, 1, 2]);
panel(o.rim || '#ffb7c4', 6, 2, 10, [2, 3, -9]);
panel(o.key || '#fff1e2', 2, 12, 3, [0, -6, 4]);
return s;
}
Card.three.environment = {
fromScene: fromScene,
build: function (ctx, o) {
if (!o || o.type === 'sky') return null;
return fromScene(ctx, studio(ctx, o), 0.04);
}
};
})();
