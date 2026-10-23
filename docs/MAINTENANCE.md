# Maintenance guide

## Where to edit

| Change                                        | File                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| Biography, headings, links, section markup    | `index.html`                                                              |
| Colors, typography, component styling         | `assets/css/base.css`                                                     |
| Responsive page geometry                      | `assets/css/layout.css`                                                   |
| Technology tile appearance                    | `assets/css/icons.css`                                                    |
| Hire Me running border                        | `assets/css/hire-button.css`                                              |
| Animation appearance and behavior             | `assets/css/motion.css`, `assets/js/motion.js`                            |
| Project details and quick answers             | `assets/js/app.js`                                                        |
| Filters, shortlist, sharing, comparison       | `assets/js/features.js`                                                   |
| Pure matching and saved-project normalization | `assets/js/feature-model.js`                                              |
| Contact download details                      | `assets/js/contact-template.js`, `assets/downloads/Kirawnsan-Contact.vcf` |
| Résumé                                        | `assets/downloads/Kirawnsan-Resume.pdf`                                   |

## Loading order

`theme.js` runs in the head before the page is displayed so stored preferences can be applied early. At the end of the body, scripts run in this order:

1. `feature-model.js` exposes pure filtering helpers.
2. `app.js` defines shared selectors, project data, dialogs, and core controls.
3. `contact-template.js` provides the readable vCard template.
4. `features.js` uses those helpers and data for enhanced interactions.
5. `motion.js` adds optional animation behavior.

These are classic scripts with shared bindings. Keep the order and do not add `async`. The page works as a static project without a bundler or framework.

Styles load in their existing cascade order: base, motion, layout, icons, then Hire Me. `no-script.css` loads only inside `<noscript>` to hide unavailable interactive controls when JavaScript is disabled. Later files intentionally refine earlier rules.

## Working conventions

- Use two-space indentation and run the formatter before committing.
- Keep reusable behavior in named functions and group related interactions in the existing files.
- Keep binary assets in their dedicated folders instead of embedding base64 in HTML or CSS.
- Keep asset paths relative so GitHub project URLs work correctly.
- Keep meaningful HTML IDs stable; scripts and accessible labels depend on them.
- Preserve reduced-motion support, keyboard focus handling, and storage error fallbacks.
- Update both contact sources when changing personal details. JavaScript regenerates the download with the deployed website URL; the `.vcf` file is the no-JavaScript fallback.
- If changing the default domain, also update static canonical/Open Graph/profile metadata in `index.html` and the contact sources.

## Release check

Run `npm test` and `npm run format:check`. Preview on desktop and mobile, then upload the full folder contents. There is no generated `dist/` directory: the root HTML and `assets/` are the deployable source.

## Interaction polish

`assets/css/quality.css` loads after navigation styling and owns the latest visual polish without overriding typography. `motion.js` owns the moving dock indicator, ripple cleanup, pointer lighting, spring-based button movement, and progressive reveals. Pointer effects are limited to fine pointers and are stopped when the page is hidden or motion is paused. Menu and dialog entrances follow the same motion controls.
