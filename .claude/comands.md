cat \
  .claude/manifest.md \
  .claude/agents/leaders || workers/<agent>.md \
  .claude/prompts/<prompt>.md \
| claude run