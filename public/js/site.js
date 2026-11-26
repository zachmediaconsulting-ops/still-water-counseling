/* Still Water Professional Counseling: progressive enhancement only (menu, gallery lightbox, form submit). */
(function () {
  'use strict';

  /* ---------- Main menu: desktop dropdown on hover (CSS), mobile collapse below breakpoint ---------- */
  var navs = document.querySelectorAll('nav.awb-menu');
  function layout() {
    navs.forEach(function (nav) {
      var bp = parseInt(nav.getAttribute('data-breakpoint') || '800', 10);
      var mobile = window.innerWidth <= bp;
      nav.classList.toggle('collapse-enabled', mobile);
      nav.classList.toggle('awb-menu_desktop', !mobile);
      /* full-width mobile panel: stretch the menu to the viewport edges, as the original theme did */
      var ul = nav.querySelector('.awb-menu__main-ul');
      if (ul && nav.classList.contains('mobile-size-full-absolute')) {
        ul.style.left = mobile ? (-nav.getBoundingClientRect().left) + 'px' : '';
        ul.style.width = mobile ? '100vw' : '';
      }
      if (!mobile) {
        nav.classList.remove('expanded');
        var t = nav.querySelector('.awb-menu__m-toggle');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
  }
  navs.forEach(function (nav) {
    var toggle = nav.querySelector('.awb-menu__m-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('expanded');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.awb-menu__open-nav-submenu_mobile').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var li = btn.closest('li');
        var open = li.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    /* "Counseling Services" is a href="#" parent: on touch/mobile, tapping it opens the submenu */
    nav.querySelectorAll('.menu-item-has-children > a[href="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var btn = a.parentNode.querySelector('.awb-menu__open-nav-submenu_mobile');
        if (nav.classList.contains('collapse-enabled') && btn) btn.click();
      });
    });
  });
  layout();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 100); });

  /* ---------- Scroll-in animations (desktop only, as on the original) ---------- */
  var anim = document.querySelectorAll('.fusion-animated');
  if (anim.length && 'IntersectionObserver' in window && window.innerWidth > 1024 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('sw-anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, d = parseFloat(el.getAttribute('data-animationduration'));
        if (d) el.style.setProperty('--sw-dur', d + 's');
        el.classList.add('sw-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    anim.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Gallery lightbox ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('a.fusion-lightbox'));
  if (links.length) {
    var box = document.createElement('div');
    box.className = 'sw-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML = '<button type="button" class="sw-lb-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="sw-lb-prev" aria-label="Previous image">&#8249;</button>' +
      '<img alt=""><button type="button" class="sw-lb-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(box);
    var img = box.querySelector('img'), cur = 0, last = null;
    function show(i) {
      cur = (i + links.length) % links.length;
      var a = links[cur], t = a.querySelector('img');
      img.src = a.getAttribute('href');
      img.alt = t ? (t.getAttribute('alt') || t.getAttribute('aria-label') || '') : '';
    }
    function close() { box.classList.remove('open'); document.documentElement.style.overflow = ''; if (last) last.focus(); }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); last = a; show(i);
        box.classList.add('open'); document.documentElement.style.overflow = 'hidden';
        box.querySelector('.sw-lb-close').focus();
      });
    });
    box.querySelector('.sw-lb-close').addEventListener('click', close);
    box.querySelector('.sw-lb-prev').addEventListener('click', function () { show(cur - 1); });
    box.querySelector('.sw-lb-next').addEventListener('click', function () { show(cur + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  /* ---------- Forms: post to the Cloudflare Pages Function (/api/contact), which sends via Resend ---------- */
  document.querySelectorAll('form[action="/api/contact"]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var one = form.getAttribute('data-need-one');
      if (one && !one.split(',').some(function (n) { var f = form.elements[n]; return f && f.value.trim(); })) {
        status.className = 'form-status is-error';
        status.textContent = 'Please enter a phone number or an email address so we can reach you.';
        var first = form.elements[one.split(',')[0]]; if (first) first.focus();
        return;
      }
      btn.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j.error || 'Error'); er.status = r.status; throw er; } return j; }); })
        .then(function () {
          form.reset();
          status.className = 'form-status is-success';
          status.textContent = 'Thank you for your message. It has been sent.';
        })
        .catch(function (err) {
          status.className = 'form-status is-error';
          status.textContent = err && err.status === 422 ? err.message :
            'Sorry, your message could not be sent. Please call (989) 832-0191.';
        })
        .then(function () { btn.disabled = false; });
    });
  });

  /* ---------- Internal pages (reference layouts): counselor bio pop-ups + scroll entrances ---------- */
  var refMain = document.querySelector('main.ref');
  if (refMain) {
    refMain.querySelectorAll('[data-bio]').forEach(function (btn) {
      var dlg = document.getElementById(btn.getAttribute('data-bio'));
      if (!dlg || typeof dlg.showModal !== 'function') return;
      btn.addEventListener('click', function (e) { e.preventDefault(); dlg.showModal(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      var x = dlg.querySelector('.bio__close'); if (x) x.addEventListener('click', function () { dlg.close(); });
    });
    var h = location.hash.slice(1);  // links from the home page counselor cards, e.g. #carol-boothroyd
    if (h) { var d = document.getElementById('bio-' + h); if (d && d.showModal) d.showModal(); }

    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var groups = [
        ['main.ref .band .eyebrow, main.ref .band h2, main.ref .band .lede, main.ref .band .link-arrow', 'sr-text'],
        ['main.ref .prose > p, main.ref .prose > h2, main.ref .prose > h3, main.ref .prose > ul, main.ref .prose > blockquote, main.ref .prose > .callout, main.ref .prose > .facts, main.ref .prose > .video', 'sr-text'],
        ['main.ref .cards > *, main.ref .svc-list > *, main.ref .team-grid > *, main.ref .values > *, main.ref .contact-grid > *, main.ref .facts > *, main.ref .gallery > *, main.ref .figure-pair > *, main.ref .aside > *', 'sr-card'],
        ['main.ref .cta-band__inner > *', 'sr-text'],
        ['main.ref .page-hero__inner > *', 'sr-text']
      ];
      var els = [];
      groups.forEach(function (g) {
        document.querySelectorAll(g[0]).forEach(function (el) {
          if (el.closest('dialog') || el.classList.contains('sr')) return;
          el.classList.add('sr', g[1]); els.push(el);
        });
      });
      els.forEach(function (el) {
        if (!el.classList.contains('sr-card') && !el.closest('.page-hero__inner') && el.tagName !== 'LI') return;
        var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('sr'); });
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 6) * 110 + 'ms';
      });
      var vh = window.innerHeight;
      var srio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('sr-in'); srio.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('sr-in', 'sr-instant'); else srio.observe(el);
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        document.querySelectorAll('.sr-instant').forEach(function (el) { el.classList.remove('sr-instant'); });
      }); });
    }
  }
})();
