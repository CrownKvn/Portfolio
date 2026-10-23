'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function motionEnabled() {
  return !reducedMotion.matches && document.documentElement.dataset.motion !== 'off';
}
const projects = {
  commerce: {
    title: 'Clothing E-Commerce Platform',
    category: '01 / FULL-STACK COMMERCE',
    description:
      'An e-commerce web application bringing product discovery, shopping, and checkout into one experience.',
    stack: ['React', 'Node.js', 'MongoDB'],
    features: [
      'Product management for maintaining the clothing catalogue.',
      'A shopping cart to collect and manage selected products.',
      'Payment integration as part of the purchase flow.',
    ],
  },
  booking: {
    title: '.NET Pre-Booking Application',
    category: '02 / BOOKING & MANAGEMENT',
    description:
      'A pre-booking system combining user access, booking management, and administration in a C# / .NET application.',
    stack: ['C#', '.NET', 'SQL Server'],
    features: [
      'User authentication for accessing the application.',
      'Booking management to organize reservations.',
      'An admin panel for managing application operations.',
    ],
  },
  food: {
    title: 'Food Ordering System',
    category: '03 / FOOD & ORDERING',
    description:
      'A food ordering web application built around menus, shopping carts, and following an order’s progress.',
    stack: ['React', 'Node.js', 'MySQL'],
    features: [
      'Menu management for organizing available food options.',
      'Cart functionality for collecting food selections.',
      'Order tracking to follow the ordering process.',
    ],
  },
};
const answers = {
  intro:
    'I’m Kirawnsan Pathmanathan, based in Batticaloa, Sri Lanka. I’m currently studying for an HND in Computer Software Engineering at ESOFT Metro Campus, with a strong interest in full-stack development. I speak Tamil and English.',
  stack:
    'My projects use React, Node.js, MongoDB, C# / .NET, SQL Server, and MySQL. My broader toolkit also includes JavaScript, Python, Java, PHP, Power BI, IBM SPSS, Excel, and CAD/CADD.',
  opportunity:
    'I’m seeking a software development internship where I can gain practical industry experience, apply what I’m learning, and contribute to real projects alongside a team.',
  background:
    'My civil drafting studies involved technical drawings, construction plans, surveying, and quantity work. That foundation shaped my attention to detail and problem-solving approach — qualities I now bring to software development.',
};
let toastTimer;
function showToast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3500);
}
let dialogReturnTarget = null,
  switchingDialog = false;
