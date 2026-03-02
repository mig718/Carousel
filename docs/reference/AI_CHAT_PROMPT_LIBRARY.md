# AI Chat Prompt Library (Coding)

Reusable prompts for high-speed, high-quality coding sessions.

## 1) Bug Fix (Targeted)

```text
Fix this bug exactly:
Goal: <expected behavior>
Scope: <file/path>
Constraints: minimal diff, no refactors
Validation: compile and/or unit tests only
Output: short summary + numbered TODO with (User)/(Agent)
```

## 2) Root-Cause Fix (Not Symptom)

```text
Find and fix the root cause, not a surface patch.
Scope: <module>
Do not change public APIs unless necessary.
```

## 3) Safe Refactor

```text
Refactor for readability only.
Keep behavior identical.
Touch only <files>.
Validate with compile/tests.
```

## 4) Add Unit Tests

```text
Add focused unit tests for <function/class>.
Cover success + failure paths.
No integration/e2e tests.
```

## 5) Performance Micro-Optimization

```text
Optimize this hot path without changing output.
Show before/after complexity and keep code simple.
```

## 6) API Contract Update

```text
Implement this API change:
Input: <new fields>
Output: <new response>
Update DTOs, service, controller, and tests.
```

## 7) Documentation Sync

```text
Update docs for the code changes in <paths>.
Keep docs concise and command-accurate.
```

## 8) Migration Prompt

```text
Migrate <old tech> to <new tech> in <scope>.
Remove old references and checks.
Validate compile/tests only.
```

## 9) Policy Prompt (High Impact)

```text
For all future steps in this task:
- default to compile/unit-test validation
- do not auto-run service start/stop
- if integration run is needed, ask first in summary
```

## 10) Option Selection Prompt

```text
Execute option 2 now.
Then do <second action>.
Do not wait for confirmation.
```

## 11) Scope Lock Prompt

```text
Only modify <exact files/dirs>.
If more changes are required, stop and list them.
```

## 12) PR Review Prompt

```text
Review current changes for:
1) correctness
2) risk
3) missing tests
4) docs drift
Return top 5 findings only.
```

## 13) Fast Triage Prompt

```text
Triage this failure quickly:
- likely root causes (ranked)
- fastest safe fix
- validation command
```

## 14) Multi-Step Implementation Prompt

```text
Implement in this order:
1) backend changes
2) frontend wiring
3) tests/docs
Keep summaries short and actionable.
```

## 15) Output Format Prompt

```text
Final response format:
- What changed
- Where
- Risks
- Numbered TODO with (User)/(Agent)
```

## Fast Rule of Thumb

- Use **explicit constraints** (`only`, `do not`, `exactly`).
- Use **execution verbs** (`execute`, `implement`, `update`).
- Always define **validation** and **output format**.