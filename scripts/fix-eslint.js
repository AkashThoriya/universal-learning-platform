#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Priority order for fixing files
const PRIORITY_PATTERNS = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.ts',
  'hooks/**/*.ts',
  'contexts/**/*.tsx',
  'types/**/*.ts'
];

const COMMON_CONSTANTS = {
  // Time constants
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  
  // UI constants
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  GRID_COLUMNS_MOBILE: 2,
  GRID_COLUMNS_TABLET: 3,
  GRID_COLUMNS_DESKTOP: 4,
  
  // Common sizes
  ICON_SIZE_SMALL: 16,
  ICON_SIZE_MEDIUM: 24,
  ICON_SIZE_LARGE: 32,
  
  // Animation durations
  ANIMATION_FAST: 200,
  ANIMATION_MEDIUM: 300,
  ANIMATION_SLOW: 500,
  
  // Percentages
  PERCENTAGE_25: 25,
  PERCENTAGE_50: 50,
  PERCENTAGE_75: 75,
  PERCENTAGE_80: 80,
  PERCENTAGE_90: 90,
  PERCENTAGE_95: 95
};

function runESLintFix(pattern) {
  try {
    // console.log(`🔧 Fixing ESLint issues in: ${pattern}`);
    execSync(`npx eslint "${pattern}" --fix --quiet`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    // console.log(`✅ Fixed: ${pattern}`);
  } catch (error) {
    // console.log(`⚠️  Issues remain in: ${pattern}`);
  }
}

function main() {
  // console.log('🚀 Starting ESLint auto-fix process...\n');
  
  // Fix files in priority order
  PRIORITY_PATTERNS.forEach(pattern => {
    runESLintFix(pattern);
  });
  
  // console.log('\n✨ ESLint auto-fix completed!');
  // console.log('\n📊 Running final check to see remaining issues...');
  
  try {
    execSync('npx eslint . --ext .ts,.tsx --format=compact --max-warnings=20', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    // console.log('\n⚠️  Some issues require manual fixes.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { runESLintFix, COMMON_CONSTANTS };