function openDialog(id) {
  const target = $(id);
  if (!target || target.open) return;
  if (!$('dialog[open]')) dialogReturnTarget = document.activeElement;
  switchingDialog = true;
  try {
    $$('dialog[open]').forEach((dialog) => dialog.close());
    target.showModal();
    document.body.classList.add('modal-open');
  } finally {
    switchingDialog = false;
  }
}
$$('dialog').forEach((dialog) => {
  $('.close-dialog', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (switchingDialog || $('dialog[open]')) return;
    document.body.classList.remove('modal-open');
    const returnTarget = dialogReturnTarget;
    dialogReturnTarget = null;
    if (returnTarget?.isConnected && !returnTarget.closest('dialog'))
      returnTarget.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (event) => {
    const r = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom)
    )
      dialog.close();
  });
});
function syncThemeButton() {
  const light = document.documentElement.dataset.theme === 'light';
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
  $('meta[name="theme-color"]').content = light ? '#f7f3fc' : '#0c0e1c';
}
let themeTransitionRunning = false;
function toggleTheme() {
  if (themeTransitionRunning) return;
  const apply = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('kirawnsan-theme', next);
    } catch (_) {}
    syncThemeButton();
  };
  if (typeof document.startViewTransition === 'function' && motionEnabled()) {
    themeTransitionRunning = true;
    try {
      document
        .startViewTransition(apply)
        .finished.catch(() => {})
        .finally(() => {
          themeTransitionRunning = false;
        });
    } catch (_) {
      themeTransitionRunning = false;
      apply();
    }
  } else apply();
}
$('#theme-toggle').addEventListener('click', toggleTheme);
syncThemeButton();
const menuToggle = $('#menu-toggle');
function closeMenu(restoreFocus = false) {
  const wasOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  $('#mobile-nav').hidden = true;
  if (restoreFocus === true && wasOpen) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  $('#mobile-nav').hidden = !open;
});
$$('#mobile-nav a').forEach((link) => link.addEventListener('click', closeMenu));
window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeMenu();
});
$$('.filter').forEach((button) =>
  button.addEventListener('click', () => {
    $$('.filter').forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle('active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    let count = 0;
    $$('.project-card').forEach((card) => {
      card.hidden =
        button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    $('#work-count').textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
  }),
);
function openProject(key) {
  const project = projects[key];
  if (!project) return;
  $('#project-dialog-title').textContent = project.title;
  $('#project-dialog-eyebrow').textContent = project.category;
  $('#project-dialog-description').textContent = project.description;
  $('#project-dialog-tags').replaceChildren(
    ...project.stack.map((label) => {
      const span = document.createElement('span');
      span.textContent = label;
      return span;
    }),
  );
  $('#project-dialog-features').replaceChildren(
    ...project.features.map((label) => {
      const item = document.createElement('li');
      item.textContent = label;
      return item;
    }),
  );
  $('#project-enquiry').href =
    `mailto:kirawnsan2002@gmail.com?subject=${encodeURIComponent('About your ' + project.title)}`;
  openDialog('#project-dialog');
  document.dispatchEvent(new CustomEvent('portfolio:project-opened', { detail: { key } }));
}
$$('[data-project]').forEach((button) =>
  button.addEventListener('click', () => openProject(button.dataset.project)),
);
function chooseAnswer(key) {
  $('#answer-content').textContent = answers[key];
  $$('[data-answer]').forEach((button) =>
    button.setAttribute('aria-pressed', String(button.dataset.answer === key)),
  );
}
$$('[data-answer]').forEach((button) =>
  button.addEventListener('click', () => chooseAnswer(button.dataset.answer)),
);
$$('.quick-answers-trigger').forEach((button) =>
  button.addEventListener('click', () => {
    chooseAnswer('intro');
    openDialog('#answers-dialog');
  }),
);
$('.copy-email').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('kirawnsan2002@gmail.com');
    showToast('Email address copied. Let’s talk!');
  } catch (_) {
    showToast('Email: kirawnsan2002@gmail.com');
  }
});
$('#contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const name = form.elements.name.value.trim(),
    email = form.elements.email.value.trim(),
    message = form.elements.message.value.trim();
  if (!name || !message) {
    showToast('Please add your name and a message.');
    return;
  }
  const subject = `Portfolio enquiry — ${name}`;
  const body = `Hi Kirawnsan,\n\n${message}\n\nBest,\n${name}\n${email}`;
  window.location.href = `mailto:kirawnsan2002@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  showToast('Your email app will open with the draft.');
});
function jumpTo(id) {
  dialogReturnTarget = null;
  $('#command-dialog').close();
  closeMenu();
  const target = $(id);
  target.scrollIntoView({ behavior: motionEnabled() ? 'smooth' : 'auto' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}
function downloadFile(selector, filename) {
  const source = $(selector);
  if (!source) return;
  const link = document.createElement('a');
  link.href = source.href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
const commands = [
  {
    label: 'Selected work',
    detail: 'Section',
    keywords: 'projects portfolio work',
    run: () => jumpTo('#work'),
  },
  {
    label: 'About me',
    detail: 'Section',
    keywords: 'about bio person',
    run: () => jumpTo('#about'),
  },
  {
    label: 'My toolkit',
    detail: 'Section',
    keywords: 'skills technologies stack tools',
    run: () => jumpTo('#skills'),
  },
  {
    label: 'Education & journey',
    detail: 'Section',
    keywords: 'education esoft diploma certificate journey experience',
    run: () => jumpTo('#journey'),
  },
  {
    label: 'Get in touch',
    detail: 'Section',
    keywords: 'contact email internship hire',
    run: () => jumpTo('#contact'),
  },
  {
    label: 'Clothing E-Commerce Platform',
    detail: 'Project',
    keywords: 'react node mongodb shopping cart web',
    run: () => openProject('commerce'),
  },
  {
    label: '.NET Pre-Booking Application',
    detail: 'Project',
    keywords: 'dotnet c# sql booking admin',
    run: () => openProject('booking'),
  },
  {
    label: 'Food Ordering System',
    detail: 'Project',
    keywords: 'food react node mysql menu web',
    run: () => openProject('food'),
  },
  {
    label: 'Download résumé',
    detail: 'PDF',
    keywords: 'resume cv download',
    run: () => {
      $('#command-dialog').close();
      downloadFile('a[download=\"Kirawnsan-Resume.pdf\"]', 'Kirawnsan-Resume.pdf');
    },
  },
  {
    label: 'Switch color theme',
    detail: 'Appearance',
    keywords: 'dark light mode theme',
    run: () => {
      toggleTheme();
      $('#command-dialog').close();
    },
  },
  {
    label: 'Quick introduction',
    detail: 'About me',
    keywords: 'questions answers intro',
    run: () => {
      chooseAnswer('intro');
      openDialog('#answers-dialog');
    },
  },
];
let selectedCommand = 0,
  filteredCommands = commands;
function highlightCommand(index) {
  const rows = $$('.command-result');
  if (!rows.length) return;
  selectedCommand = (index + rows.length) % rows.length;
  rows.forEach((row, i) => row.classList.toggle('selected', i === selectedCommand));
}
function renderCommands() {
  const query = $('#command-input')
    .value.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  filteredCommands = commands.filter((command) =>
    `${command.label} ${command.keywords || ''}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(query),
  );
  selectedCommand = 0;
  const container = $('#command-results');
  container.replaceChildren();
  if (!filteredCommands.length) {
    const p = document.createElement('p');
    p.className = 'no-results';
    p.textContent = 'No matches. Try “React”, “CV”, or “contact”.';
    container.appendChild(p);
    return;
  }
  filteredCommands.forEach((command, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'command-result';
    const label = document.createElement('span');
    label.textContent = command.label;
    const detail = document.createElement('small');
    detail.textContent = command.detail + ' ↗';
    button.append(label, detail);
    button.addEventListener('click', command.run);
    button.addEventListener('focus', () => highlightCommand(i));
    container.appendChild(button);
  });
  highlightCommand(0);
}
function openCommands() {
  closeMenu();
  $('#command-input').value = '';
  renderCommands();
  openDialog('#command-dialog');
  $('#command-input').focus();
}
$('.command-trigger').addEventListener('click', openCommands);
$('#command-input').addEventListener('input', renderCommands);
$('#command-dialog').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    highlightCommand(selectedCommand + (event.key === 'ArrowDown' ? 1 : -1));
    const target = $$('.command-result')[selectedCommand];
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
      if (event.target !== $('#command-input')) target.focus({ preventScroll: true });
    }
  }
  if (
    event.key === 'Enter' &&
    event.target === $('#command-input') &&
    filteredCommands[selectedCommand]
  ) {
    event.preventDefault();
    filteredCommands[selectedCommand].run();
  }
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    $('#command-dialog').open ? $('#command-dialog').close() : openCommands();
  }
  if (event.key === 'Escape') closeMenu(true);
});

