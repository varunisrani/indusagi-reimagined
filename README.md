# IndusAGI

A redesigned IndusAGI website with an original developer-focused interface and documentation preserved from https://www.indusagi.com/.

The homepage includes product and package-manager installation controls, copy actions, live npm download counts, architecture layers, edition navigation, and the original FAQ content. Documentation pages include edition switching, title search, table-of-contents links, and previous/next navigation.

The interface supports desktop and mobile layouts, light and dark themes, keyboard navigation, and reduced motion.

Article content is stored in `app/data/documents.json`; homepage FAQs are stored in `app/data/faq.json`. Content was captured from the public website during this redesign. Statements in that source are retained, including the differing npm package names in the installer and one FAQ answer.

This project uses the Sites Vinext runtime and its existing package scripts. It is a separate redesign; the original indusagi.com deployment is not modified.

The hero now includes a CSS 3D architecture explorer with layer selection, expand/assemble controls, pointer tilt, and a motion toggle. Animation pauses out of view, in hidden tabs, and for reduced-motion preferences. It adds no rendering dependency or texture downloads.

Static page content renders on the server. Shared navigation persists across client transitions. Documentation search is isolated from article rendering, and the original content is loaded through independent per-route imports. Run `node scripts/split-documents.mjs` after manually updating `app/data/documents.json`; the content importer also does this automatically. Npm counts load near the viewport and are cached for fifteen minutes.

The September refresh takes layout inspiration from Mastra: a spacious near-black canvas, pill controls, a floating 3D hero, and tabbed capability panels. The identity and content remain IndusAGI. The five code examples are excerpts from the preserved documentation, with working copy controls and deep links. No additional dependencies were introduced.

Benchmark results supplied by the owner on 11 September 2026 are displayed in a homepage announcement and a dedicated section. Headline accuracy uses all 445 trials per implementation, counting errors as unsuccessful. All campaign model IDs, reasoning settings, errors, costs, dates, and supplied Harbor links are retained. The scored-only Python metric is secondary. The incomplete Rust GPT-6 Astra campaign (87/445 attempts) is explicitly excluded. Harbor job pages were not independently accessible during implementation; the supplied figures are the source.

The white theme uses a true white canvas, neutral panels, readable orange accents, and a monochrome logo. Saved theme preference is applied before content paints. Browser checks covered switching both ways, reload persistence, white documentation and dropdown menus, architecture tabs, hero layer selection, and the motion pause control. The two legacy benchmark FAQ answers now reflect the owner-supplied completed campaign results.
