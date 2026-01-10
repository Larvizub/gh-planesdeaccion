const fs = require('fs');
const path = require('path');

const pngPath = 'c:/Dev/React/gh-planesdeaccion/public/Icon_tap_gh.png';
const svgPath = 'c:/Dev/React/gh-planesdeaccion/public/favicon.svg';

try {
    const base64 = fs.readFileSync(pngPath).toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    @media (prefers-color-scheme: dark) {
      .favicon { filter: brightness(0) invert(1); }
    }
  </style>
  <image class="favicon" href="data:image/png;base64,${base64}" x="0" y="0" width="32" height="32" />
</svg>`;
    fs.writeFileSync(svgPath, svgContent);
    console.log('SVG Favicon created successfully.');
} catch (err) {
    console.error('Error creating SVG Favicon:', err);
}
