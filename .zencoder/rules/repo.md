---
description: Repository Information Overview
alwaysApply: true
---

# Aqui App Information

## Summary
Aqui is a Next.js application that helps users discover local vendors with real-time location tracking. The app is currently undergoing a migration from Supabase Auth to NextAuth.js for authentication.

## Structure
- **app/**: Next.js app directory with page components and API routes
- **lib/**: Utility functions, hooks, and database types
- **components/**: React components for UI elements
- **public/**: Static assets and localization files
- **scripts/**: Database migration and utility scripts
- **tests/**: Testing files (unit, integration, and e2e tests)
- **types/**: TypeScript type definitions
- **supabase/**: Supabase configuration and migrations

## Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.8.3
**Framework**: Next.js 14.2.18
**Build System**: Next.js build system
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- next: ^14.2.18
- react: ^18.2.0
- next-auth: ^5.0.0-beta.29
- @supabase/supabase-js: ^2.50.3
- maplibre-gl: ^5.6.1
- i18next: ^23.7.6
- zod: ^3.22.4
- tailwindcss: ^3.4.17

**Development Dependencies**:
- @playwright/test: ^1.53.2
- vitest: ^3.2.4
- typescript: 5.8.3
- eslint: ^8.54.0

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run type-check
```

## Testing
**Frameworks**: 
- Vitest for unit tests
- Playwright for E2E tests

**Test Locations**:
- Unit tests: tests/unit/
- E2E tests: tests/e2e/
- Integration tests: tests/integration/

**Configuration Files**:
- vitest.config.ts
- playwright.config.ts

**Run Commands**:
```bash
# Run unit tests
npm test

# Run unit tests once
npm run test:run

# Run E2E tests
npx playwright test
```

## Database
**Type**: PostgreSQL (via Supabase)
**ORM**: Supabase client
**Schema**: Defined in lib/database.types.ts
**Main Tables**:
- users
- vendors
- business_types
- favorites
- live_sessions

## Authentication
**System**: Migrating from Supabase Auth to NextAuth.js
**Providers**:
- Google
- Apple
- Email/Password (Credentials)
**Configuration**: app/api/auth/[...nextauth]/auth.ts

## Internationalization
**Library**: i18next
**Locales Directory**: public/locales
**Implementation**: lib/i18n.ts and components/I18nProvider.tsx