# Kirawnsan Portfolio

A static portfolio built with HTML, CSS, and vanilla JavaScript. It runs on GitHub Pages without a build step or runtime dependencies.

## GitHub upload package

Start with [GITHUB-UPLOAD.md](GITHUB-UPLOAD.md) for step-by-step browser upload instructions. Extract the ZIP before uploading; `index.html` must appear at the top level of the repository. All original website assets and development files are included.

## Project structure

```text
index.html                 Page content, accessible markup, and metadata
assets/
  css/                     Base styles, layout, icons, motion, button effects
  js/                      Theme, shared helpers, interactions, and contact data
  images/                  Portrait, hero illustration, and favicon
  fonts/                   Original bundled font assets
  downloads/               Résumé PDF and fallback contact card
docs/
  MAINTENANCE.md            Editing guide and script dependencies
licenses/                  Bundled font attribution
tests/                     Asset validation and DOM interaction checks
package.json               Optional development commands
```

## Preview locally

From this folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`. No npm installation is needed to view the website.

## Publish to GitHub Pages

1. Extract this archive.
2. Copy **all extracted files and folders** into the root of your website repository. Keep `index.html` and `assets/` beside each other. Do not upload the ZIP itself or just `index.html`.
3. Commit the changes to the branch used by GitHub Pages.
4. In the repository's Pages settings, deploy from that branch and the root folder.
5. Open the URL shown in Pages settings after deployment completes.

The default public address is `https://crownkvn.github.io/Portfolio-Site/`. Relative asset paths support other repository names. Sharing, contact-card links, and runtime metadata follow the deployed page address. This archive does not publish itself to GitHub.

## Development

With Node.js 18 or newer, run `npm ci` once, then:

- `npm test` — check asset references, syntax, metadata, accessibility references, and DOM interactions.
- `npm run format:check` — check formatting.
- `npm run format` — format the source files.

The development tools are not needed by the published website. Do not commit `node_modules/`.

## Typography

The original typography is preserved: bundled Nimbus Sans for regular text and DejaVu Sans Mono (the Code font family) for monospace elements. All existing font sizes are retained. Font assets and attribution are included.

## Verification scope

Automated checks cover source syntax, local asset references, navigation, filtering, dialogs, keyboard focus, saved projects, sharing, downloads, and preference/storage fallbacks. DOM tests simulate browser APIs; they do not verify visual rendering. Review desktop and mobile appearance in a browser before publishing.

## Navigation icons

The desktop and mobile menus use graduation-cap (About), briefcase (Work), code (Skills), and envelope (Contact) icons, with a rounded active-section highlight matching the supplied reference. Styling is in `assets/css/navigation.css`. Existing font families, font sizes, content, and links are preserved.

## Quality and animation update

The interface now includes a sliding active-navigation pill, magnetic primary buttons, keyboard/touch ripples, cursor-following card reflections, gentle skill-card tilt, and animated dialog/mobile-menu entrances. Use the navigation pause control to stop motion; device reduced-motion preferences are respected automatically. Styling lives in `assets/css/quality.css`; `assets/js/motion.js` coordinates animation lifecycles and cleans up listeners and observers on page exit. Original fonts, sizes, content, and downloads are retained.

Validated with 24 DOM interaction checks and browser checks at 320, 390, 768, 901, 1024, and 1440 pixels. Browser checks covered navigation fit, page overflow, ripples and cleanup, pause controls, reduced motion, and runtime errors.
