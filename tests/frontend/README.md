# Frontend Tests

This directory contains tests for the **Next.js web frontend**.

## Structure

```
tests/frontend/
├── README.md          # This file
├── components/        # React component tests
│   └── EmailForm.test.tsx
├── pages/               # Page-level tests
│   └── page.test.tsx
└── utils/               # Utility / helper tests
    └── helpers.test.ts
```

## Tech Stack

- **Framework:** Vitest or Jest (recommended: Vitest for consistency with mobile)
- **DOM Testing:** React Testing Library (`@testing-library/react`)
- **Assertions:** Vitest built-in (`expect`) or `jest-dom` matchers

## Running Tests

```bash
# From project root
npx vitest run tests/frontend

# Or add a script to package.json:
# "test:web": "vitest run tests/frontend"
```

## Writing a Component Test

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmailForm from '../../app/components/EmailForm';

describe('EmailForm', () => {
  it('renders the email input', () => {
    render(<EmailForm />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});
```

## Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| Components | 70% |
| Pages | 50% |
| Utilities | 80% |

---

*See `docs/getting-started.md` for full project setup.*
