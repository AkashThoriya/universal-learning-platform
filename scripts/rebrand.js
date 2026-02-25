const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.html'];
const IGNORE_DIRS = ['node_modules', '.next', '.git'];

const EXACT_REPLACEMENTS = [
  // Brand
  [/Universal Learning Platform Team/g, 'Universal Learning Platform Team'],
  [/Universal Learning Platform/g, 'Universal Learning Platform'],
  [/universal-learning-platform/g, 'universal-learning-platform'],
  [/Universal Learning Platform/g, 'Universal Learning Platform'],
  [/universal learning platform/g, 'universal learning platform'],
  
  // Phrases capitalized
  [/Goal Preparation/g, 'Goal Preparation'],
  [/Goal Performance/g, 'Goal Performance'],
  [/Target Date/g, 'Target Date'],
  [/Target Date/g, 'Target Date'],
  [/Goal Success/g, 'Goal Success'],
  [/Current Goal/g, 'Current Goal'],
  [/Goal Name/g, 'Goal Name'],
  [/Select Goal/g, 'Select Goal'],
  [/Your Goal/g, 'Your Goal'],
  [/Competitive Goal/g, 'Competitive Goal'],
  [/Government Goal/g, 'Government Goal'],
  [/Goal track/g, 'Goal track'],
  
  // Phrases lowercase
  [/goal preparation/g, 'goal preparation'],
  [/goal performance/g, 'goal performance'],
  [/target date/g, 'target date'],
  [/target date/g, 'target date'],
  [/goal success/g, 'goal success'],
  [/current goal/g, 'current goal'],
  [/goal name/g, 'goal name'],
  [/select goal/g, 'select goal'],
  [/your goal/g, 'your goal'],
  [/competitive goal/g, 'competitive goal'],
  [/government goal/g, 'government goal'],
  [/goal track/g, 'goal track'],

  // Phrases Title Case
  [/Current goal/g, 'Current goal'],
  [/Select goal/g, 'Select goal'],
  [/Your goal/g, 'Your goal'],

  // Specific Tokens
  [/Exam\:/g, 'Goal:'],
  [/>\s*Exam\s*</g, '>Goal<'],
  [/>\s*Goals\s*</g, '>Goals<'],
  [/>\s*exam\s*</g, '>goal<'],
  [/>\s*exams\s*</g, '>goals<'],
  [/>\s*Exam\b/g, '>Goal'],
  [/\bExam\s*</g, 'Goal<'],
  [/>\s*exam\b/g, '>goal'],
  [/\bexam\s*</g, 'goal<'],

  // Standalone uppercase usually is fine if not touching camelCase
  [/\bExams\b/g, 'Goals']
];

function processLine(line, filePath) {
  // Skip modifying imports to prevent breaking paths
  if (line.match(/^import /) || line.match(/from ['"]/)) {
    return line;
  }
  
  let newLine = line;
  for (const [regex, replacement] of EXACT_REPLACEMENTS) {
    newLine = newLine.replace(regex, replacement);
  }

  // Comments (starts with //, /*, or *) or Markdown files
  if (line.match(/^\s*(\/\/|\/\*|\*)/) || filePath.endsWith('.md')) {
    newLine = newLine.replace(/\bExam\b/g, 'Goal');
    newLine = newLine.replace(/\bexam\b/g, 'goal');
    newLine = newLine.replace(/\bExams\b/g, 'Goals');
    newLine = newLine.replace(/\bexams\b/g, 'goals');
  }

  return newLine;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (IGNORE_DIRS.includes(file)) return;
      scanDirectory(fullPath);
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        // Skip package-lock.json to avoid huge diffs and let npm handle it
        if (file === 'package-lock.json') return;
        
        let content = fs.readFileSync(fullPath, 'utf8');
        let lines = content.split('\n');
        let newLines = lines.map(line => processLine(line, fullPath));
        let newContent = newLines.join('\n');
        
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  });
}

const targetDir = path.resolve(__dirname, '..');
console.log(`Scanning directory: ${targetDir}`);
scanDirectory(targetDir);
console.log('Rebrand scan complete.');
