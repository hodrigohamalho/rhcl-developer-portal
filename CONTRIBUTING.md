# Contributing to rhcl-developer-portal

Thanks for your interest. This repo is small and pragmatic; here's what
maintainers expect.

## Filing an issue

Before opening one, please:

1. Check the existing issues (open + closed).
2. Confirm the issue reproduces against the `main` branch — pinned demo
   images can lag the source tree by weeks.
3. Include OpenShift version, RHCL operator version, and the
   relevant logs (`oc logs deploy/portal-backend -n rhcl-devportal`).

Tag the issue:
- `bug` — something's broken
- `enhancement` — new feature or UX change
- `docs` — README / ARCHITECTURE clarification
- `discuss` — design question, no fix yet

## Pull requests

- One topic per PR. Refactors and feature work in separate PRs.
- Reference the issue in the PR body. If it doesn't have one, write a
  short rationale up top (why, not just what).
- Backend tests live in `backend/src/test/java/`; please add at least
  one for every behavioural change. Frontend changes don't have a test
  expectation yet but `npm run lint && npx tsc --noEmit` must pass.
- Keep formatting consistent — backend uses `./mvnw verify` defaults,
  frontend uses `prettier` via the Vite toolchain.

## Coding conventions

### Backend (Java 21, Quarkus)

- Package root: `io.kuadrant.devportal.*`. Keep packages by responsibility
  (`api`, `domain`, `rhcl`, `service`, `security`, `health`) — don't
  invent layers.
- Comments explain **why**, not what. The code already says what.
- No checked exceptions across module boundaries — wrap in a
  domain-specific `RuntimeException`.
- `RhclIntegrationService` is the only place that knows about
  Kubernetes; everything else takes domain entities.

### Frontend (TS, React 18 + Vite)

- Pages are routed components; reusable bits live under `components/`.
- API access goes through `useQuery`/`useMutation` hooks in
  `api/hooks.ts` — no `fetch` calls in components.
- Tailwind utility classes inline. Keep `cx()` for conditional class
  merging.
- Tenant-specific copy must read from `config.tenant.*`. Never hardcode
  a tenant name.

### Commits

Subject in imperative, present tense ("add subscription banner", not
"added"). One blank line, then a paragraph explaining the why. If the
change affects deploy, mention what an operator has to re-run.

## Release process

Maintainers tag releases as `vX.Y.Z` on `main`. CI builds + pushes
container images; downstream installers pin the digest. Bumping the
version is a separate PR from feature work.

## Security disclosures

Please **don't** open a public issue for vulnerabilities. Email the
maintainers (see `README.md` for current contacts) with details and a
proof of concept. We aim to acknowledge within two business days.

## Code of conduct

Be excellent. Be patient with newcomers. Disagreements over technical
direction are fine; personal attacks aren't. Maintainers reserve the
right to lock or remove threads that don't follow this.
