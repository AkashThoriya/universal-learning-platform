#!/usr/bin/env node

/**
 * Format and Lint Workflow Script
 * Runs Prettier formatting followed by ESLint fixes and checks
 */

const { execSync } = require('child_process');
const path = require('path');

// console.log('🎨 Starting Format & Lint Workflow...\n');

try {
  // Step 1: Run Prettier formatting
  // console.log('📝 Step 1: Running Prettier formatting...');
  execSync('npx prettier --write .', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  // console.log('✅ Prettier formatting complete!\n');

  // Step 2: Run ESLint auto-fixes
  // console.log('🔧 Step 2: Running ESLint auto-fixes...');
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --fix', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  // console.log('✅ ESLint auto-fixes complete!\n');

  // Step 3: Run final ESLint check
  // console.log('🔍 Step 3: Running final ESLint check...');
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 100', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  // console.log('✅ All checks passed!\n');

  // console.log('🎉 Format & Lint workflow completed successfully!');
  // console.log('📊 Benefits achieved:');
  // console.log('   • Consistent code formatting via Prettier');
  // console.log('   • Automated ESLint fixes applied');
  // console.log('   • Code quality standards enforced');
  // console.log('   • Ready for production deployment');

} catch (error) {
  console.error('❌ Workflow failed:', error.message);
  // console.log('\n💡 Try running individual commands:');
  // console.log('   npm run format     # Format with Prettier');
  // console.log('   npm run lint:fix   # Fix ESLint issues');
  // console.log('   npm run lint:check # Check remaining issues');
  process.exit(1);
}