function updateTime() {
  $('#local-time').textContent =
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()) + ' LOCAL TIME';
}
updateTime();
setInterval(updateTime, 60000);
$('#year').textContent = new Date().getFullYear();
let scrollQueued = false;
function updateProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  $('.scroll-progress').style.transform =
    `scaleX(${total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0})`;
  $('.back-to-top').classList.toggle('visible', window.scrollY > 550);
  scrollQueued = false;
}
window.addEventListener(
  'scroll',
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateProgress);
    }
  },
  { passive: true },
);
window.addEventListener('resize', updateProgress);
updateProgress();

// Match the reference's animated introduction while respecting motion preferences.
const roleLabels = [
  'Aspiring Full-Stack Developer',
  'Software Engineering Student',
  'Creative Problem Solver',
];
let roleTimer,
  roleIndex = 0,
  roleLetters = roleLabels[0].length,
  deletingRole = true;
function typeRole() {
  if (!motionEnabled() || document.hidden) return;
  const role = roleLabels[roleIndex];
  roleLetters += deletingRole ? -1 : 1;
  $('#typed-role').textContent = role.slice(0, Math.max(0, roleLetters));
  let delay = deletingRole ? 38 : 65;
  if (roleLetters <= 0) {
    deletingRole = false;
    roleIndex = (roleIndex + 1) % roleLabels.length;
    delay = 300;
  } else if (roleLetters >= role.length) {
    deletingRole = true;
    delay = 2200;
  }
  roleTimer = setTimeout(typeRole, delay);
}
function restartRoles() {
  clearTimeout(roleTimer);
  roleIndex = 0;
  roleLetters = roleLabels[0].length;
  deletingRole = true;
  $('#typed-role').textContent = roleLabels[0];
  if (motionEnabled() && !document.hidden) roleTimer = setTimeout(typeRole, 2600);
}
reducedMotion.addEventListener('change', restartRoles);
document.addEventListener('portfolio:motion-change', restartRoles);
document.addEventListener('visibilitychange', restartRoles);
restartRoles();
// Keep the floating navigation aligned with the section currently in view.
if ('IntersectionObserver' in window) {
  const visibleSections = new Map();
  const navObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        visibleSections.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      const active = [...visibleSections]
        .filter(([, ratio]) => ratio > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      $$('.desktop-nav a, #mobile-nav a').forEach((link) => {
        const selected = link.hash === '#' + active;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-90px 0px -45% 0px', threshold: [0, 0.05, 0.2, 0.4, 0.6] },
  );
  ['home', 'about', 'work', 'skills', 'contact'].forEach((id) => navObserver.observe($('#' + id)));
}
