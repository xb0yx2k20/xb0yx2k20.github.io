(function () {
'use strict';
var U = Card.util;
function isPhone() {
var touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
var side = Math.min(screen.width || 0, screen.height || 0);
var ua = navigator.userAgent || '';
var mobileUA = /iPhone|iPod|Android.+Mobile|Mobile.+Firefox|SamsungBrowser.+Mobile/i.test(ua);
return side > 0 && side <= 520 && (touch || mobileUA);
}
function landscape() {
var wide = window.innerWidth > window.innerHeight;
var o = screen.orientation && screen.orientation.type;
if (o) return wide && o.indexOf('landscape') === 0;
if (typeof window.orientation === 'number') return wide && Math.abs(window.orientation) === 90;
return window.innerWidth > window.innerHeight * 1.15;
}
function cover(cls, html) {
var d = U.el('div', 'guard ' + cls, '<div class="guard__in">' + html + '</div>');
document.body.appendChild(d);
return d;
}
Card.guard = function (pub) {
if (!pub || pub.device !== 'phone') return true;
if (!isPhone()) {
document.documentElement.classList.add('is-guarded');
cover('guard--device',
'<span class="guard__phone" aria-hidden="true"></span>' +
'<p class="guard__title">Открой эту открытку на&nbsp;телефоне</p>' +
'<p class="guard__text">Она сделана для экрана телефона и&nbsp;пальцев. Перешли себе ссылку и&nbsp;открой её там.</p>');
return false;
}
var turn = cover('guard--turn',
'<span class="guard__phone guard__phone--turn" aria-hidden="true"></span>' +
'<p class="guard__title">Поверни телефон</p>' +
'<p class="guard__text">Открытка смотрится только вертикально</p>');
function check() { turn.classList.toggle('is-on', landscape()); }
check();
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', check);
window.addEventListener('orientationchange', function () { setTimeout(check, 60); });
window.addEventListener('resize', check);
var armed = false;
function arm() {
if (armed) return;
armed = true;
try { history.pushState({ card: 1 }, ''); } catch (e) {  }
}
window.addEventListener('pointerdown', arm, { once: true, capture: true });
window.addEventListener('popstate', function () { try { history.pushState({ card: 1 }, ''); } catch (e) {  } });
return true;
};
})();
