'use strict';
const featureModel = window.PortfolioFeatureModel;
const projectKeys = Object.keys(projects);
const storageKey = 'kirawnsan-saved-projects-v1';
let savedProjects = new Set();
try {
  savedProjects = new Set(
    featureModel.normalizeSaved(JSON.parse(localStorage.getItem(storageKey) || '[]'), projectKeys),
  );
} catch (_) {}
let activeProjectKey = projectKeys[0];
let compareSelection = new Set(projectKeys);
let skillCategory = 'all';

function saveLocalShortlist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...savedProjects]));
    return true;
  } catch (_) {
    return false;
  }
}
function updateSaveButton(button, key) {
  const saved = savedProjects.has(key);
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute(
    'aria-label',
    `${saved ? 'Remove' : 'Save'} ${projects[key].title}${saved ? ' from shortlist' : ' to shortlist'}`,
  );
  if (button.id === 'modal-save-project') button.textContent = saved ? 'Saved ✓' : 'Save project';
  else $('span', button).textContent = saved ? 'Saved' : 'Save';
}
function renderShortlist() {
  $('#saved-count').textContent = savedProjects.size;
  $$('[data-save-project]').forEach((button) =>
    updateSaveButton(button, button.dataset.saveProject),
  );
  updateSaveButton($('#modal-save-project'), activeProjectKey);
  const list = $('#shortlist-content');
  list.replaceChildren();
  if (!savedProjects.size) {
    const empty = document.createElement('div');
    empty.className = 'shortlist-empty';
    const heading = document.createElement('h3');
    heading.textContent = 'Start with a project that interests you.';
    const copy = document.createElement('p');
    copy.textContent =
      'Use the Save button on any project card. Your shortlist will be here when you come back.';
    const button = document.createElement('button');
    button.className = 'button button-subtle';
    button.textContent = 'Explore projects ↗';
    button.addEventListener('click', () => {
      $('#shortlist-dialog').close();
      jumpTo('#work');
    });
    empty.append(heading, copy, button);
    list.appendChild(empty);
  }
  for (const key of savedProjects) {
    const project = projects[key];
    const row = document.createElement('article');
    row.className = 'shortlist-item';
    const copy = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = project.title;
    const stack = document.createElement('p');
    stack.textContent = project.stack.join(' · ');
    copy.append(title, stack);
    const actions = document.createElement('div');
    const view = document.createElement('button');
    view.className = 'text-link';
    view.textContent = 'View ↗';
    view.addEventListener('click', () => openProject(key));
    const remove = document.createElement('button');
    remove.className = 'shortlist-remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${project.title} from shortlist`);
    remove.addEventListener('click', () => {
      const restoreFocus = document.activeElement === remove;
      toggleSavedProject(key);
      if (restoreFocus)
        (
          $('.shortlist-remove') ||
          $('#shortlist-content button') ||
          $('#shortlist-dialog .close-dialog')
        ).focus();
    });
    actions.append(view, remove);
    row.append(copy, actions);
    list.appendChild(row);
  }
  $('#clear-shortlist').disabled = !savedProjects.size;
  $('.compare-saved-trigger').disabled = savedProjects.size < 2;
}
function toggleSavedProject(key) {
  if (!projectKeys.includes(key)) return;
  savedProjects.has(key) ? savedProjects.delete(key) : savedProjects.add(key);
  const persistent = saveLocalShortlist();
  renderShortlist();
  showToast(
    (savedProjects.has(key) ? 'Project saved' : 'Project removed') +
      (persistent ? '.' : ' for this visit. Browser storage is unavailable.'),
  );
}
$$('[data-save-project]').forEach((button) =>
  button.addEventListener('click', () => toggleSavedProject(button.dataset.saveProject)),
);
$('#modal-save-project').addEventListener('click', () => toggleSavedProject(activeProjectKey));
// Keep the save action synchronized with the existing project dialog.
document.addEventListener('portfolio:project-opened', (event) => {
  if (!projectKeys.includes(event.detail?.key)) return;
  activeProjectKey = event.detail.key;
  updateSaveButton($('#modal-save-project'), activeProjectKey);
});
$$('.shortlist-trigger').forEach((button) =>
  button.addEventListener('click', () => {
    renderShortlist();
    openDialog('#shortlist-dialog');
  }),
);
$('#clear-shortlist').addEventListener('click', () => {
  const restoreFocus = document.activeElement === $('#clear-shortlist');
  savedProjects.clear();
  saveLocalShortlist();
  renderShortlist();
  if (restoreFocus) $('#shortlist-content button').focus();
  showToast('Project shortlist cleared.');
});
window.addEventListener('storage', (event) => {
  if (event.storageArea && event.storageArea !== localStorage) return;
  if (event.key !== storageKey && event.key !== null) return;
  try {
    savedProjects = new Set(
      featureModel.normalizeSaved(
        JSON.parse(event.key === null ? '[]' : event.newValue || '[]'),
        projectKeys,
      ),
    );
  } catch (_) {
    savedProjects = new Set();
  }
  renderShortlist();
});
renderShortlist();

