const fs = require('fs');
const path = require('path');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.html'];
const IGNORE_DIRS = ['node_modules', '.next', '.git'];

const FIXES = [
  [/customExam:/g, 'customExam:'],
  [/isCustomExam:/g, 'isCustomExam:'],
  [/hasExam:/g, 'hasExam:'],
  [/currentExam:/g, 'currentExam:'],
  [/selectedExam:/g, 'selectedExam:'],
  [/upscExam:/g, 'upscExam:'],
  [/targetExam:/g, 'targetExam:']
];

function processLine(line) {
  let newLine = line;
  for (const [regex, replacement] of FIXES) {
    newLine = newLine.replace(regex, replacement);
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
        if (file === 'package-lock.json') return;
        
        let content = fs.readFileSync(fullPath, 'utf8');
        let lines = content.split('\n');
        let newLines = lines.map(line => processLine(line));
        let newContent = newLines.join('\n');
        
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Reverted bugs in: ${fullPath}`);
        }
      }
    }
  });
}

const targetDir = path.resolve(__dirname, '..');
console.log(`Scanning directory to revert bugs: ${targetDir}`);
scanDirectory(targetDir);
console.log('Revert complete.');
