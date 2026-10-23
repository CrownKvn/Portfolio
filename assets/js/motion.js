/* Progressive motion: content and controls remain usable without animation APIs. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const toggle = document.querySelector('#motion-toggle');
  const profile = document.querySelector('.profile-card');
  const dock = document.querySelector('.desktop-nav');
  const header = document.querySelector('.site-header');
  const controller = new AbortController();
  const observers = [];
  const animations = new Map();
  const ambient = [
    ...document.querySelectorAll(
      '.hero, .profile-card, .stack-band, .footer-intro, .motion-section',
    ),
  ];
  const controlSelector = 'button, .button, .nav-cta, .social-icons a, .contact-links a';
  const tiltSelector = '.profile-card, .tech-card';
  const lightSelector = '.glow-card, .tech-card, .button, .nav-cta';
  const aura = document.createElement('div');
  aura.className = 'pointer-aura';
  aura.setAttribute('aria-hidden', 'true');
  document.body.append(aura);
  const rim = document.createElement('span');
  rim.className = 'glass-rim';
  rim.setAttribute('aria-hidden', 'true');
  profile?.append(rim);
  document.querySelectorAll(controlSelector).forEach((node) => (node.dataset.liquidControl = ''));
  document.querySelectorAll('.button, .nav-cta').forEach((node) => {
    const reflection = document.createElement('span');
    reflection.className = 'control-reflection';
    reflection.setAttribute('aria-hidden', 'true');
    node.append(reflection);
  });

  let pointerFrame = 0,
    scrollFrame = 0,
    springFrame = 0;
  let lightNode = null,
    tiltNode = null,
    magneticNode = null;
  let pointerX = 0,
    pointerY = 0,
    lastTime = 0;
  const spring = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  const allowed = () => !reduced.matches && root.dataset.motion !== 'off';
  const interactive = () => allowed() && pointer.matches && !document.hidden;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const listen = (target, type, handler, options = {}) =>
    target?.addEventListener(type, handler, { ...options, signal: controller.signal });

  function animate(node, frames, options, cleanup = () => {}) {
    if (!allowed() || document.hidden || typeof node.animate !== 'function') {
      cleanup();
      return;
    }
    try {
      const animation = node.animate(frames, options);
      animations.set(animation, cleanup);
      animation.finished
        .catch(() => {})
        .finally(() => {
          if (!animations.has(animation)) return;
          animations.delete(animation);
          cleanup();
        });
    } catch {
      cleanup();
    }
  }

  function enter(node, delay = 0) {
    animate(
      node,
      [
        { opacity: 0, translate: '0 18px' },
        { opacity: 1, translate: '0 0' },
      ],
      {
        duration: 650,
        delay,
        easing: 'cubic-bezier(.22,.8,.3,1)',
        fill: 'backwards',
      },
    );
  }

  function clearProperties(node, names) {
    names.forEach((name) => node?.style.removeProperty(name));
  }

  function resetPointer() {
    cancelAnimationFrame(pointerFrame);
    cancelAnimationFrame(springFrame);
    pointerFrame = springFrame = 0;
    aura.classList.remove('pointer-visible');
    clearProperties(lightNode, ['--light-x', '--light-y', '--light-opacity']);
    clearProperties(tiltNode, ['--tilt-x', '--tilt-y', '--portrait-x']);
    clearProperties(magneticNode, ['--magnet-x', '--magnet-y']);
    lightNode = tiltNode = magneticNode = null;
    Object.assign(spring, { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
    lastTime = 0;
  }

  // A damped spring runs only while a magnetic control is moving.
  function stepSpring(time) {
    springFrame = 0;
    if (!magneticNode || !interactive()) return;
    const dt = Math.min((time - (lastTime || time - 16)) / 1000, 0.032);
    lastTime = time;
    for (const axis of ['x', 'y']) {
      const velocity = 'v' + axis;
      spring[velocity] += ((spring['t' + axis] - spring[axis]) * 190 - spring[velocity] * 23) * dt;
      spring[axis] += spring[velocity] * dt;
      magneticNode.style.setProperty('--magnet-' + axis, spring[axis].toFixed(3) + 'px');
    }
    if (
      Math.abs(spring.tx - spring.x) +
        Math.abs(spring.ty - spring.y) +
        Math.abs(spring.vx) +
        Math.abs(spring.vy) >
      0.05
    ) {
      springFrame = requestAnimationFrame(stepSpring);
    } else {
      lastTime = 0;
    }
  }

  function paintPointer() {
    pointerFrame = 0;
    if (!interactive()) return;
    aura.style.transform = `translate3d(${pointerX - 100}px, ${pointerY - 100}px, 0)`;
    aura.classList.add('pointer-visible');
    // Read each target's geometry once per frame, then write its light/tilt variables.
    const bounds = new Map();
    for (const node of [lightNode, tiltNode, magneticNode]) {
      if (node && !bounds.has(node)) bounds.set(node, node.getBoundingClientRect());
    }
    if (lightNode) {
      const box = bounds.get(lightNode);
      lightNode.style.setProperty(
        '--light-x',
        `${clamp((pointerX - box.left) / box.width, 0, 1) * 100}%`,
      );
      lightNode.style.setProperty(
        '--light-y',
        `${clamp((pointerY - box.top) / box.height, 0, 1) * 100}%`,
      );
      lightNode.style.setProperty('--light-opacity', '1');
    }
    if (tiltNode) {
      const box = bounds.get(tiltNode);
      const x = clamp((pointerX - box.left) / box.width, 0, 1) - 0.5;
      const y = clamp((pointerY - box.top) / box.height, 0, 1) - 0.5;
      tiltNode.style.setProperty('--tilt-x', `${-y * 6}deg`);
      tiltNode.style.setProperty('--tilt-y', `${x * 6}deg`);
      tiltNode.style.setProperty('--portrait-x', `${x * 4}px`);
    }
    if (magneticNode) {
      const box = bounds.get(magneticNode);
      spring.tx = clamp((pointerX - box.left - box.width / 2) * 0.075, -5, 5);
      spring.ty = clamp((pointerY - box.top - box.height / 2) * 0.12, -4, 4);
      if (!springFrame) springFrame = requestAnimationFrame(stepSpring);
    }
  }

  listen(
    document,
    'pointermove',
    (event) => {
      if (!interactive() || event.pointerType === 'touch' || !(event.target instanceof Element))
        return;
      const nextLight = event.target.closest(lightSelector);
      const nextTilt = event.target.closest(tiltSelector);
      const nextMagnetic = event.target.closest('.button, .nav-cta');
      if (nextLight !== lightNode)
        clearProperties(lightNode, ['--light-x', '--light-y', '--light-opacity']);
      if (nextTilt !== tiltNode)
        clearProperties(tiltNode, ['--tilt-x', '--tilt-y', '--portrait-x']);
      if (nextMagnetic !== magneticNode) {
        clearProperties(magneticNode, ['--magnet-x', '--magnet-y']);
        cancelAnimationFrame(springFrame);
        springFrame = 0;
        lastTime = 0;
        Object.assign(spring, { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
      }
      lightNode = nextLight;
      tiltNode = nextTilt;
      magneticNode = nextMagnetic;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
    },
    { passive: true },
  );

  // Click works for mouse, touch and keyboard activation (keyboard ripples are centered).
  listen(document, 'click', (event) => {
    if (!allowed() || !(event.target instanceof Element)) return;
    const control = event.target.closest(controlSelector);
    if (!control || control.disabled || typeof control.animate !== 'function') return;
    control.dataset.liquidControl = '';
    const box = control.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'water-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.setProperty('--ripple-size', Math.hypot(box.width, box.height) * 2 + 'px');
    ripple.style.setProperty(
      '--ripple-x',
      (event.detail ? event.clientX - box.left : box.width / 2) + 'px',
    );
    ripple.style.setProperty(
      '--ripple-y',
      (event.detail ? event.clientY - box.top : box.height / 2) + 'px',
    );
    control.append(ripple);
    animate(
      ripple,
      [
        { transform: 'scale(0)', opacity: 0.9 },
        { transform: 'scale(1)', opacity: 0 },
      ],
      { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)' },
      () => ripple.remove(),
    );
  });

  function syncDock() {
    if (!dock) return;
    const current = dock.querySelector('a[aria-current="location"]');
    dock.classList.toggle('has-active', Boolean(current));
    if (!current) return;
    dock.style.setProperty('--dock-width', current.offsetWidth + 'px');
    dock.style.setProperty('--dock-x', current.offsetLeft + 'px');
  }
  const navObserver = new MutationObserver(syncDock);
  navObserver.observe(dock, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  observers.push(navObserver);
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(syncDock);
    resizeObserver.observe(dock);
    observers.push(resizeObserver);
  }

  function updateScroll() {
    scrollFrame = 0;
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    if (profile && interactive() && window.innerWidth > 700) {
      profile.style.setProperty('--parallax-y', Math.min(window.scrollY * 0.035, 18) + 'px');
    } else profile?.style.removeProperty('--parallax-y');
  }
  listen(
    window,
    'scroll',
    () => {
      resetPointer();
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
    },
    { passive: true },
  );
  listen(window, 'resize', () => {
    resetPointer();
    updateScroll();
    syncDock();
  });

  function syncMotion() {
    const enabled = allowed();
    toggle.hidden = false;
    toggle.disabled = reduced.matches;
    toggle.dataset.paused = String(!enabled);
    const label = reduced.matches
      ? 'Animations reduced by your device'
      : enabled
        ? 'Pause animations'
        : 'Resume animations';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    root.classList.toggle('page-idle', document.hidden);
    ambient.forEach((node) => {
      const box = node.getBoundingClientRect();
      node.classList.toggle(
        'motion-active',
        enabled && !document.hidden && box.bottom > 0 && box.top < innerHeight,
      );
    });
    if (!enabled || document.hidden) {
      for (const [animation, cleanup] of animations) {
        animation.cancel();
        cleanup();
      }
      animations.clear();
      resetPointer();
      profile?.style.removeProperty('--parallax-y');
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    }
  }
  function toggleMotion() {
    if (reduced.matches) {
      showToast('Your device is set to reduce motion.');
      return;
    }
    root.dataset.motion = allowed() ? 'off' : 'on';
    try {
      localStorage.setItem('kirawnsan-motion', root.dataset.motion);
    } catch {
      /* Optional persistence. */
    }
    syncMotion();
    document.dispatchEvent(new CustomEvent('portfolio:motion-change'));
    showToast(allowed() ? 'Animations resumed.' : 'Animations paused.');
  }
  listen(toggle, 'click', toggleMotion);
  listen(reduced, 'change', () => {
    syncMotion();
    document.dispatchEvent(new CustomEvent('portfolio:motion-change'));
  });
  listen(pointer, 'change', resetPointer);
  listen(document, 'visibilitychange', syncMotion);
  listen(document, 'pointerleave', resetPointer);
  listen(document, 'keydown', (event) => {
    if (event.key === 'Tab') resetPointer();
  });
  listen(window, 'blur', resetPointer);

  if (window.scrollY < 80) {
    document
      .querySelectorAll('.hero-copy > *')
      .forEach((node, index) => enter(node, Math.min(index * 65, 450)));
  }
  if ('IntersectionObserver' in window) {
    const ambientObserver = new IntersectionObserver((entries) =>
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          'motion-active',
          entry.isIntersecting && allowed() && !document.hidden,
        );
      }),
    );
    ambient.forEach((node) => ambientObserver.observe(node));
    observers.push(ambientObserver);
    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const siblings = [...entry.target.parentElement.children];
          enter(entry.target, (siblings.indexOf(entry.target) % 4) * 60);
          revealObserver.unobserve(entry.target);
        }),
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(
        '.profile-card, .about-copy, .journey-card, .section-heading, .project-card, .tech-card, .strengths-grid, .contact-info, .contact-form',
      )
      .forEach((node) => revealObserver.observe(node));
    observers.push(revealObserver);
  }
  // One brief emphasis on the actual numeric project count; no invented statistics.
  const statistic = document.querySelector('.profile-facts strong');
  if (statistic)
    animate(
      statistic,
      [
        { opacity: 0.3, translate: '0 6px' },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: 900, delay: 500, easing: 'ease-out' },
    );
  if (typeof commands !== 'undefined')
    commands.push({
      label: 'Pause / resume animations',
      detail: 'Motion preference',
      keywords: 'pause resume animation motion accessibility',
      run: () => {
        document.querySelector('#command-dialog').close();
        toggleMotion();
      },
    });
  listen(window, 'pagehide', (event) => {
    resetPointer();
    cancelAnimationFrame(scrollFrame);
    for (const [animation, cleanup] of animations) {
      animation.cancel();
      cleanup();
    }
    animations.clear();
    if (!event.persisted) {
      observers.forEach((observer) => observer.disconnect());
      controller.abort();
    }
  });
  listen(window, 'pageshow', () => {
    syncMotion();
    syncDock();
    updateScroll();
  });
  syncMotion();
  syncDock();
  updateScroll();
})();