function renderComparison() {
  $$('[data-compare-project]').forEach((button) =>
    button.setAttribute(
      'aria-pressed',
      String(compareSelection.has(button.dataset.compareProject)),
    ),
  );
  const keys = projectKeys.filter((key) => compareSelection.has(key));
  const wrapper = document.createElement('div');
  wrapper.className = 'comparison-scroll';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute(
    'aria-label',
    'Project comparison table; scroll horizontally on small screens',
  );
  const table = document.createElement('table');
  table.className = 'comparison-table';
  const caption = document.createElement('caption');
  caption.textContent = 'Project purpose, technologies, and features';
  table.appendChild(caption);
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const first = document.createElement('th');
  first.scope = 'col';
  first.textContent = 'At a glance';
  headerRow.appendChild(first);
  for (const key of keys) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = projects[key].title;
    headerRow.appendChild(th);
  }
  head.appendChild(headerRow);
  table.appendChild(head);
  const body = document.createElement('tbody');
  const rows = [
    ['Purpose', (key) => projects[key].description],
    ['Technology stack', (key) => projects[key].stack.join(' · ')],
    ['Features', (key) => projects[key].features],
    ['More detail', (key) => key],
  ];
  for (const [label, value] of rows) {
    const tr = document.createElement('tr');
    const title = document.createElement('th');
    title.scope = 'row';
    title.textContent = label;
    tr.appendChild(title);
    for (const key of keys) {
      const td = document.createElement('td');
      const content = value(key);
      if (label === 'More detail') {
        const button = document.createElement('button');
        button.className = 'text-link';
        button.textContent = 'Explore project ↗';
        button.addEventListener('click', () => openProject(key));
        td.appendChild(button);
      } else if (Array.isArray(content)) {
        const ul = document.createElement('ul');
        for (const item of content) {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        }
        td.appendChild(ul);
      } else td.textContent = content;
      tr.appendChild(td);
    }
    body.appendChild(tr);
  }
  table.appendChild(body);
  wrapper.appendChild(table);
  $('#comparison-content').replaceChildren(wrapper);
}
function openComparison(keys = projectKeys) {
  compareSelection = new Set(featureModel.normalizeComparison(keys, projectKeys));
  renderComparison();
  openDialog('#compare-dialog');
}
$$('.compare-trigger').forEach((button) =>
  button.addEventListener('click', () => openComparison()),
);
$('.compare-saved-trigger').addEventListener('click', () => openComparison([...savedProjects]));
$$('[data-compare-project]').forEach((button) =>
  button.addEventListener('click', () => {
    const key = button.dataset.compareProject;
    if (compareSelection.has(key) && compareSelection.size === 2) {
      showToast('Keep at least two projects selected to compare.');
      return;
    }
    compareSelection.has(key) ? compareSelection.delete(key) : compareSelection.add(key);
    renderComparison();
  }),
);

function filterSkills() {
  const query = $('#skill-search').value;
  let count = 0;
  $$('[data-skill-category]').forEach((card) => {
    const skill = {
      label: card.lastElementChild.textContent,
      keywords: card.dataset.skillKeywords,
      category: card.dataset.skillCategory,
    };
    card.hidden = !featureModel.matchesSkill(skill, query, skillCategory);
    if (!card.hidden) count++;
  });
  $$('.skills-section .tech-grid').forEach(
    (grid) => (grid.hidden = !$$('[data-skill-category]', grid).some((card) => !card.hidden)),
  );
  $('.skills-subheading').hidden = $('.data-grid').hidden;
  $('#skill-results-count').textContent =
    `${count} ${count === 1 ? 'skill' : 'skills'}${query.trim() ? ' matching your search' : ''}`;
  $('#skill-empty').hidden = count !== 0;
}
$('#skill-search').addEventListener('input', filterSkills);
$$('[data-skill-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    skillCategory = button.dataset.skillFilter;
    $$('[data-skill-filter]').forEach((other) =>
      other.setAttribute('aria-pressed', String(other === button)),
    );
    filterSkills();
  }),
);
filterSkills();

