import fs from 'fs';
import path from 'path';

const targets = [
  'admin',
  'ai',
  'alerts',
  'analytics',
  'auth_context',
  'cases',
  'entities',
  'health',
  'ingest',
  'masters',
  'network',
  'reports',
  'search',
];

const functionsDir = path.join(__dirname, '..', 'functions');

targets.forEach((target) => {
  const targetDir = path.join(functionsDir, target);
  if (fs.existsSync(targetDir)) {
    const pkgPath = path.join(targetDir, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      const content = JSON.stringify(
        {
          name: target,
          version: '1.0.0',
          main: 'index.js',
        },
        null,
        2
      );
      fs.writeFileSync(pkgPath, content, 'utf8');
      console.log(`Created ${pkgPath}`);
    }
  }
});
