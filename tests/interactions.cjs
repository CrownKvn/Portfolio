const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');
const csstree = require('css-tree');
const projectRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
// Styles are parsed by validate.cjs; jsdom does not implement the full CSS used here.
const runtimeSource = source.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi, '');
class LocalAssets extends ResourceLoader {
  fetch(url) {
    const pathname = new URL(url).pathname;
    const assetStart = pathname.indexOf('/assets/');
    if (assetStart === -1) return null;
    const file = path.resolve(projectRoot, pathname.slice(assetStart + 1));
    if (!file.startsWith(projectRoot + path.sep)) return null;
    return Promise.resolve(fs.readFileSync(file));
  }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let checks = 0;
async function launch(url, { storageBlocked = false, reduce = false, noObserver = false } = {}) {
  const errors = [],
    copies = [],
    downloads = [],
    media = new Map(),
    observers = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(e));
  const dom = new JSDOM(runtimeSource, {
    url,
    resources: new LocalAssets(),
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = (query) => {
        if (!media.has(query)) {
          const m = new w.EventTarget();
          m.matches = query.includes('prefers-reduced-motion')
            ? reduce
            : query.includes('hover: hover');
          media.set(query, m);
        }
        return media.get(query);
      };
      w.HTMLElement.prototype.scrollIntoView = function (options) {
        this.scrollOptions = options;
      };
      w.HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
        this.querySelector('button')?.focus();
      };
      w.HTMLDialogElement.prototype.close = function () {
        if (!this.open) return;
        this.removeAttribute('open');
        w.setTimeout(() => this.dispatchEvent(new w.Event('close')), 0);
      };
      if (!noObserver)
        w.IntersectionObserver = class {
          constructor(callback, options) {
            this.callback = callback;
            this.options = options;
            this.nodes = [];
            observers.push(this);
          }
          observe(node) {
            assert(node);
            this.nodes.push(node);
          }
          unobserve() {}
        };
      Object.defineProperty(w.navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text) => {
            copies.push(text);
          },
        },
      });
      w.HTMLAnchorElement.prototype.click = function () {
        if (this.download) downloads.push({ href: this.href, filename: this.download });
        else this.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      };
      if (storageBlocked)
        Object.defineProperty(w, 'localStorage', {
          get() {
            throw new w.DOMException('Storage denied', 'SecurityError');
          },
        });
    },
  });
  await new Promise((resolve) => dom.window.addEventListener('load', resolve, { once: true }));
  await sleep(15);
  const w = dom.window,
    d = w.document,
    $ = (s) => d.querySelector(s),
    $$ = (s) => [...d.querySelectorAll(s)];
  const click = (el) => {
    el.focus();
    el.click();
  };
  const key = (el, value) =>
    el.dispatchEvent(
      new w.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
    );
  async function test(name, fn) {
    await fn();
    checks++;
    console.log('PASS', name);
  }
  return { dom, w, d, $, $$, click, key, errors, copies, downloads, media, observers, test };
}
(async () => {
  const env = await launch('https://crownkvn.github.io/Portfolio-Site/');
  const { dom, w, d, $, $$, click, key, errors, copies, downloads, media, observers, test } = env;
  try {
    await test('All six external scripts initialize without runtime errors', () => {
      assert.deepEqual(errors, []);
      assert.equal($('#skill-results-count').textContent, '14 skills');
    });
    await test('Menu opens, closes outside, and returns focus on Escape', () => {
      click($('#menu-toggle'));
      assert.equal($('#mobile-nav').hidden, false);
      $('#mobile-nav a').focus();
      key(d, 'Escape');
      assert.equal($('#mobile-nav').hidden, true);
      assert.equal(d.activeElement, $('#menu-toggle'));
      click($('#menu-toggle'));
      $('#skills').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      assert.equal($('#mobile-nav').hidden, true);
    });
    await test('Menu breakpoint matches the 900px layout', () => {
      click($('#menu-toggle'));
      const m = media.get('(min-width: 901px)');
      assert(m);
      m.matches = true;
      const e = new w.Event('change');
      e.matches = true;
      m.dispatchEvent(e);
      assert.equal($('#mobile-nav').hidden, true);
    });
    await test('Project filters update visibility and count', () => {
      click($('[data-filter=dotnet]'));
      assert.equal($('#work-count').textContent, '1 project');
      assert.equal($$('.project-card:not([hidden])').length, 1);
      click($('[data-filter=all]'));
    });
    await test('Project details show correct stack and save state', () => {
      click($('[data-project=booking]'));
      assert.equal($('#project-dialog-title').textContent, '.NET Pre-Booking Application');
      assert.equal($('#project-dialog-tags').textContent, 'C#.NETSQL Server');
      click($('#modal-save-project'));
      assert.equal($('#saved-count').textContent, '1');
      $('#project-dialog').close();
    });
    await sleep(5);
    await test('Dialog switches preserve the original return-focus target', async () => {
      const trigger = $('.shortlist-trigger');
      click(trigger);
      click($('#shortlist-content .text-link'));
      assert($('#project-dialog').open);
      $('#project-dialog').close();
      await sleep(5);
      assert.equal(d.activeElement, trigger);
    });
    await test('Removing the last saved item retains keyboard focus', () => {
      click($('.shortlist-trigger'));
      click($('.shortlist-remove'));
      assert.equal($('#saved-count').textContent, '0');
      assert.equal(d.activeElement, $('#shortlist-content button'));
    });
    await test('Clear shortlist moves focus away from its disabled button', () => {
      $('#shortlist-dialog').close();
      click($('[data-save-project=commerce]'));
      click($('.shortlist-trigger'));
      click($('#clear-shortlist'));
      assert.equal(d.activeElement, $('#shortlist-content button'));
      $('#shortlist-dialog').close();
    });
    await sleep(5);
    await test('Jumping from a dialog keeps focus in the chosen section', async () => {
      click($('.command-trigger'));
      $('#command-input').value = 'about';
      $('#command-input').dispatchEvent(new w.Event('input'));
      key($('#command-input'), 'Enter');
      await sleep(5);
      assert.equal(d.activeElement, $('#about'));
    });
    await test('Comparison retains at least two selected projects', () => {
      click($('.compare-trigger'));
      click($('[data-compare-project=commerce]'));
      assert.equal($$('.comparison-table thead th').length, 3);
      click($('[data-compare-project=booking]'));
      assert.equal($$('.comparison-table thead th').length, 3);
      $('#compare-dialog').close();
    });
    await test('SQL skill searches exclude NoSQL and empty state resets', () => {
      $('#skill-search').value = 'sql';
      $('#skill-search').dispatchEvent(new w.Event('input'));
      assert.equal($('#skill-results-count').textContent, '2 skills matching your search');
      $('#skill-search').value = 'unknown';
      $('#skill-search').dispatchEvent(new w.Event('input'));
      assert.equal($('#skill-empty').hidden, false);
      $('#skill-search').value = '';
      click($('[data-skill-filter=data]'));
      assert.equal($('#skill-results-count').textContent, '4 skills');
      click($('[data-skill-filter=all]'));
    });
    await test('Theme and motion preferences persist', () => {
      click($('#theme-toggle'));
      assert.equal(w.localStorage.getItem('kirawnsan-theme'), 'light');
      click($('#motion-toggle'));
      assert.equal(w.localStorage.getItem('kirawnsan-motion'), 'off');
      assert.equal($('#toast').textContent, 'Animations paused.');
      click($('#motion-toggle'));
    });
    await test('Storage corruption and clear events update the shortlist', () => {
      w.dispatchEvent(
        new w.StorageEvent('storage', {
          key: 'kirawnsan-saved-projects-v1',
          newValue: '["booking","bad","booking"]',
          storageArea: w.localStorage,
        }),
      );
      assert.equal($('#saved-count').textContent, '1');
      w.dispatchEvent(new w.StorageEvent('storage', { key: null, storageArea: w.localStorage }));
      assert.equal($('#saved-count').textContent, '0');
      w.dispatchEvent(
        new w.StorageEvent('storage', {
          key: 'kirawnsan-saved-projects-v1',
          newValue: '{bad}',
          storageArea: w.localStorage,
        }),
      );
      assert.equal($('#saved-count').textContent, '0');
    });
    await test('Share links and copied profile summaries follow the deployed address', async () => {
      click($('.share-trigger'));
      assert.equal($('#share-url').value, 'https://crownkvn.github.io/Portfolio-Site');
      click($('#copy-profile'));
      await sleep(0);
      assert(copies.at(-1).endsWith('https://crownkvn.github.io/Portfolio-Site'));
      $('#share-dialog').close();
    });
    await test('Canonical, Open Graph and profile metadata follow the deployed address', () => {
      assert.equal($('link[rel=canonical]').href, 'https://crownkvn.github.io/Portfolio-Site/');
      assert.equal(
        $('meta[property="og:url"]').content,
        'https://crownkvn.github.io/Portfolio-Site/',
      );
      assert.equal(
        JSON.parse($('script[type="application/ld+json"]').textContent).url,
        'https://crownkvn.github.io/Portfolio-Site/',
      );
    });
    await test('Contact card points to the deployed address', () => {
      const href = $('a[download="Kirawnsan-Contact.vcf"]').href;
      const encoded = href.split(',')[1];
      const data = href.startsWith('data:text/vcard;base64')
        ? Buffer.from(encoded, 'base64').toString()
        : decodeURIComponent(encoded);
      assert(data.includes('URL:https://crownkvn.github.io/Portfolio-Site'));
    });
    await test('Keyboard résumé and contact downloads match the visible download links', () => {
      click($('.command-trigger'));
      $('#command-input').value = 'Download résumé';
      $('#command-input').dispatchEvent(new w.Event('input'));
      key($('#command-input'), 'Enter');
      assert.equal(downloads.at(-1).filename, 'Kirawnsan-Resume.pdf');
      assert.equal(downloads.at(-1).href, $('a[download="Kirawnsan-Resume.pdf"]').href);
      click($('.command-trigger'));
      $('#command-input').value = 'Download contact card';
      $('#command-input').dispatchEvent(new w.Event('input'));
      key($('#command-input'), 'Enter');
      assert.equal(downloads.at(-1).filename, 'Kirawnsan-Contact.vcf');
      assert.equal(downloads.at(-1).href, $('a[download="Kirawnsan-Contact.vcf"]').href);
    });
    await test('Contact form rejects invalid and blank input', () => {
      const form = $('#contact-form');
      form.elements.name.value = 'Visitor';
      form.elements.email.value = 'not-an-email';
      form.elements.message.value = 'Hello';
      assert.equal(form.checkValidity(), false);
      form.elements.email.value = 'visitor@example.com';
      form.elements.message.value = ' ';
      form.dispatchEvent(new w.Event('submit', { cancelable: true }));
      assert.equal($('#toast').textContent, 'Please add your name and a message.');
    });
    await test('Current-section observer updates both navigation menus', () => {
      const observer = observers.find((o) => o.options?.rootMargin);
      assert(observer);
      observer.callback([{ target: $('#skills'), isIntersecting: true, intersectionRatio: 0.5 }]);
      assert.equal($('.desktop-nav a[href="#skills"]').getAttribute('aria-current'), 'location');
      assert.equal($('#mobile-nav a[href="#skills"]').getAttribute('aria-current'), 'location');
    });
    await test('No runtime exceptions were raised during all interactions', () =>
      assert.deepEqual(errors, []));
  } finally {
    dom.window.close();
  }
  for (const options of [{ storageBlocked: true }, { reduce: true }, { noObserver: true }]) {
    const env = await launch(
      'https://crownkvn.github.io/renamed-portfolio/index.html?ref=linkedin#skills',
      options,
    );
    try {
      await env.test('Initialization and sharing work under ' + JSON.stringify(options), () => {
        assert.deepEqual(env.errors, []);
        assert.equal(env.$('#share-url').value, 'https://crownkvn.github.io/renamed-portfolio');
        env.click(env.$('[data-save-project=food]'));
        assert.equal(env.$('#saved-count').textContent, '1');
        if (options.reduce) assert.equal(env.$('#motion-toggle').disabled, true);
      });
    } finally {
      env.dom.window.close();
    }
  }
  const local = await launch('file:///tmp/portfolio/index.html');
  try {
    await local.test('Local-file preview initializes and uses the configured public URL', () => {
      assert.deepEqual(local.errors, []);
      assert.equal(local.$('#share-url').value, 'https://crownkvn.github.io/Portfolio-Site');
    });
  } finally {
    local.dom.window.close();
  }
  console.log(`${checks} DOM runtime checks passed. These do not verify browser rendering.`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
