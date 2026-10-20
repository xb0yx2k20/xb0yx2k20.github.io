(function () {
'use strict';
var Card = window.Card;
Card.on('rendered', async function (secret) {
if (!secret.world || !Card.three) return;
var ok = await Card.three.init(secret.world, secret);
if (!ok) { Card.util.root.classList.remove('has-3d'); return; }
Card.on('set-progress', function (d) { Card.three.progress(d.set, d.p); });
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (e) {
if (e.isIntersecting) Card.three.activate(e.target.getAttribute('data-set'));
});
}, { rootMargin: '-45% 0px -45% 0px' });
Card.util.$$('.scene[data-set]').forEach(function (s) { io.observe(s); });
var first = Card.util.$('.scene[data-set]');
if (first) Card.three.activate(first.getAttribute('data-set'));
});
})();
