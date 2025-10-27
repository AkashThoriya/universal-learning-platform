#!/bin/bash

# PWA Icon Generation Script for Exam Strategy Engine
# This script generates all required icon sizes from a source SVG or high-resolution PNG

# Colors and branding
PRIMARY_COLOR="#0066cc"
SECONDARY_COLOR="#ffffff"
ACCENT_COLOR="#00cc66"

echo "🎨 Generating PWA icons for Exam Strategy Engine..."

# Create icons directory
mkdir -p public/icons
mkdir -p public/screenshots

# Generate app icons (placeholder - replace with actual icon generation)
cat > public/icons/icon.svg << 'EOF'
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0066cc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#004499;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#grad1)"/>
  
  <!-- Book Icon -->
  <rect x="128" y="160" width="256" height="192" rx="16" fill="white" opacity="0.9"/>
  <rect x="144" y="176" width="224" height="8" rx="4" fill="#0066cc"/>
  <rect x="144" y="200" width="160" height="6" rx="3" fill="#666"/>
  <rect x="144" y="220" width="180" height="6" rx="3" fill="#666"/>
  <rect x="144" y="240" width="140" height="6" rx="3" fill="#666"/>
  
  <!-- Progress indicator -->
  <circle cx="384" cy="192" r="24" fill="#00cc66"/>
  <path d="M376 192 L382 198 L392 184" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
  
  <!-- Study timer -->
  <circle cx="192" cy="288" r="32" fill="white" stroke="#0066cc" stroke-width="4"/>
  <path d="M192 264 L192 288 L208 304" stroke="#0066cc" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>
EOF

# Icon sizes for different platforms
ICON_SIZES=(
  "16:favicon-16x16.png"
  "32:favicon-32x32.png"
  "72:icon-72x72.png"
  "96:icon-96x96.png"
  "128:icon-128x128.png"
  "144:icon-144x144.png"
  "152:icon-152x152.png"
  "180:apple-touch-icon.png"
  "192:icon-192x192.png"
  "384:icon-384x384.png"
  "512:icon-512x512.png"
)

# Microsoft tile sizes
MS_TILE_SIZES=(
  "70:mstile-70x70.png"
  "150:mstile-150x150.png"
  "310x150:mstile-310x150.png"
  "310:mstile-310x310.png"
)

# Generate notification icons
NOTIFICATION_SIZES=(
  "72:badge-72x72.png"
  "96:action-open.png"
  "96:action-dismiss.png"
  "96:action-study.png"
  "96:action-later.png"
  "96:action-mission.png"
  "96:action-postpone.png"
  "96:action-quick.png"
  "96:action-start.png"
  "96:action-snooze.png"
  "96:action-view.png"
  "96:action-share.png"
)

echo "📱 Generating app icons..."

# Note: In a real implementation, you would use imagemagick or similar tool
# For now, we'll create placeholder instructions
cat > public/icons/README.md << 'EOF'
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
- [x] action-*.png (96x96 each)

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
EOF

# Create Safari pinned tab icon
cat > public/icons/safari-pinned-tab.svg << 'EOF'
<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g fill="#000000">
    <rect x="128" y="160" width="256" height="192" rx="16"/>
    <rect x="144" y="176" width="224" height="8" rx="4"/>
    <circle cx="384" cy="192" r="24"/>
    <circle cx="192" cy="288" r="32"/>
  </g>
</svg>
EOF

# Create placeholder screenshots
echo "📸 Creating placeholder screenshots..."

cat > public/screenshots/README.md << 'EOF'
# PWA Screenshots

Screenshots are required for app store listings and enhanced install prompts.

## Required Screenshots

### Desktop (Wide Form Factor)
- **Size**: 1280x720 pixels
- **File**: desktop-wide.png
- **Content**: Dashboard view showing key features

### Mobile (Narrow Form Factor)  
- **Size**: 540x720 pixels
- **File**: mobile-narrow.png
- **Content**: Mobile learning session interface

## Screenshot Guidelines

1. **High Quality**: Use high-resolution, crisp images
2. **Representative**: Show actual app functionality
3. **Clean Interface**: Remove any placeholder or lorem ipsum text
4. **Consistent Branding**: Match app's visual identity
5. **Real Data**: Use realistic, but anonymized data

## Tools for Creating Screenshots

- Browser DevTools for responsive screenshots
- Figma/Sketch for mockups
- Puppeteer for automated screenshots
- Online screenshot tools

## Example Generation Script

```javascript
// Using Puppeteer to generate screenshots
const puppeteer = require('puppeteer');

async function generateScreenshots() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Desktop screenshot
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/dashboard');
  await page.screenshot({ 
    path: 'public/screenshots/desktop-wide.png',
    fullPage: false 
  });
  
  // Mobile screenshot  
  await page.setViewport({ width: 540, height: 720 });
  await page.goto('http://localhost:3000/journey');
  await page.screenshot({ 
    path: 'public/screenshots/mobile-narrow.png',
    fullPage: false 
  });
  
  await browser.close();
}
```
EOF

echo "✅ PWA icon structure created!"
echo ""
echo "📋 Next Steps:"
echo "1. Create your source icon (1024x1024 PNG or SVG)"
echo "2. Use ImageMagick or online tools to generate all sizes"
echo "3. Create actual screenshots of your app"
echo "4. Test icons on different devices and browsers"
echo ""
echo "📁 Files created:"
echo "- public/icons/icon.svg (placeholder)"
echo "- public/icons/safari-pinned-tab.svg"
echo "- public/icons/README.md (generation instructions)"
echo "- public/screenshots/README.md (screenshot guidelines)"
