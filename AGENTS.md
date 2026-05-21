# Frontend Parking - AI Agent Customization Guide

## Project Overview
Frontend Parking is a React-based frontend project with a component-driven architecture. This guide helps AI agents maintain clean, compact folder organization while the project grows.

## Folder Structure Philosophy: Compact Organization

This project follows a **compact folder strategy** to keep code organized and discoverable as the project scales.

### Core Structure
```
src/
├── pages/           # Page-level components (full screens/routes)
├── components/      # Reusable UI components
│   └── assets/      # Component-specific assets (icons, images, styles)
├── hooks/           # Custom React hooks (shared logic)
├── utils/           # Utility functions and helpers
├── styles/          # Global styles and theme
└── types/           # TypeScript types/interfaces (if using TS)
```

## Compact Folder Conventions

### 1. **Component Organization**
- **Keep component folders flat** within `src/components/`
- **Co-locate related files**: Each component gets its own folder with `.jsx/.tsx`, styles, and types
- **One component per folder** unless tightly coupled
- **Avoid deep nesting** - max 2-3 levels deep

```
components/
├── Button/
│   ├── Button.jsx
│   ├── Button.module.css
│   └── Button.test.jsx
├── Card/
│   ├── Card.jsx
│   ├── Card.module.css
│   └── useCardLogic.js
└── Header/
    ├── Header.jsx
    ├── Header.module.css
    └── types.js
```

### 2. **Asset Management**
- **Store shared assets in** `src/components/assets/`
- **Asset categories**: `icons/`, `images/`, `fonts/`
- **Component-specific assets**: Keep in component folders if only used there
- **Avoid asset duplication** - reuse shared icons and images

```
assets/
├── icons/          # SVG or icon files used across components
├── images/         # Shared images, backgrounds
└── fonts/          # Custom fonts (if any)
```

### 3. **Import Path Simplicity**
- **Use relative imports within same level** (`./Button`)
- **Use alias imports for deep trees** (if configured: `@/components`, `@/utils`)
- **Keep import depth <= 3 levels** to avoid confusion

### 4. **Scaling Guidelines**
- **Group by domain** only if `components/` exceeds 15 items:
  - ❌ Avoid: `components/forms/Button/`, `components/forms/Input/`
  - ✅ Prefer: `components/Button/`, `components/Input/` (flat until too large)

- **Move hooks to** `src/hooks/` if they're reused across components
- **Move utilities to** `src/utils/` if they have no UI dependencies

## Code Conventions

### Component Naming
- **PascalCase** for component files: `Button.jsx`, `CardHeader.jsx`
- **camelCase** for utilities and hooks: `useForm.js`, `formatDate.js`
- **CONSTANT_CASE** for constants: `API_ENDPOINTS.js`, `COLORS.js`

### File Organization Within Components
```
ComponentName/
├── ComponentName.jsx        # Main component
├── ComponentName.module.css # Scoped styles (or use CSS-in-JS)
├── useComponentLogic.js     # Component-specific hook (if needed)
├── types.js                 # TypeScript interfaces/types
└── ComponentName.test.jsx   # Tests co-located with component
```

### Import Organization
```javascript
// External libraries first
import React from 'react';
import { useState } from 'react';

// Internal imports
import Button from '@/components/Button';
import { useForm } from '@/hooks';

// Styles last
import styles from './Component.module.css';
```

## AI Agent Guidelines

When working in this project:

1. **Keep folders compact** - resist creating nested subfolders unless there's a clear domain boundary
2. **Co-locate assets** with components that use them (unless shared)
3. **Extract reusable logic** to `hooks/` or `utils/` when used in 2+ places
4. **Maintain consistent naming** - follow the conventions above
5. **Check for duplicates** before adding new assets - reuse shared icons/images
6. **Limit folder depth** - if navigating > 3 levels, consider restructuring

## Performance & Maintainability

- **Avoid barrel exports** (`index.js` re-exports) in component folders - import directly
- **Use CSS modules** or CSS-in-JS for component scoping to prevent style conflicts
- **Keep component files < 200 lines** - split into smaller components if needed
- **Document complex components** with JSDoc comments

## Next Steps for AI Agents

When extending this project:
- Confirm folder structure matches conventions above
- Suggest component extraction if files exceed 200 lines
- Identify opportunities to move duplicate assets to `assets/`
- Recommend hook extraction for shared component logic
