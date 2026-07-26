import fs from 'fs';
import path from 'path';

const functionsDir = path.join(__dirname, '..', 'functions');

function processDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'common') {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name === 'catalyst-config.json') {
      try {
        const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        config.stack = config.stack || 'node20';
        config.main = config.main || 'index.js';
        config.path = config.path || 'index.js';
        fs.writeFileSync(fullPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`Updated ${fullPath}`);
      } catch (err) {
        console.error(`Failed to update ${fullPath}`, err);
      }
    }
  }
}

processDirectory(functionsDir);
