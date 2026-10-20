(function () {
'use strict';
var U = Card.util;
function hexToRgb(hex) {
var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '').trim());
return m ? parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) : null;
}
function theme(colors) {
Object.keys(colors || {}).forEach(function (k) {
U.root.style.setProperty('--' + k, colors[k]);
var rgb = hexToRgb(colors[k]);
if (rgb) U.root.style.setProperty('--' + k + '-rgb', rgb);
});
var meta = document.querySelector('meta[name="theme-color"]');
if (meta && colors && colors.bg) meta.setAttribute('content', colors.bg);
}
function fail(msg) {
var box = U.el('div', 'boot-error', '<p>' + msg + '</p>');
document.body.appendChild(box);
}
async function boot() {
if (document.body.classList.contains('has-grain')) Card.noiseTile();
var content;
try {
var res = await fetch('content.json', { cache: 'no-cache' });
content = await res.json();
} catch (e) {
return fail('Не удалось загрузить открытку. Проверьте интернет и обновите страницу.');
}
var pub = content.public || {};
if (pub.title) document.title = pub.title;
theme(pub.colors);
if (Card.guard && !Card.guard(pub)) return;
if (pub.music) Card.sound.useTrack(pub.music);
var result = await Card.gate.mount(pub, content.secret);
if (result.known) Card.notify(pub.notify, 'return', '🔁 Открытка открыта повторно', 10 * 60 * 1000);
else Card.notify(pub.notify, 'unlock', '🌿 Открытка открыта');
Card.on('end', function (end) { if (end) Card.notify(pub.notify, 'end', '✨ Дочитано до конца'); });
if (typeof Card.play === 'function') {
var play = Card.play(result.secret, pub) || {};
Card.session = { pub: pub, secret: result.secret, play: play, ref: content.secret };
Card.gate.open(function () {
Card.emit('open', result.secret);
if (play.start) play.start();
});
return;
}
Card.render(result.secret, U.$('.story'));
Card.scenes.start();
Card.gate.open(function () {
Card.emit('open', result.secret);
Card.intro();
});
}
boot();
})();
