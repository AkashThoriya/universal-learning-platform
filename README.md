# Exam Strategy Engine

![Version](https://img.shields.io/badge/version-1.0.8-00DC82?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)

> AI-powered adaptive learning platform for competitive exam preparation

---

## Overview

Exam Strategy Engine is a comprehensive exam preparation platform that combines **adaptive testing**, **spaced repetition**, and **intelligent analytics** to optimize learning outcomes. Built with Next.js 14+, Firebase, and AI-powered recommendations.

---

## Features

### 🎯 Multi-Course Architecture
Prepare for multiple exams (UPSC, SSC, Banking) with complete data isolation between courses.
- Switch between courses seamlessly
- Course-scoped syllabus, progress, and analytics

### 📚 Syllabus Management
- Hierarchical syllabus: Subjects → Topics → Subtopics
- Dynamic syllabus loading from JSON
- Topic-wise progress tracking
- Practice question management

### 📈 Adaptive Testing
- AI-powered question selection using CAT algorithms
- IRT-based ability estimation
- Dynamic difficulty adjustment
- Personalized test recommendations

### 📊 Analytics Dashboard
- Performance trends and visualizations
- Weak area identification
- Study pattern analysis
- AI-generated improvement recommendations

### 🔄 Spaced Repetition
- Automatic revision scheduling
- Priority-based topic revision
- Forgetting curve optimization

### 📝 Daily Logging
- Study session tracking
- Mood and wellness monitoring
- Streak maintenance
- Progress journaling

### 🧪 Mock Test Logging
- Full-length test score tracking
- Paper-wise performance analysis
- Score trend visualization

### ✏️ Notes & Revision
- Handwritten notes upload
- Image compression and optimization
- Subject/topic linked notes

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Firebase (Firestore, Auth, Storage) |
| State | React Context, Custom Hooks |
| Analytics | Custom analytics service |
| AI | Integrated LLM service for recommendations |

---

## Project Structure

```
exam-strategy-engine/
├── app/                      # Next.js app router pages
│   ├── dashboard/            # Main dashboard
│   ├── syllabus/             # Syllabus management
│   ├── test/                 # Adaptive testing
│   ├── review/               # Spaced repetition
│   ├── log/                  # Daily & mock logging
│   └── ...
├── components/               # Reusable UI components
│   ├── analytics/            # Analytics widgets
│   ├── dashboard/            # Dashboard components
│   ├── syllabus/             # Syllabus components
│   └── ui/                   # shadcn/ui components
├── lib/                      # Core libraries
│   ├── firebase/             # Firebase utilities
│   ├── services/             # Business logic services
│   ├── analytics/            # Analytics engine
│   ├── algorithms/           # Adaptive testing algorithms
│   └── ai/                   # AI/LLM integration
├── contexts/                 # React contexts
│   ├── AuthContext.tsx       # Authentication state
│   └── CourseContext.tsx     # Active course state
├── types/                    # TypeScript definitions
└── docs/                     # Documentation
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project

### Installation

```bash
# Clone repository
git clone <repository-url>
cd exam-strategy-engine

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in Firebase configuration

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Multi-Course Architecture](./docs/MULTI_COURSE_ARCHITECTURE.md) | Complete technical docs for multi-course data isolation |
| [Audit Report](./docs/multi_course_architecture_audit.md) | Architecture audit findings and fixes |

---

## Key Concepts

### Course Context
All course-scoped data operations use the active course from `CourseContext`:

```typescript
import { useCourse } from '@/contexts/CourseContext';

function MyComponent() {
  const { activeCourseId } = useCourse();
  
  // Use activeCourseId in data operations
  const data = await getSyllabus(userId, activeCourseId);
}
```

### Data Isolation
- **Course-scoped**: Syllabus, progress, tests, mock tests
- **User-scoped**: Daily logs, achievements, workspace notes

---

## Development

### Build

```bash
npm run build    # Production build
npm run dev      # Development server
npm run lint     # ESLint check
```

### Code Quality

- TypeScript strict mode with `exactOptionalPropertyTypes`
- ESLint + Prettier configuration
- Component-level error boundaries

---

## License

Private - All rights reserved
