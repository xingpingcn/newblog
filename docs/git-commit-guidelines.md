# Git Commit Guidelines

This repository follows the Conventional Commits style used in the existing
history.

## Commit Message Format

Use this format:

```text
type(scope): summary
```

`scope` is optional when the change is repository-wide or the scope would not
add useful context:

```text
type: summary
```

Keep the summary short, lowercase, and written in English.

## Common Types

- `feat`: user-facing feature or meaningful capability.
- `fix`: bug fix or behavior correction.
- `docs`: documentation-only change.
- `style`: formatting or visual/CSS-only change that does not alter behavior.
- `refactor`: code restructuring without intended behavior change.
- `chore`: maintenance work such as dependency, config, or generated metadata updates.
- `test`: test-only change.

## Scope Examples

Use a scope when it makes the affected area clearer:

- `readme`
- `blog`
- `theme`
- `rss`
- `friends`
- `content`

Examples from this repository's history:

```text
feat: astro 6, bun
fix: persist katex css in view transitions
chore(readme): update blog listing
chore(readme): add example blog
```

## Before Committing

1. Check the current worktree:

   ```sh
   git status --short
   git diff --check
   ```

2. Review the staged diff before committing:

   ```sh
   git diff --cached --stat
   git diff --cached
   git diff --cached --check
   ```

3. Run validation appropriate to the change. For normal code, template, content,
   or styling changes, run:

   ```sh
   npm run build
   ```

   For formatting-only cleanup, run:

   ```sh
   npm run prettier
   ```

## Commit Boundaries

- Prefer one commit per coherent change.
- Split unrelated work into separate commits.
- Do not include local verification artifacts, temporary files, or generated
  build output unless they are intentionally part of the change.
- When the worktree is already dirty, stage only the files that belong to the
  verified change.
