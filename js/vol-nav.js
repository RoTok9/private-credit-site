// vol-nav.js — back-to-top + lightbox

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