const configuredPortfolioUrl = $('link[rel="canonical"]').href.replace(/\/$/, '');
const portfolioUrl =
  window.location.protocol === 'file:'
    ? configuredPortfolioUrl
    : new URL('./', window.location.href).href.replace(/\/$/, '');
const canonicalUrl = portfolioUrl + '/';
$('link[rel="canonical"]').href = canonicalUrl;
$('meta[property="og:url"]').content = canonicalUrl;
const personMetadata = $('script[type="application/ld+json"]');
try {
  const data = JSON.parse(personMetadata.textContent);
  data.url = canonicalUrl;
  personMetadata.textContent = JSON.stringify(data);
} catch (_) {}
// Generate a contact card with this deployment's public URL.
const contactText = window.PortfolioContactTemplate.replace(
  /^URL:[^\r\n]*/m,
  'URL:' + portfolioUrl,
);
const contactDownload = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(contactText);
$$('a[download="Kirawnsan-Contact.vcf"]').forEach((link) => {
  link.href = contactDownload;
});

const profileSummary =
  'Kirawnsan Pathmanathan — software engineering student based in Batticaloa, Sri Lanka, seeking a software development internship. Pursuing an HND in Computer Software Engineering at ESOFT Metro Campus (2025–2027). Projects include a React/Node.js/MongoDB e-commerce platform, a C#/.NET/SQL Server pre-booking application, and a React/Node.js/MySQL food ordering system. Background in civil drafting and CAD, with Merit and an NVQ Level 4 draughtsperson qualification. Languages: Tamil and English. Email: kirawnsan2002@gmail.com. Portfolio: ' +
  portfolioUrl;
async function copyText(text, success, fallbackField) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(success);
  } catch (_) {
    if (fallbackField) {
      fallbackField.focus();
      fallbackField.select();
      showToast('Copy the selected link using Ctrl/Cmd+C.');
    } else {
      showToast(
        'Copy is unavailable in this browser. The same details are in the downloadable CV.',
      );
    }
  }
}
$$('.recruiter-trigger').forEach((button) =>
  button.addEventListener('click', () => openDialog('#recruiter-dialog')),
);
$('#copy-profile').addEventListener('click', () =>
  copyText(profileSummary, 'Profile summary copied.'),
);

$('#share-url').value = portfolioUrl;
function openSharing() {
  openDialog('#share-dialog');
}
$$('.share-trigger').forEach((button) => button.addEventListener('click', openSharing));
$('#copy-portfolio-link').addEventListener('click', () =>
  copyText(portfolioUrl, 'Portfolio link copied.', $('#share-url')),
);
$('#native-share').addEventListener('click', async () => {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Kirawnsan Pathmanathan — Digital Portfolio',
        text: 'Explore Kirawnsan’s software projects and developer journey.',
        url: portfolioUrl,
      });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  await copyText(portfolioUrl, 'Portfolio link copied.', $('#share-url'));
});
// Extend the existing keyboard launcher with the new visitor actions.
commands.push(
  {
    label: 'Recruiter brief',
    detail: 'At a glance',
    keywords: 'recruiter hiring internship summary profile',
    run: () => openDialog('#recruiter-dialog'),
  },
  {
    label: 'Saved projects',
    detail: 'Shortlist',
    keywords: 'saved bookmark favourites favorites shortlist',
    run: () => {
      renderShortlist();
      openDialog('#shortlist-dialog');
    },
  },
  {
    label: 'Compare projects',
    detail: 'Side by side',
    keywords: 'compare project stack features technologies',
    run: () => openComparison(),
  },
  {
    label: 'Share portfolio',
    detail: 'Share',
    keywords: 'share copy link portfolio',
    run: openSharing,
  },
  {
    label: 'Download contact card',
    detail: 'Contact',
    keywords: 'contact vcard phone email save download',
    run: () => {
      $('#command-dialog').close();
      downloadFile('a[download=\"Kirawnsan-Contact.vcf\"]', 'Kirawnsan-Contact.vcf');
    },
  },
);
