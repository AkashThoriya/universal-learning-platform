# Icon Generation Instructions

To generate all required PWA icons, you'll need to:

1. Create a high-resolution source icon (preferably 1024x1024 PNG or SVG)
2. Use an image processing tool like ImageMagick to generate all sizes:

```bash
# Install ImageMagick
sudo apt-get install imagemagick  # Ubuntu/Debian
brew install imagemagick          # macOS

# Generate all icon sizes from source
convert source-icon-1024.png -resize 16x16 public/icons/favicon-16x16.png
convert source-icon-1024.png -resize 32x32 public/icons/favicon-32x32.png
convert source-icon-1024.png -resize 72x72 public/icons/icon-72x72.png
convert source-icon-1024.png -resize 96x96 public/icons/icon-96x96.png
convert source-icon-1024.png -resize 128x128 public/icons/icon-128x128.png
convert source-icon-1024.png -resize 144x144 public/icons/icon-144x144.png
convert source-icon-1024.png -resize 152x152 public/icons/icon-152x152.png
convert source-icon-1024.png -resize 180x180 public/icons/apple-touch-icon.png
convert source-icon-1024.png -resize 192x192 public/icons/icon-192x192.png
convert source-icon-1024.png -resize 384x384 public/icons/icon-384x384.png
convert source-icon-1024.png -resize 512x512 public/icons/icon-512x512.png

# Microsoft tiles
convert source-icon-1024.png -resize 70x70 public/icons/mstile-70x70.png
convert source-icon-1024.png -resize 150x150 public/icons/mstile-150x150.png
convert source-icon-1024.png -resize 310x150 public/icons/mstile-310x150.png
convert source-icon-1024.png -resize 310x310 public/icons/mstile-310x310.png

# Notification badges and action icons
convert source-icon-1024.png -resize 72x72 public/icons/badge-72x72.png
```

## Alternative: Online Icon Generators

You can also use online tools like:

- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

## Required Icons Checklist

### Basic App Icons

- [x] favicon-16x16.png
- [x] favicon-32x32.png
- [x] icon-72x72.png
- [x] icon-96x96.png
- [x] icon-128x128.png
- [x] icon-144x144.png
- [x] icon-152x152.png
- [x] apple-touch-icon.png (180x180)
- [x] icon-192x192.png
- [x] icon-384x384.png
- [x] icon-512x512.png

### Microsoft Tiles

- [x] mstile-70x70.png
- [x] mstile-150x150.png
- [x] mstile-310x150.png
- [x] mstile-310x310.png

### Safari

- [ ] safari-pinned-tab.svg

### Notification Icons

- [x] badge-72x72.png
- [x] action-\*.png (96x96 each)

### Shortcut Icons

- [ ] shortcut-learn.png
- [ ] shortcut-dashboard.png
- [ ] shortcut-test.png
- [ ] shortcut-analytics.png

### Splash Screens (iOS)

- [ ] apple-splash-2048-2732.jpg
- [ ] apple-splash-1668-2224.jpg
- [ ] apple-splash-1536-2048.jpg
- [ ] apple-splash-1125-2436.jpg
- [ ] apple-splash-1242-2208.jpg
- [ ] apple-splash-750-1334.jpg
- [ ] apple-splash-640-1136.jpg
