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

const madgeOutput = run('npx madge --extensions js .');
const syntaxOutput = run('node --check server.js');
const runtimeOutput = run(
  'node --eval "import(\'./server.js\').catch(e => console.error(e))"'
);

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

Forbidden:
- Refactor architecture
- Rename folders
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