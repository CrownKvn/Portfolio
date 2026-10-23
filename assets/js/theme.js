(() => {
  try {
    const saved = localStorage.getItem('kirawnsan-theme');
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
    const motion = localStorage.getItem('kirawnsan-motion');
    if (motion === 'off' || motion === 'on') document.documentElement.dataset.motion = motion;
  } catch (_) {
    /* System storage restrictions should not block the portfolio. */
  }
})();
