# Taskboard development

This is a dependency-free browser task board. Keep product behavior in `src/`,
direct behavioral tests in `tests/`, and static markup/styles in `public/`.
The repository intentionally uses Node.js standard libraries only.

All four configured suites apply to every implementation change:
`format-or-diff-check`, `targeted-unit-tests`, `typecheck-or-compile`, and
`production-build`. They correspond to the scripts under `scripts/` and
the tests under `tests/`. GitHub independently verifies Windows and Linux.

Keep DOM text safe: use textContent for task titles, not HTML interpolation.
Keep tests meaningful; do not remove assertions to make a failing check pass.
Generated `dist/` contents must never be committed. Do not change CI,
package configuration, scripts, or this file through the Git writer.

When the Web ChatGPT Git writer app is selected, Web ChatGPT is the primary autonomous coding agent.
It must translate the user's natural-language request into a complete implementation without waiting
for another orchestrator. It must read this file, investigate and reproduce material findings, change
every required source and directly related test, critically inspect the complete diff, run all applicable
checks, fix failures, commit and push only chatgpt/*, create or update a pull request, and squash-merge it
after required checks pass. It must not impose arbitrary file-count or scope limits.
It must never push directly to main, force-push, delete branches, expose secrets, weaken tests,
or modify protected repository, workflow, credential, or writer files.
