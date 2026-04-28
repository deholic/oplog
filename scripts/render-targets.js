#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const canonicalRoot = path.join(repoRoot, 'canonical', 'oplog');
const checkOnly = process.argv.includes('--check');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

function frontmatter(meta) {
  return [
    '---',
    `name: ${meta.skillName}`,
    `version: ${meta.version}`,
    `description: ${JSON.stringify(meta.description)}`,
    '---',
    '',
  ].join('\n');
}

function generatedSkill(meta, body) {
  return `${frontmatter(meta)}<!-- Generated from canonical/oplog. Do not edit target copies by hand. -->\n\n${body.trim()}\n`;
}

function pluginManifest(meta) {
  return `${JSON.stringify(
    {
      name: meta.pluginName,
      version: meta.version,
      description: meta.description,
    },
    null,
    2,
  )}\n`;
}

function writeGenerated(relativePath, content) {
  const targetPath = path.join(repoRoot, relativePath);
  const normalizedContent = normalize(content);

  if (checkOnly) {
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Missing generated file: ${relativePath}`);
    }

    const current = normalize(read(targetPath));
    if (current !== normalizedContent) {
      throw new Error(`Generated file is out of date: ${relativePath}`);
    }
    return;
  }

  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, normalizedContent);
}

function main() {
  const meta = JSON.parse(read(path.join(canonicalRoot, 'meta.json')));
  const body = read(path.join(canonicalRoot, 'body.md'));
  const obsidianReference = read(path.join(canonicalRoot, 'references', 'obsidian.md'));
  const atlassianReference = read(path.join(canonicalRoot, 'references', 'atlassian.md'));

  const skillOutputs = [
    '.agents/skills/oplog',
    'skills/oplog',
  ];

  for (const outputDir of skillOutputs) {
    writeGenerated(path.join(outputDir, 'SKILL.md'), generatedSkill(meta, body));
    writeGenerated(path.join(outputDir, 'references', 'obsidian.md'), `${normalize(obsidianReference).trim()}\n`);
    writeGenerated(path.join(outputDir, 'references', 'atlassian.md'), `${normalize(atlassianReference).trim()}\n`);
  }

  writeGenerated('.claude-plugin/plugin.json', pluginManifest(meta));
}

try {
  main();
  if (!checkOnly) {
    process.stdout.write('Rendered OpenCode and Claude plugin targets.\n');
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
