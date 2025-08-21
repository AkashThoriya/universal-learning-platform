# Exam Strategy Engine - Universal Exam Preparation Platform

## Project Overview

**Vision**: A strategic operating system for competitive exam preparation that transforms unstructured studying into a data-driven, adaptive process using spaced repetition, precision analytics, and health-aware scheduling.

The Exam Strategy Engine is **exam-agnostic**, making it powerful for any competitive test including IBPS, UPSC, GPSC, SSC, GATE, CAT, NEET, and more.

## Core Philosophy

This platform is built on three universal pillars:

### 1. Strategic Precision
Forces focus on high-yield areas through a user-defined tier system, preventing wasted effort on low-value topics.

### 2. Adaptive Resilience
Uses a feedback loop of mock test analysis and health tracking to constantly refine the study plan and prevent burnout.

### 3. Contextual Mastery
Moves beyond rote memorization by requiring users to create personal connections for each topic, mirroring contextual learning principles.

## Technology Stack

- **Next.js 15** (App Router) - Latest React features with stable routing
- **TypeScript** - Type safety and comprehensive documentation
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Auth** - Authentication with email/password and Google sign-in
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Recharts** - Data visualization and charts
- **Lucide React** - Beautiful icons

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exam-strategy-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication (Email/Password and Google)
   - Get your Firebase config

4. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your Firebase configuration in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Firebase Setup Guide

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Follow the setup wizard

### 2. Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select your preferred location

### 3. Enable Authentication
1. Go to "Authentication" in the Firebase console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Enable "Google" (optional)

### 4. Configure Security Rules
Replace the default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to subcollections
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Public read access to exams collection
    match /exams/{examId} {
      allow read: if true;
      allow write: if false; // Only admins should write to exams
    }
  }
}
```

## Project Structure

```
exam-strategy-engine/
├── app/                          # Next.js App Router pages
│   ├── dashboard/               # Main dashboard
│   ├── log/                     # Daily and mock test logging
│   ├── onboarding/              # User onboarding flow
│   ├── syllabus/                # Syllabus management
│   └── layout.tsx               # Root layout
├── components/                   # Reusable React components
│   ├── ui/                      # shadcn/ui components
│   └── [feature-components]/    # Feature-specific components
├── contexts/                     # React contexts
├── lib/                         # Utility functions and configurations
├── types/                       # TypeScript type definitions
└── public/                      # Static assets
```

## Core Features

### 1. Universal Onboarding (`/onboarding`)
- **Exam Selection**: Choose from pre-defined exams or create custom
- **Syllabus Builder**: Interactive tree-view for organizing topics
- **Tier Assignment**: Strategic prioritization system (Tier 1, 2, 3)
- **Resource Management**: Track books, courses, and test series

### 2. Strategic Dashboard (`/dashboard`)
- **Revision Queue**: Smart spaced repetition system
- **Performance Analytics**: Score trends and health correlations
- **Daily Command Center**: Quick actions and status overview
- **Intelligent Recommendations**: AI-powered study suggestions

### 3. Daily Logging (`/log/daily`)
- **Health Tracking**: Energy, sleep hours, and sleep quality
- **Study Time Logging**: Topic-wise time tracking
- **Progress Updates**: Automatic mastery score calculations
- **Streak Tracking**: Gamified consistency monitoring

### 4. Mock Test Analysis (`/log/mock`)
- **Comprehensive Score Logging**: Multi-section test support
- **Error Analysis Engine**: Categorize mistakes for targeted improvement
- **Performance Trends**: Track improvement over time
- **Strategic Insights**: Convert scores into actionable study plans

### 5. Topic Deep Dive (`/syllabus/[topicId]`)
- **Personal Context Editor**: Create meaningful connections
- **Rich Note Taking**: Multi-media note support
- **Spaced Repetition**: Intelligent revision scheduling
- **Mastery Tracking**: Visual progress indicators

### 6. Syllabus Overview (`/syllabus`)
- **Strategic Landscape View**: Complete preparation overview
- **Advanced Filtering**: Multi-criteria topic filtering
- **Bulk Operations**: Efficient syllabus management
- **Progress Visualization**: Subject and topic-level insights

## Data Architecture

The application uses Firebase Firestore with the following structure:

### Collections

1. **`exams`** - Pre-populated exam definitions
2. **`users`** - User profiles and settings
3. **`users/{userId}/syllabus`** - Personalized curriculum
4. **`users/{userId}/progress`** - Topic mastery tracking
5. **`users/{userId}/logs_daily`** - Daily study and health logs
6. **`users/{userId}/logs_mocks`** - Mock test results and analysis

### Key Data Models

```typescript
interface User {
  userId: string;
  email: string;
  currentExam: {
    id: string;
    targetDate: Timestamp;
  };
  settings: {
    revisionIntervals: number[];
    dailyStudyGoalMinutes: number;
    tierDefinition: Record<1 | 2 | 3, string>;
  };
}

