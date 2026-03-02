# AI Chat Coding Study Guide (High-Impact)

Use this guide to get better code outcomes faster when working with an AI coding assistant.

## 1) Fast Prompt Formula

Use this structure in one message:

1. **Goal**: what success looks like
2. **Scope**: files/services in and out
3. **Constraints**: what not to do
4. **Validation**: how to prove done
5. **Output format**: how results should be summarized

Template:

```text
Goal: <exact outcome>
Scope: <folders/files/services>
Constraints: <do/don't list>
Validation: <compile/test command only, etc.>
Output: <summary style + numbered TODO with (User)/(Agent)>
```

## 2) Highest-Impact Keywords

- **"exactly" / "only"** → prevents scope creep
- **"do not"** → blocks expensive or risky actions
- **"default to"** → sets policy for future steps
- **"for all next steps"** → makes behavior persistent
- **"if needed, ask first"** → adds approval gate
- **"execute option X"** → resolves ambiguity quickly
- **"number TODOs"** → speeds feedback loops

## 3) Sentence Patterns That Save Time

### A) Policy-setting pattern

```text
For all future changes, default to <policy>. Do not <expensive action> automatically.
If <condition>, include it in summary and ask for confirmation first.
```

### B) Action-selection pattern

```text
Execute option 1. Then do <second action>.
```

### C) Ownership pattern

```text
In summary, use numbered TODO steps and tag each as (User) or (Agent).
```

### D) Scope-lock pattern

```text
Make a minimal change in <path>. No unrelated refactors.
```

## 4) Before vs Better (From This Conversation)

### Example 1 — Ambiguous intent vs explicit migration

Before:
- “Are we still using MongoDB... If so, let's clean up remaining mongo checks.”

Better:
- “Migrate any remaining repositories from mongo to postgre and clean up all mongo references and checks.”

Why better:
- Changes from audit-only interpretation to direct implementation intent.
- Reduces back-and-forth and prevents partial cleanup.

### Example 2 — Expensive operations control

Before:
- No explicit rule for service start/stop behavior.

Better:
- “Verify only via compilation/unit testing automatically. If integration/start-stop is needed, ask first in summary.”

Why better:
- Prevents costly runtime operations.
- Keeps feedback loop fast and predictable.

### Example 3 — Ambiguous follow-up vs direct execution

Before:
- “Let's create a study guide...”

Better:
- “Execute option 1... also move study docs to docs/reference.”

Why better:
- Removes option-selection ambiguity.
- Bundles sequencing and destination in one command.

## 5) Copy/Paste Prompt Snippets

### A) Fast implementation request

```text
Implement exactly this:
Goal: <result>
Scope: <paths>
Constraints: minimal edits, no unrelated changes
Validation: compile and/or unit tests only
Output: short summary + numbered TODO with (User)/(Agent)
```

### B) Controlled risky action

```text
Do not run start/stop/integration actions automatically.
If needed, list them at bottom and ask me to confirm.
```

### C) Documentation task

```text
Create a short, high-impact study doc in docs/reference.
Use bullets, examples, and interview-ready phrasing.
```

## 6) Quick Anti-Patterns

- Vague verbs: “check”, “look into”, “maybe clean up”
- Missing boundary: no scope path or service list
- Missing validation rule: allows expensive/slow verification paths
- Missing output format: hard to review quickly

## 7) One-Line Golden Prompt

```text
Implement exactly <goal> in <scope>, with <constraints>, validate by <compile/tests only>, and summarize with numbered TODOs tagged (User)/(Agent).
```