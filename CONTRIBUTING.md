# Contributing to MediRelay

Thank you for your interest. MediRelay is early-stage and every contribution matters — from protocol design to translation.

## Before You Start

- Read [`agentic.md`](agentic.md) fully. It defines hard rules for security, data format, and Stellar usage that all code must follow.
- Read the relevant section of [`README.md`](README.md) for context on what you're changing.
- Check [open issues](../../issues) before starting work to avoid duplication.

## Setup

```bash
git clone https://github.com/your-org/mediarelay.git
cd mediarelay
npm install
cp .env.example .env   # populate MINISTRY_ROOT_PUBLIC_KEY and FACILITY_KEYPAIR_SECRET
npm test               # all 48 tests must pass before you write a line
```

For the mobile app:
```bash
cd mobile
npm install
npx expo start
```

## Workflow

```bash
git checkout -b feat/your-feature-name   # or fix/, docs/, test/, chore/
# make your changes
npm test                                  # must pass
git commit -m "feat: short description"  # Conventional Commits
git push origin feat/your-feature-name
# open a pull request
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|---|---|
| `feat:` | New functionality |
| `fix:` | Bug fix |
| `test:` | Adding or fixing tests |
| `docs:` | Documentation only |
| `chore:` | Build, config, tooling |
| `refactor:` | Code change with no behaviour change |

## Pull Request Requirements

- All existing tests pass (`npm test`)
- New code in `core/` has unit tests
- No PHI in logs, comments, or test fixtures
- No new dependencies without updating `agentic.md`
- TypeScript strict mode — no `any`, no `@ts-ignore`
- PR description explains *why*, not just *what*

## Hard Rules (from `agentic.md`)

These are non-negotiable:

- Never store private keys outside the Android Keystore
- Never put PHI on-chain
- Never transmit unencrypted FHIR payloads over the mesh
- Always serialize mesh payloads as CBOR, not JSON
- Always use ISO 8601 UTC timestamps

Violating these will result in the PR being closed regardless of other quality.

## What We Need Most

See the [Contributing section of the README](README.md#contributing) for a table of open areas by difficulty.

Good first issues are tagged [`good-first-issue`](../../issues?q=label%3Agood-first-issue).

## Questions

Open a [Discussion](../../discussions) rather than an issue for questions. If you find an ambiguity in the protocol spec, open an issue tagged `protocol-question`.

## Code of Conduct

All contributors are expected to uphold the [Code of Conduct](CODE_OF_CONDUCT.md).
