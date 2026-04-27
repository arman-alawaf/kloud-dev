# SEO Maintenance Notes

This project keeps SEO-related markup in `index.html` and styles/scripts in external files for best practice.

## Current SEO Base

- Page title is set in `<title>`.
- Meta description is present for search snippets.
- Robots meta is present as `index, follow`.
- Canonical URL is defined.
- Semantic heading structure exists in content sections.
- Images include `alt` text.

## CSS/JS Organization

- Global styles: `assets/css/style.css`
- Extracted inline styles: `assets/css/inline-extracted.css`
- JS entry file: `assets/js/main.js`

## Maintenance Checklist

1. Keep one unique `<title>` and `<meta name="description">` per page.
2. Keep canonical URL aligned with production domain.
3. Keep all new styles in external CSS files (no inline `style` attributes).
4. Keep all new scripts in external JS files (no inline script blocks for custom logic).
5. Keep meaningful `alt` text for all content images.
6. Keep internal links crawlable and avoid empty `href` values in production.

