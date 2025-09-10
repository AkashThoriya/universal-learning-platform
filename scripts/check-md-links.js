#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else if (e.isFile() && full.endsWith('.md')) files.push(full);
  }
  return files;
}

function isRemote(link) {
  return /^(https?:)?\/\//i.test(link) || link.startsWith('mailto:');
}

function normalizeAnchor(link) {
  // remove anchor part
  return link.split('#')[0];
}

function existsTarget(baseFile, link) {
  const cleaned = normalizeAnchor(link);
  if (!cleaned) return true; // just an anchor
  // absolute paths starting with /: resolve from repo root
  if (cleaned.startsWith('/')) {
    return fs.existsSync(path.join(process.cwd(), cleaned));
  }
  // relative to base file
  const candidate = path.join(path.dirname(baseFile), cleaned);
  if (fs.existsSync(candidate)) return true;
  // relative to repo root
  const repoCandidate = path.join(process.cwd(), cleaned);
  if (fs.existsSync(repoCandidate)) return true;
  return false;
}

const repoRoot = process.cwd();
const mdFiles = walk(repoRoot);
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

const broken = [];
for (const file of mdFiles) {
  const txt = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = linkRegex.exec(txt)) !== null) {
    const link = m[2].trim();
    if (isRemote(link)) continue;
    if (link.startsWith('#')) continue;
    if (link.startsWith('mailto:')) continue;
    // skip image links that reference remote
    if (link.match(/\.(png|jpe?g|svg|gif)(\?|$)/i)) {
      // try to resolve local images too
    }
    if (!existsTarget(file, link)) {
      broken.push({ file: path.relative(repoRoot, file), link });
    }
  }
}

if (broken.length === 0) {
  console.log('OK: No broken relative markdown links found.');
  process.exit(0);
}

console.log('Broken markdown links found:');
for (const b of broken) console.log(`${b.file} -> ${b.link}`);
process.exit(2);
