// vol-nav.js — back-to-top + lightbox + vol-tabs edge scroll

// Vol-tabs edge-hover auto-scroll
(function () {
  var tabBar = document.querySelector('.vol-tabs');
  if (!tabBar) return;
  var scrollRaf = null;
  var EDGE = 100;
  var SPEED = 6;

  tabBar.addEventListener('mousemove', function (e) {
    var rect = tabBar.getBoundingClientRect();
    var x = e.clientX - rect.left;
    if (scrollRaf) { cancelAnimationFrame(scrollRaf); scrollRaf = null; }
    if (x < EDGE) {
      (function loop() { tabBar.scrollLeft -= SPEED; scrollRaf = requestAnimationFrame(loop); })();
    } else if (x > rect.width - EDGE) {
      (function loop() { tabBar.scrollLeft += SPEED; scrollRaf = requestAnimationFrame(loop); })();
    }
  });
  tabBar.addEventListener('mouseleave', function () {
    if (scrollRaf) { cancelAnimationFrame(scrollRaf); scrollRaf = null; }
  });
})();

// Back to top
(function () {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// Lightbox
(function () {
  const overlay = document.getElementById('lb-overlay');
  const lbImg   = document.getElementById('lb-img');
  const lbCap   = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-close');
  if (!overlay) return;

  document.querySelectorAll('.img-grid a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      lbImg.src = a.href;
      lbCap.textContent = a.querySelector('img') ? a.querySelector('img').alt : '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLb() {
    overlay.classList.remove('open');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', closeLb);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLb();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLb();
  });
})();
