# Kununu Fonts

This folder contains the authentic kununu design system fonts for local development.

## Why are these fonts here?

The kununu fonts are normally hosted on `https://assets.kununu.com/fonts/prod/` but that CDN has CORS restrictions that prevent loading fonts from `localhost` during development.

To work around this, we've downloaded the fonts and serve them locally from this directory.

## Fonts included

### InterUI (Body text and UI)
- `inter-regular.woff2` - Weight 400
- `inter-medium.woff2` - Weight 500
- `inter-semibold.woff2` - Weight 600
- `inter-bold.woff2` - Weight 700

### Sharp Grotesk 23 (Large headings: h1, h2)
- `sharp23-smbold.woff2` - Weight 600, Semibold

### Sharp Grotesk 19 (Small headings: h3-h6)
- `sharp19-medium.woff2` - Weight 500, Medium
- `sharp19-smbold.woff2` - Weight 600, Semibold

## Re-downloading fonts

If you need to refresh these fonts, run:

```bash
cd apps/web/public/fonts
curl -O https://assets.kununu.com/fonts/prod/inter-regular.woff2
curl -O https://assets.kununu.com/fonts/prod/inter-medium.woff2
curl -O https://assets.kununu.com/fonts/prod/inter-semibold.woff2
curl -O https://assets.kununu.com/fonts/prod/inter-bold.woff2
curl -O https://assets.kununu.com/fonts/prod/sharp23-smbold.woff2
curl -O https://assets.kununu.com/fonts/prod/sharp19-medium.woff2
curl -O https://assets.kununu.com/fonts/prod/sharp19-smbold.woff2
```

## Font declarations

The `@font-face` declarations are in `/app/fonts.css` and reference these files using `/fonts/` paths (Next.js automatically serves files from `/public/`).

## Production

In a production environment on kununu.com, you might want to:
- Use the CDN fonts instead (CORS would allow it)
- Or continue using local fonts for consistent performance
- Ensure fonts are optimized and properly cached
