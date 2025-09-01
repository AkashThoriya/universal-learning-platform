#!/usr/bin/env node

/**
 * Automated ESLint fix script for common patterns
 * This script fixes the most frequent ESLint warnings in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common patterns to fix
const fixes = [
  {
    // Fix nullish coalescing
    pattern: /(\w+)\s*\|\|\s*(['"`][^'"`]*['"`]|[\w.]+)/g,
    replacement: '$1 ?? $2',
    description: 'Fix nullish coalescing operators'
  },
  {
    // Fix label associations - pattern for labels without htmlFor
    pattern: /<label\s+className="([^"]*)"[^>]*>([^<]+)<\/label>\s*\n\s*<(Input|Select|Textarea|Slider)/g,
    replacement: (match, className, labelText, componentType) => {
      const id = labelText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return `<label htmlFor="${id}" className="${className}">${labelText}</label>\n                    <${componentType}\n                      id="${id}"`;
    },
    description: 'Fix label associations'
  }
];

function applyFixesToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`Applied ${fix.description} to ${filePath}`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function findTSXFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTSXFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
console.log('Starting automated ESLint fixes...');

const projectRoot = process.cwd();
const tsxFiles = findTSXFiles(projectRoot);

console.log(`Found ${tsxFiles.length} TypeScript files`);

// Apply fixes to each file
tsxFiles.forEach(applyFixesToFile);

console.log('Automated fixes complete. Running prettier...');

try {
  execSync('npm run format', { stdio: 'inherit' });
  console.log('Prettier formatting complete.');
} catch (error) {
  console.error('Prettier failed:', error.message);
}

console.log('All fixes applied!');
