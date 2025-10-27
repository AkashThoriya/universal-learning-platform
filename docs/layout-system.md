# Unified Layout System

## Overview

The Exam Strategy Engine now uses a unified layout system to ensure consistent navigation, styling, and user experience across all pages.

## Components

### `AppLayout`

The main layout wrapper that provides consistent structure for all authenticated pages.

```tsx
import { StandardLayout } from '@/components/layout/AppLayout';

export default function MyPage() {
  return (
    <AuthGuard>
      <StandardLayout>
        <PageContent />
      </StandardLayout>
    </AuthGuard>
  );
}
```

### Pre-configured Layout Variants

#### `StandardLayout`

- **Use for**: Most general pages (dashboard, subjects, syllabus)
- **Background**: Blue gradient
- **Max width**: 7xl
- **Padding**: Standard

#### `AnalyticsLayout`

- **Use for**: Analytics and reporting pages
- **Background**: Purple gradient
- **Max width**: 7xl
- **Padding**: Standard

#### `CompactLayout`

- **Use for**: Detail pages, focused content
- **Background**: Blue gradient
- **Max width**: 5xl
- **Padding**: Standard

#### `WideLayout`

- **Use for**: Complex dashboards, data-heavy interfaces
- **Background**: Blue gradient
- **Max width**: 7xl
- **Padding**: Relaxed

#### `FullWidthLayout`

- **Use for**: Special full-width layouts
- **Background**: Blue gradient
- **Max width**: Full
- **Padding**: Standard

### `PageHeader`

Provides consistent page headers with titles, descriptions, and actions.

```tsx
import { FeaturePageHeader } from '@/components/layout/PageHeader';

<FeaturePageHeader
  title="Page Title"
  description="Page description"
  icon={<SomeIcon className="h-8 w-8" />}
  badge="Feature Badge"
  actions={<SomeActions />}
/>;
```

## Page-by-Page Implementation Status

### ✅ Completed (Consistent Navigation)

- `/dashboard` - Uses Navigation component
- `/syllabus` - Uses Navigation component
- `/subjects` - Uses Navigation component
- `/subjects/[subjectId]` - Uses Navigation component
- `/analytics` - **UPDATED** - Now uses AnalyticsLayout + FeaturePageHeader


### 🔄 In Progress (Need Layout Updates)

- `/journey` - Needs AuthGuard + StandardLayout
- `/log/daily` - Needs AuthGuard + StandardLayout
- `/log/mock` - Needs AuthGuard + CompactLayout
- `/test` - Needs AuthGuard + FullWidthLayout

- `/topic/[topicId]` - Needs CompactLayout
- `/syllabus/[topicId]` - Needs CompactLayout

### 🔒 Authentication Pages (Different Layout)

- `/onboarding/*` - Uses custom onboarding flow
- `/` (landing) - Uses custom landing layout

## Implementation Guidelines

### 1. For New Pages

```tsx
'use client';

import AuthGuard from '@/components/AuthGuard';
import { StandardLayout } from '@/components/layout/AppLayout';
import { SimplePageHeader } from '@/components/layout/PageHeader';

export default function NewPage() {
  return (
    <AuthGuard>
      <StandardLayout>
        <SimplePageHeader title="Page Title" description="Page description" />

        {/* Page content */}
        <div className="space-y-6">{/* Your content here */}</div>
      </StandardLayout>
    </AuthGuard>
  );
}
```

### 2. For Existing Pages (Migration)

**Before:**

```tsx
export default function OldPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-6">
          <h1>Page Title</h1>
          {/* content */}
        </div>
      </div>
    </AuthGuard>
  );
}
```

**After:**

```tsx
import { StandardLayout } from '@/components/layout/AppLayout';
import { SimplePageHeader } from '@/components/layout/PageHeader';

export default function NewPage() {
  return (
    <AuthGuard>
      <StandardLayout>
        <SimplePageHeader title="Page Title" />
        {/* content */}
      </StandardLayout>
    </AuthGuard>
  );
}
```

### 3. Navigation Rules

#### All Authenticated Pages Should Have:

1. `<AuthGuard>` wrapper
2. Appropriate layout component (`StandardLayout`, `AnalyticsLayout`, etc.)
3. `<Navigation />` component (provided by layout)
4. Consistent background and spacing

#### Special Cases:

- **Mission execution pages**: Can hide navigation during active sessions
- **Full-screen experiences**: Use `FullWidthLayout` with `showNavigation={false}`
- **Modal/overlay content**: Don't use layout wrapper

## Benefits

### ✅ User Experience

- Consistent navigation across all pages
- Unified visual design and spacing
- Better responsive behavior
- Improved accessibility

### ✅ Developer Experience

- Standardized layout patterns
- Reduced code duplication
- Easier maintenance
- Clear implementation guidelines

### ✅ Performance

- Consistent CSS classes reduce bundle size
- Optimized responsive breakpoints
- Better tree-shaking

## Next Steps

1. **Phase 1**: Update remaining critical pages (`/journey`, `/test`, `/log/*`)
2. **Phase 2**: Update detail and utility pages
3. **Phase 3**: Create additional layout variants as needed
4. **Phase 4**: Performance optimization and accessibility audit

## Migration Checklist

For each page migration:

- [ ] Import appropriate layout component
- [ ] Wrap content with `AuthGuard` + Layout
- [ ] Replace custom headers with `PageHeader` components
- [ ] Remove custom background/container classes
- [ ] Test responsive behavior
- [ ] Verify navigation functionality
- [ ] Check accessibility compliance
