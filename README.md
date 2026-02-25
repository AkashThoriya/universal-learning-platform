# Universal Learning Platform 🚀

![Version](https://img.shields.io/badge/version-1.0.1-00DC82?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)

> AI-powered adaptive learning platform for competitive goal preparation

---

## Overview

Universal Learning Platform is a comprehensive goal preparation platform that combines **adaptive testing**, **spaced repetition**, and **intelligent analytics** to optimize learning outcomes. Built with Next.js 14+, Firebase, and AI-powered recommendations, it caters to multiple competitive goals, professional certifications, and custom learning paths.

---

## Extensive Feature List

### 🎯 1. Multi-Course Architecture
Prepare for multiple goals (e.g., Tech Certifications, UPSC, SSC, Banking) with complete data isolation.
- **Data Isolation:** Complete separation of progress, analytics, and notes between courses.
- **Course Wizard:** Intelligent setup wizard for adding new learning goals.
- **Seamless Switching:** Switch between active goals without losing context.
- **Custom Learning Paths:** Support for self-defined custom goals alongside predefined tracks.

### 📚 2. Syllabus Management
Comprehensive tracking of what to study.
- **Hierarchical Syllabus:** Organized into Subjects → Topics → Subtopics.
- **Visual Topic Details:** Deep-dive views into specific topics with UI tabs.
- **Dynamic Loading:** Loads syllabus structures dynamically from structured JSON.
- **Topic-wise Progress:** Micro-level tracking of completion rates.
- **Practice Management:** Integrated questioning for specific syllabus nodes.

### 📈 3. Adaptive Testing Engine
Intelligent assessments that adapt to the user's proficiency.
- **CAT Algorithms:** Computerized Adaptive Testing models.
- **IRT Estimation:** Item Response Theory-based ability estimation.
- **Dynamic Difficulty Adjustment:** Modifies real-time question difficulty based on consecutive correct/incorrect answers.
- **Personalized Recommendations:** AI suggests topics to practice based on test performance.

### 📊 4. Advanced Analytics & Dashboards
Data-driven insights to guide preparation strategy.
- **Real-Time Processing:** Analytics processed instantaneously upon action.
- **Performance Trends:** Visual charts depicting score trajectories over time.
- **Weak Area Identification:** Pinpoints subjects requiring immediate attention.
- **Study Pattern Analysis:** Correlates time spent with actual outcome improvements.
- **AI Strategy Insights:** LLM-generated recommendations tailored to individual metrics.

### 🔄 5. Spaced Repetition & Revision
Scientific revision scheduling to defeat the forgetting curve.
- **Automated Scheduling:** Calculates exact optimal dates for topic review.
- **Priority-Based Review:** Ranks revision items by urgency and importance.
- **Forgetting Curve Optimization:** Custom algorithm to strengthen memory retention.

### 🤖 6. Intelligent Onboarding & Persona Detection
Tailored experiences based on user profiles.
- **Persona Detection:** Automatically identifies learning styles (e.g., Night Owl, Weekend Warrior).
- **Smart Scheduling:** Generates recommended study schedules based on personal constraints.
- **Customized Setup:** Dynamically adjusts the initial layout and recommendations based on background info.

### 🏆 7. Habits & Mission System
Gamified elements to ensure consistency.
- **Habit Engine:** Tracks daily consistency and learning streaks.
- **Mission System:** Daily and weekly personalized missions (e.g., "Complete 3 weak topics").
- **Achievements:** Unlockable badges and milestones.
- **Push Notifications:** Reminders and motivational nudges to keep users on track.

### ⚡ 8. Micro-Learning Modules
Bite-sized learning for busy schedules.
- **Short Sessions:** Quick 5-10 minute review blocks.
- **Targeted Practice:** Hyper-focused quizzes on singular concepts.

### 📝 9. Daily Logging & Note-Taking
Comprehensive journaling and material management.
- **Study Session Logs:** Track exact hours and materials covered.
- **Mood & Wellness Tracking:** Correlate mental state with study efficiency.
- **Handwritten Notes:** Direct upload capability for physical notes.
- **Automated Image Compression:** Optimizes uploaded images to save bandwidth and storage.
- **Workspace Integration:** Link notes directly to specific syllabus topics.

### 🧪 10. Mock Test Logging
Simulate and analyze full-length exams.
- **Score Tracking:** Record full-length mock scores.
- **Paper-Wise Analysis:** Break down performance by specific sections.
- **Trend Visualization:** Compare mock scores against the target goal threshold.

### 📱 11. Progressive Web App (PWA) & Offline Support
Native-like experience on web and mobile.
- **Installable:** "Add to Home Screen" functionality with custom install banners.
- **Offline Caching:** Access syllabus and cached notes without internet connectivity.
- **Seamless Syncing:** Background syncs logs when the network is restored.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14+ (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend & Auth**| Firebase (Firestore, Authentication, Storage) |
| **State Mgt** | React Context API, Custom modular Hooks |
| **Analytics** | Custom Node/Edge analytics service |
| **AI Integration**| LLM via Gemini/OpenAI API |
| **PWA** | Custom Service Workers & Manifest |

---

## Project Structure

```text
universal-learning-platform/
├── app/                      # Next.js 14 App router pages
│   ├── dashboard/            # Main dashboard interfaces
│   ├── syllabus/             # Syllabus exploration and progress
│   ├── test/                 # Adaptive testing engine UI
│   ├── review/               # Spaced repetition flows
│   ├── log/                  # Daily & mock logging pages
│   ├── onboarding/           # Persona and setup wizard
│   ├── offline/              # PWA offline fallback
│   └── ...
├── components/               # Highly modular React components
│   ├── analytics/            # Analytics widgets & dashboards
│   ├── dashboard/            # Core dashboard layout elements
│   ├── habits/               # Habit trackers and streak UI
│   ├── onboarding/           # Multi-step setup and persona components
│   ├── syllabus/             # Topic details and syllabus trees
│   ├── workspace/            # Note-taking and file uploads
│   └── ui/                   # Reusable atomic (shadcn) UI components
├── lib/                      # Core business logic
│   ├── ai/                   # LLM integration and prompting
│   ├── algorithms/           # Adaptive testing & recommendation math
│   ├── analytics/            # Real-time analytics processors
│   ├── auth/                 # Authentication wrappers
│   ├── database/             # Abstracted database repositories & factories
│   ├── firebase/             # Pure Firebase connection utilities
│   └── services/             # Top-level service layer
├── contexts/                 # React state contexts (Auth, Course)
├── hooks/                    # Custom React hooks (Form, PWA, Navigation)
├── types/                    # Strict TypeScript definitions
└── scripts/                  # Build and utility scripts
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Active Firebase Project (Auth, Firestore, Storage enabled)

### Installation

```bash
# Clone repository
git clone https://github.com/AkashThoriya/universal-learning-platform.git
cd universal-learning-platform

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in Firebase configuration and LLM API keys

# Run development server
npm run dev
```

### Environment Variables (.env.local)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## Development & Architecture

### Key Architectural Concepts

**1. Course Context (`CourseContext.tsx`)**
All course-scoped data operations strictly use the active course to ensure absolute data isolation.
```typescript
import { useCourse } from '@/contexts/CourseContext';

function SyllabusView() {
  const { activeCourseId } = useCourse();
  // Fetch data cleanly scoped to the active goal's ID
}
```

**2. Factory Repository Pattern**
Database interactions are abstracted via the Service & Repository layers (`lib/database/factory.ts`), allowing potential scalable migration away from Firebase if necessary.

**3. Persona-Aware Logic**
Recommendations and scheduling are not hardcoded. They parse user metadata (e.g., Working Professional vs. Full-time Student) to weight adaptive tests and mission generation dynamically.

### Scripts
```bash
npm run dev       # Start development server
npm run build     # Execute strictly typed production build
npm run lint      # Run ESLint compliance checks
npm run typecheck # Validate TypeScript types across project
```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
