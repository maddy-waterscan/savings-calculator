# Waterscan Savings Calculator - Starter
Edit in VS Code. Open `index.html` with Live Server to preview.

## Files
- `index.html` - markup and includes
- `waterscan.css` - styles
- `waterscan.js` - logic

## Embed in WordPress quickly
Option A - Custom HTML block
1. Open `index.html` and copy the inner `<div id="waterscan-calculator" ...>...</div>` plus the button.
2. Paste into a WordPress Custom HTML block.
3. Also upload `waterscan.css` and `waterscan.js` to your theme or a code snippet plugin that lets you enqueue them, or paste their contents into your theme's additional CSS and a code snippet for JS.

Option B - Enqueue files in theme or child theme
- Place the three files in your child theme and enqueue `waterscan.css` and `waterscan.js` via `functions.php`.

## Custom events for analytics
- `ws:update` fires on each recalculation with detail payload.
- `ws:cta` fires on CTA click with the current inputs.

## Replace placeholder maths
Inside `waterscan.js` the `calc()` function has comments showing where to swap in real formulas.

## No external dependencies
Zero frameworks. Pure HTML, CSS, JS.
