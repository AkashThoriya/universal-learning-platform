#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix nullish coalescing issues
function fixNullishCoalescing(content) {
  // Replace || with ?? for safer null/undefined checks
  // But be careful not to replace boolean || operations
  return (
    content
      // Fix common patterns like object?.property ?? 'default'
      .replace(/(\w+\?\.\w+)\s*\|\|\s*(['"]\w+['"])/g, '$1 ?? $2')
      .replace(/(\w+\?\.\w+)\s*\|\|\s*(\w+)/g, '$1 ?? $2')
      // Fix patterns like variable ?? 'default'
      .replace(/(\w+\.[\w.]+)\s*\|\|\s*(['"]\w+['"])/g, '$1 ?? $2')
      .replace(/(\w+\.[\w.]+)\s*\|\|\s*(\w+)/g, '$1 ?? $2')
      // Fix patterns for simple variable || default
      .replace(/(\w+)\s*\|\|\s*(['"]\w+['"])/g, '$1 ?? $2')
      .replace(/(\w+)\s*\|\|\s*false/g, '$1 ?? false')
      .replace(/(\w+)\s*\|\|\s*true/g, '$1 ?? true')
      .replace(/(\w+)\s*\|\|\s*0/g, '$1 ?? 0')
      .replace(/(\w+)\s*\|\|\s*\[\]/g, '$1 ?? []')
      .replace(/(\w+)\s*\|\|\s*\{\}/g, '$1 ?? {}')
  );
}

// Function to fix console statements
function fixConsoleStatements(content) {
  return content
    .replace(/console\.log\(/g, '// // console.log(')
    .replace(/console\.warn\(/g, '// // console.warn(')
    .replace(/console\.debug\(/g, '// // console.debug(');
}

// Function to fix any types
function fixAnyTypes(content) {
  return content
    .replace(/:\s*any\b/g, ': unknown')
    .replace(/\<any\>/g, '<unknown>')
    .replace(/any\[\]/g, 'unknown[]');
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    content = fixNullishCoalescing(content);
    content = fixConsoleStatements(content);
    content = fixAnyTypes(content);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      // console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Get all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
  cwd: process.cwd(),
});

// console.log(`Processing ${files.length} files...`);
files.forEach(processFile);
// console.log('Done!');
