# BRIEF7: 体験のまとめに「次のステップ」を足す(設定で差し込める形)

Read BRIEF.md ... BRIEF6.md rules first (no network, no real brand names, example-only numbers, no income promises, file:// works, tests). Write only inside this repo. Do NOT read or execute anything under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. Do not git commit. Do NOT edit assets/js/products-data.js or assets/img.

The summary screen (assets/js/screens/welcome.js, route `summary`) ends with `<!-- CTA_PLACEHOLDER -->` (tests/workflow.test.js asserts it). Replace the placeholder with a small "次のステップ" card, driven by assets/js/config.js:

- Add to `DemoConfig`: `ctaUrl: ''` and `ctaLabel: '説明会の担当者に相談する'` and `ctaNote: 'このあとの流れや料金は、説明会の担当者がご案内します。'`.
- If `ctaUrl` is a non-empty string starting with `https://`: show the card with the note and ONE primary link button (`<a class="button" href=... target="_blank" rel="noopener noreferrer">` + label). Escape everything with D.esc. A non-https value (javascript:, http:, relative) must NOT render a link (treat as empty).
- If `ctaUrl` is empty/invalid: show the same card with the note only (no button, no empty link, no "準備中" wording).
- No prices, no income promises, no urgency/sales language, no real brand names. Same calm admin look as the other cards (reuse existing classes).
- Keep the card visible at all times on the summary (not only after completing steps), below the experience list. Keep the existing summary behaviour (未体験 lines are links; "ひと通り体験できました" state).
- Update tests: replace the old `endsWith('<!-- CTA_PLACEHOLDER -->')` assertion with checks for: card present with note; empty ctaUrl => no extra `<a ` beyond the 未体験 links; https ctaUrl => link with rel noopener noreferrer and target _blank; javascript:/http: ctaUrl => no link; label/URL are HTML-escaped (test with `"><script>`). Existing count assertion `○ 未体験 count == <a href= count` must still hold when ctaUrl is empty (adjust the test to count only the 未体験 links if needed).
- Run `node --check` on JS and every `node tests/*.test.js`; all must pass. Update README (a short "次のステップの差し込み方": edit config.js ctaUrl). Short report (3 lines), say what you could not verify (no browser).