interface TopicProgress {
  id: string;
  masteryScore: number;
  lastRevised: Timestamp;
  nextRevision: Timestamp;
  revisionCount: number;
  userNotes: string;
  personalContext: string;
}
```

## Development Workflow

### Running the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing component structure
- Use Tailwind CSS for styling
- Implement proper error boundaries
- Add loading states for async operations
- Write meaningful commit messages

### Adding New Features

1. **Create Types**: Define TypeScript interfaces in `types/`
2. **Build Components**: Create reusable components in `components/`
3. **Implement Pages**: Add pages in the `app/` directory
4. **Add Database Logic**: Implement Firestore operations
5. **Test Thoroughly**: Test on multiple devices and browsers

## Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables**
   - Go to your Vercel dashboard
   - Add all Firebase environment variables
   - Redeploy if necessary

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## Environment Variables

Required environment variables for the application:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional: Firebase Analytics
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## API Documentation

### Firebase Collections

#### Users Collection (`/users/{userId}`)
- **Purpose**: Store user profile and settings
- **Security**: User can only access their own document
- **Key Fields**: `email`, `currentExam`, `settings`, `onboardingComplete`

#### Syllabus Subcollection (`/users/{userId}/syllabus/{subjectId}`)
- **Purpose**: Store user's personalized curriculum
- **Key Fields**: `name`, `tier`, `topics[]`
- **Operations**: CRUD operations for syllabus management

#### Progress Subcollection (`/users/{userId}/progress/{topicId}`)
- **Purpose**: Track mastery and revision state for each topic
- **Key Fields**: `masteryScore`, `nextRevision`, `userNotes`, `personalContext`
- **Operations**: Update on study sessions and revisions

#### Daily Logs Subcollection (`/users/{userId}/logs_daily/{date}`)
- **Purpose**: Store daily health and study data
- **Key Fields**: `health`, `studiedTopics[]`, `note`
- **Operations**: Create/update daily entries

#### Mock Test Logs Subcollection (`/users/{userId}/logs_mocks/{testId}`)
- **Purpose**: Store mock test results and analysis
- **Key Fields**: `scores`, `analysis`, `platform`, `stage`
- **Operations**: Create new test entries, read for analytics

## Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify environment variables are correct
   - Check Firebase project settings
   - Ensure Firestore is enabled

2. **Authentication Problems**
   - Verify Auth providers are enabled
   - Check domain authorization in Firebase
   - Clear browser cache and cookies

3. **Build Errors**
   - Run `npm run type-check` to identify TypeScript issues
   - Ensure all dependencies are installed
   - Check for missing environment variables

4. **Performance Issues**
   - Implement proper loading states
   - Use React.memo for expensive components
   - Optimize Firestore queries with indexes

### Getting Help

- Check the [Issues](link-to-issues) page for known problems
- Review Firebase documentation for database issues
- Check Next.js documentation for routing problems

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for all new code
- Include proper error handling
- Write meaningful commit messages
- Test your changes thoroughly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- Backend by [Firebase](https://firebase.google.com/)

---

**Happy Studying! 🚀**

Transform your exam preparation from chaotic to strategic with the Exam Strategy Engine.