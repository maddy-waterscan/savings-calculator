# Waterscan Savings Calculator - Starter
Edit in VS Code. Open `index.html` with Live Server to preview.
I have also connected a netlify project to it to show Neil and Barry

## Files
- `index.html` - markup and includes
- `waterscan.css` - styles
- `waterscan.js` - logic

## Embed in WordPress quickly
- Place the three files in your child theme and enqueue `waterscan.css` and `waterscan.js` via `functions.php`.

## Custom events for analytics
- `ws:update` fires on each recalculation with detail payload.
- `ws:cta` fires on CTA click with the current inputs.

## Replace placeholder maths
Inside `waterscan.js` the `calc()` function has comments showing where to swap in real formulas.

## No external dependencies
Zero frameworks. Pure HTML, CSS, JS.
