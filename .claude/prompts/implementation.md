You are modifying a Node.js backend prompt used in an AI pipeline.

The system generates habit actions using two passes:

1) Creative pass → generates the action text
2) Structure pass → extracts structured JSON from that text

The system recently introduced a deterministic difficulty cycle:

low → medium → high → low → ...

The backend now decides the difficulty and passes it to the prompts.

However, the current StructureActionPrompt still asks the model to INFER the difficulty from the text:

"difficulty must be exactly one of: low, medium, high. Infer it from the complexity and demand of the action described."

This breaks the deterministic system because the model overrides the backend decision.

Your task is to modify StructureActionPrompt so that difficulty is NO LONGER inferred.

Instead:

The backend will pass a parameter called `difficulty`.

The model must simply COPY that difficulty into the JSON output.

Do not infer difficulty from the text.

------------------------------------------------

STEP 1

Modify the function signature.

Current:

function StructureActionPrompt({ language, rawText })

Change to:

function StructureActionPrompt({ language, rawText, difficulty })

------------------------------------------------

STEP 2

Update the system prompt rules.

Remove this instruction:

"Infer it from the complexity and demand of the action described."

Replace it with:

The difficulty level is already determined by the backend.
You MUST copy the provided difficulty value exactly as given.

The difficulty value is:

${difficulty}

You MUST output this value exactly in the "difficulty" field.

You MUST NOT change, infer, or reinterpret it.

------------------------------------------------

STEP 3

Update the JSON schema description section.

Replace the difficulty rule with:

"difficulty" must be exactly the value provided by the backend.
The allowed values are:

low
medium
high

But you MUST use the provided difficulty value exactly.

------------------------------------------------

STEP 4

Ensure the rest of the prompt behavior remains unchanged.

The model must still:

- extract name
- extract description
- return exactly one JSON object
- preserve language
- avoid creative rewriting

------------------------------------------------

IMPORTANT

The structure pass must become a PURE extraction layer.

It must never reinterpret business logic decided by the backend.

Do not modify anything unrelated to this change.