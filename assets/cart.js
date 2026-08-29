/* DIYOUTLET 장바구니 — 원본: https://runday.irumai.kr/260829/kit/cart/ */
(function () {
  'use strict';

  var KEY = (typeof window.CART_KEY === 'string' && window.CART_KEY) || 'site-cart';
  var T = {
    title: '장바구니',
    empty: '장바구니가 비어 있습니다.<br>제품 목록에서 마음에 드는 것을 담아보세요.',
    note: '결제와 재고는 스토어에서 진행됩니다. 담은 목록을 들고 이동하세요.',
    copy: '주문 목록 복사',
    ask: '문자로 주문 문의',
    go: '스토어에서 주문 →'
  };
  var custom = window.CART_TEXT;
  if (custom && typeof custom === 'object') {
    for (var k in T) { if (typeof custom[k] === 'string') T[k] = custom[k]; }
  }

  var NOLINK = '스토어 링크 없음';
  var MAX_Q = 99;
  var cart = [];

  try {
    var raw = JSON.parse(localStorage.getItem(KEY));
    if (Object.prototype.toString.call(raw) === '[object Array]') {
      for (var i = 0; i < raw.length; i++) {
        var it = raw[i];
        if (!it || typeof it.name !== 'string') continue;
        cart.push({
          name: it.name,
          price: num(it.price),
          q: Math.min(MAX_Q, Math.max(1, num(it.q) || 1)),
          url: typeof it.url === 'string' ? it.url : ''
        });
      }
    }
  } catch (e) { cart = []; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
  }

  function num(v) {
    var n = parseInt(String(v == null ? '' : v).replace(/[^0-9-]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  function won(n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; }
  var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return ENT[c]; });
  }

  function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? String(u) : ''; }

  function orderText() {
    if (!cart.length) return '';
    var t = 0;
    var parts = [];
    for (var i = 0; i < cart.length; i++) {
      t += cart[i].q * cart[i].price;
      parts.push(cart[i].name + ' ×' + cart[i].q);
    }
    return parts.join(', ') + ' (합계 ' + won(t) + ')';
  }

  var btn, badge, drawer, panel, bodyEl, totalEl, copyBtn, askEl, closeBtn;
  var lastFocus = null;

  function buildButton() {
    var found = document.querySelector('[data-cart-button]');
    if (found) {
      btn = found;
      btn.classList.add('rdcart-btn');
    } else {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rdcart-btn rdcart-btn--float';
      btn.innerHTML =
        '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
        ' stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M3 4h2l2.2 10.6a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.47-1.16L20.5 8H5.6"/>' +
        '<circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>';
      document.body.appendChild(btn);
    }
    if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
    badge = btn.querySelector('.rdcart-btn__count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'rdcart-btn__count';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = '0';
      btn.appendChild(badge);
    }
    btn.addEventListener('click', function () { toggle(); });
  }

  function buildDrawer() {
    drawer = document.createElement('div');
    drawer.className = 'rdcart';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML =
      '<div class="rdcart__back" data-rdcart-close></div>' +
      '<div class="rdcart__panel" role="dialog" aria-modal="true" aria-label="' + esc(T.title) + '">' +
        '<div class="rdcart__head">' +
          '<h2 class="rdcart__title">' + esc(T.title) + '</h2>' +
          '<button class="rdcart__close" type="button" aria-label="장바구니 닫기" data-rdcart-close>&times;</button>' +
        '</div>' +
        '<div class="rdcart__body"></div>' +
        '<div class="rdcart__foot">' +
          '<div class="rdcart__sum"><span>합계</span><b class="rdcart__total">0원</b></div>' +
          '<p class="rdcart__lead">' + esc(T.note) + '</p>' +
          '<div class="rdcart__acts">' +
            '<button class="rdcart__act rdcart__act--solid rdcart__copy" type="button">' + esc(T.copy) + '</button>' +
            '<a class="rdcart__act rdcart__act--ghost rdcart__ask" href="sms:&amp;body=">' + esc(T.ask) + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(drawer);

    panel = drawer.querySelector('.rdcart__panel');
    bodyEl = drawer.querySelector('.rdcart__body');
    totalEl = drawer.querySelector('.rdcart__total');
    copyBtn = drawer.querySelector('.rdcart__copy');
    askEl = drawer.querySelector('.rdcart__ask');
    closeBtn = drawer.querySelector('.rdcart__close');
    drawer.addEventListener('click', onDrawerClick);
    copyBtn.addEventListener('click', onCopy);
  }

  function paint() {
    var count = 0;
    var total = 0;
    var i;
    for (i = 0; i < cart.length; i++) {
      count += cart[i].q;
      total += cart[i].q * cart[i].price;
    }

    if (btn) {
      btn.classList.toggle('rdcart-btn--has', count > 0);
      if (badge) badge.textContent = count;
      btn.setAttribute('aria-label', T.title + ', ' + count + '개');
      btn.setAttribute('aria-expanded', drawer && drawer.classList.contains('rdcart--open') ? 'true' : 'false');
    }
    if (!drawer) return;

    totalEl.textContent = won(total);
    drawer.classList.toggle('rdcart--empty', !cart.length);

    if (!cart.length) {
      bodyEl.innerHTML = '<p class="rdcart__empty">' +
        esc(T.empty).replace(/&lt;br\s*\/?&gt;/gi, '<br>') + '</p>';
    } else {
      var html = '';
      for (i = 0; i < cart.length; i++) {
        var line = cart[i];
        var url = safeUrl(line.url);
        var go = url
          ? '<a class="rdcart__go" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(T.go) + '</a>'
          : '<span class="rdcart__go rdcart__go--off">' + NOLINK + '</span>';
        html +=
          '<div class="rdcart__line">' +
            '<div class="rdcart__grow">' +
              '<b>' + esc(line.name) + '</b>' +
              '<small>' + won(line.price) + '</small>' + go +
            '</div>' +
            '<span class="rdcart__qty">' +
              '<button type="button" data-rdcart-dec="' + i + '" aria-label="' + esc(line.name) + ' 수량 줄이기">&minus;</button>' +
              '<span>' + line.q + '</span>' +
              '<button type="button" data-rdcart-inc="' + i + '" aria-label="' + esc(line.name) + ' 수량 늘리기">+</button>' +
            '</span>' +
            '<button type="button" class="rdcart__kill" data-rdcart-kill="' + i + '" aria-label="' + esc(line.name) + ' 삭제">삭제</button>' +
          '</div>';
      }
      bodyEl.innerHTML = html;
    }

    askEl.setAttribute('href', 'sms:&body=' + encodeURIComponent(orderText()));
    askEl.setAttribute('aria-disabled', cart.length ? 'false' : 'true');
  }

  function add(name, price, url) {
    name = String(name == null ? '' : name).trim();
    if (!name) return;
    var hit = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].name === name) { hit = cart[i]; break; }
    }
    if (hit) {
      if (hit.q < MAX_Q) hit.q++;
      if (url) hit.url = url;
      if (price) hit.price = price;
    } else {
      cart.push({ name: name, price: num(price), q: 1, url: String(url || '') });
    }
    save();
    paint();
  }

  function onDrawerClick(ev) {
    var target = ev.target;
    var hit = target.closest ? target.closest('[data-rdcart-inc],[data-rdcart-dec],[data-rdcart-kill],[data-rdcart-close]') : null;
    if (!hit) return;
    var index = hit.getAttribute('data-rdcart-inc');
    if (index !== null) {
      if (cart[+index] && cart[+index].q < MAX_Q) cart[+index].q++;
      save(); paint(); return;
    }
    index = hit.getAttribute('data-rdcart-dec');
    if (index !== null) {
      var line = cart[+index];
      if (line) { line.q--; if (line.q < 1) cart.splice(+index, 1); }
      save(); paint(); return;
    }
    index = hit.getAttribute('data-rdcart-kill');
    if (index !== null) { cart.splice(+index, 1); save(); paint(); return; }
    if (hit.hasAttribute('data-rdcart-close')) close();
  }

  function open() {
    if (!drawer || drawer.classList.contains('rdcart--open')) return;
    lastFocus = document.activeElement;
    drawer.classList.add('rdcart--open');
    drawer.removeAttribute('aria-hidden');
    document.documentElement.classList.add('rdcart-locked');
    document.body.classList.add('rdcart-locked');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    try { closeBtn.focus(); } catch (e) {}
  }

  function close() {
    if (!drawer || !drawer.classList.contains('rdcart--open')) return;
    drawer.classList.remove('rdcart--open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('rdcart-locked');
    document.body.classList.remove('rdcart-locked');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) {}
  }

  function toggle() { drawer.classList.contains('rdcart--open') ? close() : open(); }

  function onCopy() {
    var text = orderText();
    if (!text) { alert('장바구니가 비어 있습니다.'); return; }
    var was = copyBtn.textContent;
    var done = function () {
      copyBtn.textContent = '복사했습니다';
      setTimeout(function () { copyBtn.textContent = was; }, 1400);
    };
    var fallback = function () {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(textarea);
      textarea.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(textarea);
      if (ok) done(); else window.prompt('아래 내용을 복사하세요', text);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  function init() {
    if (document.querySelector('.rdcart')) return;
    buildButton();
    buildDrawer();

    document.addEventListener('click', function (ev) {
      var button = ev.target.closest ? ev.target.closest('[data-cart-add]') : null;
      if (!button) return;
      ev.preventDefault();
      add(button.getAttribute('data-name'), button.getAttribute('data-price'), button.getAttribute('data-url'));
      if (button.dataset && button.dataset.rdcartBusy) return;
      var was = button.textContent;
      button.dataset.rdcartBusy = '1';
      button.textContent = '담았습니다';
      button.classList.add('rdcart-added');
      setTimeout(function () {
        button.textContent = was;
        button.classList.remove('rdcart-added');
        delete button.dataset.rdcartBusy;
      }, 1100);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' || event.key === 'Esc') { close(); return; }
      if (event.key !== 'Tab' || !drawer.classList.contains('rdcart--open')) return;
      var focusables = panel.querySelectorAll('a[href],button:not([disabled])');
      var list = [];
      for (var i = 0; i < focusables.length; i++) {
        if (focusables[i].offsetWidth || focusables[i].offsetHeight) list.push(focusables[i]);
      }
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (list.indexOf(document.activeElement) === -1) { event.preventDefault(); first.focus(); }
    });

    window.addEventListener('storage', function (event) {
      if (event.key !== KEY) return;
      try { cart = JSON.parse(event.newValue) || []; } catch (error) { cart = []; }
      paint();
    });

    paint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SiteCart = {
    add: add,
    open: open,
    close: close,
    items: function () { return cart.slice(); },
    text: orderText,
    clear: function () { cart = []; save(); paint(); }
  };
})();
