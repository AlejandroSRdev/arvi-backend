## Central Command Registry for Claude Agents

This file acts as the **single source of truth** for all Claude agent execution commands used in this repository.

It defines:
- The base execution pattern
- The currently active agents
- The command composition for each agent

All future agents must be registered here to ensure operational clarity and reproducibility.


BASE COMMAND

cat \
  .claude/manifest.md \ (optional)
  .claude/agents/leaders || workers/<agent>.md \
  .claude/prompts/<prompt>.md \
| claude run



FIXER DEPLOYMENT AGENT (npm run verify to analize deployment issues):

cat \
  .claude/manifest.md \
  .claude/agents/workers/deployment-fixer.md \
  .claude/prompts/deployment-fix.md \
| claude run

DIAGRAM ARCHITECT (Creates flow diagrams)

❯ cat \
    .claude/manifest.md \                                                                                                                                     ─────────────────────────────────────────────────────────
    .claude/agents/leaders/mermaid-flowchart-architect.md \
    .claude/prompts/diagram.md \ 
  | claude run 
──────────────────

IMPLEMENTER (Clean code implementation)

❯ cat \
    .claude/manifest.md \                                                                                                                                     ─────────────────────────────────────────────────────────
    .claude/agents/workers/implementer.md \
    .claude/prompts/implementation.md \ 
  | claude run 