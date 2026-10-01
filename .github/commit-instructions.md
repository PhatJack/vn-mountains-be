# AI Agent Instructions: Git Commit Message Generator

Generate a single Git commit message from the current diff. Output only the raw
commit message: no explanation, markdown, quotes, or surrounding whitespace.

## Workflow

1. Inspect the complete diff, including staged and unstaged changes when both
   exist. Do not infer intent from filenames alone.
2. Identify the primary user-facing or engineering purpose of the change.
3. Select one type and the narrowest useful scope.
4. Write a concise subject describing what the commit does and why it matters.
5. Add a body only when the subject cannot explain important context, tradeoffs,
   migration notes, or behavior changes.
6. Add footers only when they carry actionable metadata, such as a breaking
   change or an issue reference.
7. Validate the final message against every rule below before outputting it.

## Required Format

```text
<type>[optional scope][!]: <subject>

[optional body]

[optional footer(s)]
```

The header must not exceed 150 characters. Keep the subject under 72 characters
when practical. Use one blank line between the header, body, and footers.

## Header Rules

- Use exactly one type from the list below.
- Use a scope when it clarifies the affected area; omit it when no single scope
  represents the change.
- Use lowercase for the type, scope, and first character of the subject.
- Write the subject in imperative present tense: "add", "fix", "remove", or
  "update". Do not use past tense or gerunds.
- Describe the result and intent, not implementation details.
- Do not end the subject with a period or other punctuation.
- Avoid vague subjects such as "update code", "fix stuff", or "changes".
- Do not combine unrelated changes in one message. If the diff contains several
  independent changes, describe the dominant purpose and use the body for the
  remaining context.

## Type Selection

- `feat`: Add user-visible functionality or capability.
- `fix`: Correct incorrect or unexpected behavior.
- `docs`: Change documentation only.
- `style`: Change formatting or whitespace without behavior changes.
- `refactor`: Restructure code without changing behavior.
- `perf`: Improve performance without changing intended behavior.
- `test`: Add, update, or repair tests without changing production behavior.
- `build`: Change dependencies, package/build configuration, or build tooling.
- `ci`: Change continuous integration configuration or scripts.
- `chore`: Perform maintenance that does not fit another type.
- `revert`: Revert an earlier commit; identify the reverted commit when known.

Choose the type based on the primary purpose. For example, use `fix` for a bug
fix that also adds regression tests, and use `feat` for a feature that includes
its tests.

## Scope Rules

Derive the scope from the main module, domain, or package affected. Use one
lowercase identifier with no spaces, such as `auth`, `mountains`, `images`,
`api`, `db`, `config`, `deps`, or `ci`. Do not use a scope merely to repeat the
repository name. Omit the scope when the change is broad or no scope is useful.

## Body and Footer Rules

- Explain why the change was needed and any behavior that reviewers or users
  should understand; do not restate the diff line by line.
- Wrap body lines at about 72 characters when practical.
- Mention migrations, compatibility concerns, operational steps, or known
  limitations when they are relevant.
- For breaking changes, either append `!` to the type/scope or add a footer in
  this exact form: `BREAKING CHANGE: <what breaks and how to migrate>`.
- Put issue references at the end using `Fixes #123` or `Closes #123` when the
  diff or task provides an issue number. Never invent issue numbers.
- Do not add `Signed-off-by`, co-author, or generated-by footers unless they are
  explicitly requested.

## Examples

```text
feat(mountains): add elevation search filters
```

```text
fix(api): reject invalid mountain coordinates

Validate latitude and longitude before persisting a mountain so malformed
requests return a client error instead of a database failure.
```

```text
refactor(db)!: rename mountain image relation

BREAKING CHANGE: rename the `images` relation to `mountainImages` for API and
repository consumers.
```

```text
test(auth): cover expired refresh tokens
```

## Final Checklist

Before responding, verify that:

- The output contains only one raw commit message.
- The type and subject use lowercase and the subject is imperative.
- The header is at most 150 characters and has no trailing period.
- The type matches the primary purpose of the diff.
- The scope is accurate or intentionally omitted.
- No issue number, breaking change, or other metadata was invented.
