import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return (error.stdout || '') + '\n' + (error.stderr || '');
  }
}

console.log('\n🔍 Running deployment verification...\n');

// 1️⃣ Import graph validation
const madgeOutput = run('npx madge --extensions js .');

// 2️⃣ Syntax validation
const syntaxOutput = run('node --check server.js');

// 3️⃣ Runtime validation (Linux-safe, no port collision)
const runtimeOutput = run(
  'node --eval "process.env.PORT=0; import(\'./server.js\').catch(e => console.error(e))"'
);

// 4️⃣ Detect operational errors
const hasMadgeErrors =
  madgeOutput.includes('Skipped') ||
  madgeOutput.toLowerCase().includes('error');

const hasSyntaxErrors = syntaxOutput.trim() !== '';

const hasModuleErrors =
  runtimeOutput.includes('ERR_MODULE_NOT_FOUND') ||
  runtimeOutput.includes('Cannot find module');

if (!hasMadgeErrors && !hasSyntaxErrors && !hasModuleErrors) {
  console.log('✅ Project appears clean and deployment-ready.\n');
  process.exit(0);
}

// 5️⃣ Generate prompt for Claude
const prompt = `
# Deployment Fix Request

Project: Node.js backend (pure JavaScript, "type": "module")

Fix ONLY operational issues.

Allowed:
- Broken imports
- Incorrect extensions (.ts → .js)
- Missing files
- Syntax errors
- Missing dependencies
- Case-sensitivity mismatches

Forbidden:
- Refactor architecture
- Rename folders arbitrarily
- Modify business logic
- Introduce TypeScript

---

## Madge Output
${madgeOutput}

---

## Syntax Check Output
${syntaxOutput}

---

## Runtime Output
${runtimeOutput}

Return:
- Only modified code sections
- Minimal explanation
`;

const promptDir = path.resolve('.claude/prompts');

if (!fs.existsSync(promptDir)) {
  fs.mkdirSync(promptDir, { recursive: true });
}

fs.writeFileSync(
  path.join(promptDir, 'deployment-fix.md'),
  prompt
);

console.log('📝 Prompt generated at .claude/prompts/deployment-fix.md\n');

console.log('Now execute:\n');
console.log(`cat \\
  .claude/manifest.md \\
  .claude/agents/workers/deployment-fixer.md \\
  .claude/prompts/deployment-fix.md \\
| claude run\n`);