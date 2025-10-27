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
    fullPage: false,
  });

  // Mobile screenshot
  await page.setViewport({ width: 540, height: 720 });
  await page.goto('http://localhost:3000/journey');
  await page.screenshot({
    path: 'public/screenshots/mobile-narrow.png',
    fullPage: false,
  });

  await browser.close();
}
```
