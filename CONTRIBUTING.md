# Contributing to Prince Haul Intelligence (PHI)

Thank you for considering contributing to PHI! This document outlines the process and guidelines for contributing to the project.

---

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in the [Issues](https://github.com/michellemcbean5-droid/phi-app/issues) section.
- If not, open a new issue with:
  - A clear title and description
  - Steps to reproduce
  - Expected vs. actual behavior
  - Screenshots (if applicable)
  - Environment details (OS, Node version, Python version)

### Suggesting Features

- Open a new issue with the label `enhancement`.
- Describe the feature and its use case.
- Explain how it benefits owner-operators or fleet teams.

### Pull Requests

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```
2. **Make your changes** following the conventions in `AGENTS.md`.
3. **Run tests** and ensure they pass:
   ```bash
   # Backend
   cd backend && pytest test_backend.py

   # Mobile
   cd mobile && npm run test
   ```
4. **Update documentation** if user-facing behavior changes:
   - `README.md`
   - `docs/` files
   - `AGENTS.md` (if agent rules change)
5. **Commit** with a clear, descriptive message:
   ```
   feat: add HOS violation alert push notification
   fix: correct RPM calculation in earnings screen
   docs: update deployment guide for AWS ECS
   ```
6. **Push** your branch and open a Pull Request against `main`.
7. **Wait for CI** to pass (see `.github/workflows/ci.yml`).
8. **Request review** from a maintainer.

---

## Code Style

### TypeScript / React (Web + Mobile)

- Use **Prettier** and **ESLint** (configs already in repo).
- Follow React functional component patterns.
- Use TypeScript strict mode; no `any` without justification.
- Name components in PascalCase (`EmailForm.tsx`).
- Name hooks in camelCase with `use` prefix (`useAuth.ts`).

### Python (Backend)

- Follow **PEP 8** with max line length 100.
- Use **type hints** everywhere.
- Use `async` / `await` for I/O-bound operations.
- Import order: stdlib → third-party → local.

### Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependencies |

Example:
```
feat(backend): add websocket endpoint for live GPS tracking
```

---

## Project Structure for Contributors

```
phi-app/
├── app/              # Next.js web — landing pages, components
├── backend/          # Python FastAPI — AI agents, workflows, API
├── mobile/           # Expo React Native — screens, navigation, stores
├── tests/            # Test suites for all platforms
├── docs/             # Documentation
└── .github/workflows/# CI/CD pipelines
```

Before writing code, read the relevant section in `AGENTS.md` for your stack.

---

## Community Guidelines

- Be respectful and constructive in all interactions.
- Focus on what is best for truckers and the PHI community.
- Welcome newcomers and help them get started.

---

## Questions?

- Open a [GitHub Discussion](https://github.com/michellemcbean5-droid/phi-app/discussions) for general questions.
- Tag `@michellemcbean5-droid` for maintainer attention.

---

*By contributing, you agree that your contributions will be licensed under the MIT License.*
