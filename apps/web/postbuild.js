const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const routes = [
  'hub',
  'login',
  'district',
  'station',
  'admin',
  'cases',
  'network',
  'predict',
  'reports',
  'audit',
  'forbidden',
];

if (fs.existsSync(outDir)) {
  for (const route of routes) {
    const src = path.join(outDir, route, 'index.html');
    const dest = path.join(outDir, `${route}.html`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`[postbuild] Copied ${route}/index.html -> ${route}.html`);
    }
  }
}
