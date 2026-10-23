const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const css = require('css-tree');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const document = new JSDOM(html).window.document;

function checkReference(reference, directory = root) {
  if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) return;
  if (reference.startsWith('#')) {
    assert(document.getElementById(reference.slice(1)), `Missing anchor: ${reference}`);
    return;
  }
  const file = path.resolve(directory, reference.split(/[?#]/)[0]);
  assert(file.startsWith(root + path.sep), `Asset outside project: ${reference}`);
  assert(fs.statSync(file).isFile(), `Missing asset: ${reference}`);
}

for (const element of document.querySelectorAll('[src], [href]')) {
  checkReference(element.getAttribute('src') || element.getAttribute('href'));
}
const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
for (const element of document.querySelectorAll(
  '[aria-labelledby], [aria-describedby], [aria-controls]',
)) {
  for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const id of (element.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) {
      assert(document.getElementById(id), `Missing ARIA target: ${id}`);
    }
  }
}
for (const file of fs.readdirSync(path.join(root, 'assets/css'))) {
  const directory = path.join(root, 'assets/css');
  const errors = [];
  const tree = css.parse(fs.readFileSync(path.join(directory, file), 'utf8'), {
    onParseError: (error) => errors.push(error.message),
  });
  assert.deepEqual(errors, [], `Invalid stylesheet: ${file}`);
  css.walk(tree, {
    visit: 'Url',
    enter(node) {
      checkReference(node.value, directory);
    },
  });
}
for (const file of fs.readdirSync(path.join(root, 'assets/js'))) {
  new vm.Script(fs.readFileSync(path.join(root, 'assets/js', file), 'utf8'), { filename: file });
}
JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
assert(!html.includes(';base64,'), 'Binary assets should be separate files');
console.log('PASS asset paths, anchors, unique IDs, ARIA targets, CSS, JavaScript, and metadata');
