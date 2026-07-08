const SHARE_URL = 'https://leeripken.github.io/samsung-hynix-disparity/samsung.html';

document.querySelectorAll('.nav-share').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(SHARE_URL).then(() => {
      const original = btn.textContent;
      btn.textContent = '✅ 복사됨';
      setTimeout(() => { btn.textContent = original; }, 1500);
    });
  });
});
