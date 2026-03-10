You are working on a Node.js backend that generates habit actions using an LLM.

The system currently allows the AI to decide the difficulty of an action (low / medium / high).

This leads to a problem:
the model almost always selects "medium".

We want to fix this by making the difficulty **fully deterministic in the backend**.

The rule must be:

low → medium → high → low → medium → high → ...

The LLM will no longer choose the difficulty.
The backend will compute the next difficulty and inject it into the prompt.

Your task is to implement this change.

------------------------------------------------

STEP 1

Create a helper function that determines the next difficulty
based on the last action in the series.

Implementation rules:

- If there are no actions yet → return "low"
- If last difficulty is "low" → return "medium"
- If last difficulty is "medium" → return "high"
- If last difficulty is "high" → return "low"

Example implementation:

function getNextDifficulty(actions) {
  if (!actions || actions.length === 0) return "low";

  const last = actions[actions.length - 1].difficulty;

  if (last === "low") return "medium";
  if (last === "medium") return "high";
  if (last === "high") return "low";

  return "medium";
}

------------------------------------------------

STEP 2

Modify the action generation flow so that:

1. The backend calls `getNextDifficulty(series.actions)`
2. The result is stored as `nextDifficulty`
3. `nextDifficulty` is passed to the CreativeActionPrompt.

Example:

const difficulty = getNextDifficulty(series.actions);

CreativeActionPrompt({
  language,
  series,
  difficulty
});

------------------------------------------------

STEP 3

Modify CreativeActionPrompt.js.

Current signature:

function CreativeActionPrompt({ language, series })

Change it to:

function CreativeActionPrompt({ language, series, difficulty })

------------------------------------------------

STEP 4

Update the prompt instructions.

Remove any instruction that asks the model to choose the difficulty.

Instead inject the difficulty explicitly:

DIFFICULTY LEVEL (MANDATORY)

The difficulty level for this action is:

${difficulty}

You MUST generate an action that realistically matches this difficulty.

Difficulty definitions:

low:
quick and light effort, short duration

medium:
moderate effort and focus required

high:
demanding, longer or cognitively intensive

------------------------------------------------

STEP 5

The model must still output the difficulty field in the action,
but it must always match the injected difficulty.

------------------------------------------------

IMPORTANT

Do not change anything unrelated to this fix.

Only:

• add the helper function
• modify the prompt signature
• inject the difficulty into the prompt
• remove random difficulty behavior