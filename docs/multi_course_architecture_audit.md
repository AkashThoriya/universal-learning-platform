# Technical Specification: Multi-Course & Dynamic Context Architecture

**Version:** 2.0 (Deep Technical Breakdown)
**Date:** 2026-02-05
**Status:** Approved for Implementation Phase

---

## 1. Executive Summary

This document defines the exact technical requirements to transition the platform from a **Single-Context** (User = 1 Exam) to a **Dynamic-Context** (User = N Courses) architecture.

**Core Principle:**
All data fetch operations must shift from `getUserData(uid)` to `getCourseData(uid, courseId)`. The UI must introduce a "Workspace Switcher" to toggle the `courseId` context.

---

## 2. Database Schema Specifications

### A. User Profile (`users/{uid}`)

**Status:** Modification Required
**Impact:** Low (Additive)

| Field | Current Type | Target Type | Notes |
|-------|--------------|-------------|-------|
| `primaryCourseId` | `string` | `string` | Remains as the "Default" course on login. |
| `activeCourses` | *Missing* | `CourseMeta[]` | **NEW**: Lightweight metadata for the switcher (id, name, icon). |

**JSON Structure (Future):**
```json
{
  "userId": "user_123",
  "displayName": "Akash",
  "primaryCourseId": "upsc_2026",
  "activeCourses": [
    { "id": "upsc_2026", "name": "UPSC CSE 2026", "icon": "🏛️" },
    { "id": "python_basics", "name": "Python 101", "icon": "🐍" }
  ],
  "preferences": { ... }
}
```

### B. Course Progress (`users/{uid}/progress/{courseId}`)

**Status:** NEW DOCUMENT (Critical)
**Impact:** High (Replaces `progress/unified`)

Currently, progress is mixed in `progress/unified`. We will shard this into individual documents per course.

**Path:** `users/{uid}/progress/{courseId}` (e.g., `users/user_123/progress/upsc_2026`)

**JSON Structure:**
```json
{
  "courseId": "upsc_2026",
  "trackType": "exam", // or "skill", "custom"
  "lastAccessedAt": Timestamp,
  
  // Track-Specific Stats (Moved from 'unified.trackProgress')
  "stats": {
    "missionsCompleted": 15,
    "totalTimeInvested": 3600, // seconds
    "averageScore": 85.5,
    "proficiencyLevel": "intermediate",
    "masteryScore": 72
  },

  // Topic Breakdown (Moved from 'unified.trackProgress.topicBreakdown')
  "topics": {
    "modern_history": {
      "status": "in_progress",
      "mastery": 60,
      "questionsAttempted": 50
    }
  }
}
```

### C. Global Stats (`users/{uid}/stats/global`)

**Status:** NEW DOCUMENT
**Impact:** High (Aggregator)

Since `progress` is now split, we need a separate doc for the User Profile "Lifetime Stats".

**Path:** `users/{uid}/stats/global`

**JSON Structure:**
```json
{
  "totalLifetimeMissions": 45,
  "totalLifetimeMinutes": 12000,
  "longestStreak": 14,
  "currentStreak": 3,
  "lastActiveDate": "2026-02-05"
}
```

---

## 3. Component & File Impact Analysis

This section lists **every file** that requires modification.

### A. Type Definitions (`types/*.ts`)

1.  **`types/exam.ts`**
    *   **Action:** Update `User` interface.
    *   **Change:** Add `activeCourses: { id: string; name: string; icon?: string }[];`.

2.  **`types/mission-system.ts`**
    *   **Action:** Deprecate `UnifiedProgress`.
    *   **Change:** Create `CourseProgress` interface (defined above).
    *   **Change:** Create `GlobalStats` interface.
    *   **Change:** Update `Mission` interface to include `courseId: string;`.

### B. Service Layer (`lib/services/*.ts`)

1.  **`progress-service.ts`**
    *   **`getUserProgress(uid)`**:
        *   *New Behavior:* Fetch `users/{uid}/stats/global` (for streak/profile).
    *   **`getCourseProgress(uid, courseId)` (NEW)**:
        *   *Logic:* Fetch `users/{uid}/progress/{courseId}`.
        *   *Fallback:* If doc missing, initialize empty progress for that course.
    *   **`updateProgress(uid, missionResult)`**:
        *   *Change:* Signature becomes `updateProgress(uid, courseId, missionResult)`.
        *   *Logic:* Update ONLY the specific course doc + increment global stats doc.

2.  **`firebase-utils.ts`**
    *   **`getSyllabus(uid, courseId)`**:
        *   *Verification:* Already supports `courseId`.
        *   *Action:* Ensure all callers pass `courseId` from Context, not just `undefined`.

3.  **`adaptive-testing-service.ts`**
    *   **`createTest(uid, config)`**:
        *   *Change:* Add `courseId` to `TestConfig`.
        *   *Storage:* Save test with `courseId` metadata so results credit the correct course.

4.  **`universal-learning-analytics.ts`**
    *   **`getUnifiedProgress(uid)`**:
        *   *Change:* Rename to `getCourseAnalytics(uid, courseId)`.
        *   *Logic:* Filter `missions` query by `courseId` to prevent mixing data from different courses.
    *   **`getExamProgress(uid)`**:
        *   *Change:* Add `where('courseId', '==', courseId)` to Firestore queries.

### C. UI Components (`components/**/*.tsx`)

1.  **`CourseContext.tsx` (NEW)**
    *   **Responsibility:** Holds `activeCourseId` state. Persists to localStorage.
    *   **API:** `useCourse() => { activeCourseId, switchCourse, courseList }`.

2.  **`components/Navigation.tsx`**
    *   **Action:** Add **Course Switcher Dropdown** in the header/sidebar.
    *   **Logic:** `map(user.activeCourses)` -> `DropdownItem`. OnClick -> `switchCourse(id)`.

3.  **`components/dashboard/AdaptiveDashboard.tsx`**
    *   **Action:** Remove `primaryCourseId` assumption.
    *   **Change:** Use `const { activeCourseId } = useCourse()`.
    *   **Fetch:** call `getCourseProgress(uid, activeCourseId)`.

4.  **`app/(routes)/syllabus/page.tsx`**
    *   **Action:** Update Data Fetching.
    *   **Change:** `getSyllabus(uid, activeCourseId)`.

---

## 4. Migration Strategy (Test Phase)

Since we are pre-launch, we will use a **"Clean Break"** strategy for simplicity and robustness.

### Step 1: Data Reset (we already finished this)
*   Wipe `users/{uid}/progress` collection.
*   Wipe `users/{uid}/courses` collection.
*   *Why?* Mapping legacy "unified" data to split "course" data is complex and error-prone. Starting fresh ensures data integrity for the beta testing.

### Step 2: Onboarding Updates
*   **Verification:** `onboarding/setup/page.tsx` *already* writes to `saveSyllabusForCourse`.
*   **Action:** Ensure it also initializes:
    1.  `users/{uid}/progress/{courseId}` (Empty Doc).
    2.  `users/{uid}/stats/global` (Empty Doc).
    3.  `user.activeCourses = [courseId]`.

### Step 3: Deployment Order
1.  **Code**: Merge Type/Schema changes.
2.  **Code**: Merge Service Layer refactors.
3.  **UI**: Merge `CourseContext` + Dashboard updates.
4.  **Data**: Admin wipes legacy progress collection (or simply ignores it).

---

## 6. UI & UX Workflows

This section details the user interaction flows for managing multiple courses.

### 6.1 Global Context Switcher
**Location:** Top-Left Navigation (Desktop), Top Header (Mobile).
**Current State:** Displays `MotivationalRotator` ("Focus on progress ⚡").
**New State:** A `CourseSwitcher` dropdown.

*   **Default View:** Shows the name of the *Active Course* (e.g., "UPSC CSE 2026").
*   **Dropdown Menu:**
    *   List of enrolled courses (e.g., "Python for Data Science", "Guitar Basics").
    *   **"Add New Course"** button at the bottom.
*   **Behavior:**
    *   Clicking a course instantly updates `CourseContext.activeCourseId`.
    *   Triggers a data refresh on the current page (Dashboard, Syllabus, etc.).
    *   Persists selection to `localStorage` and `users/{uid}/primaryCourseId`.

### 6.2 "Add Course" Workflow
The onboarding flow's exam selection logic (`BasicInfoStep`) is robust. We will refactor it.

*   **Refactor:** Extract the exam search/filter grid from `BasicInfoStep.tsx` into a reusable `<CourseSelector onSelect={...} />` component.
*   **New Component:** `<AddCourseDialog />`
    *   **Trigger:** From Global Switcher or Profile Page.
    *   **Step 1:** Show `<CourseSelector />`. User picks an exam or "Custom".
    *   **Step 2:** Simple configuration (Target Date).
    *   **Step 3:** Save.
        *   Adds `courseId` to `user.activeCourses`.
        *   Initializes `users/{uid}/progress/{courseId}`.
        *   Switches context to the new course immediately.

### 6.3 Profile Management (Courses Tab)
**Location:** `/profile` -> New "Courses" Tab.

*   **Interface:** A grid or list of cards for all enrolled courses.
*   **Card Details:** Name, Target Date, Checkbox for "Primary", Status Badge (Active/Paused).
*   **Actions (Three-Dot Menu per card):**
    *   **Set as Primary:** Makes it the default on login.
    *   **Pause Course:** Hides it from the Switcher (moves to "Inactive" section).
    *   **Delete Course:** Dangerous action. Wipes `users/{uid}/progress/{courseId}` and removes from `activeCourses`.

## 7. Deep Analysis: Performance & Best Practices

To ensure "Top-Notch Performance", we will implement:

### 7.1 Smart Caching Strategy
*   **Problem:** Switching courses could trigger full re-fetches of Syllabus, Progress, and Analytics, causing layout shift.
*   **Solution:** Implement `CourseCache` in `firebase-utils.ts` and `local-storage`.
    *   **Memory Layer:** `Map<courseId, { data, timestamp }>` (TTL 5 mins).
    *   **Disk Layer:** Use **`idb-keyval`** (already installed) to cache the *Entire Syllabus* object.
    *   **Optimistic UI:** Switcher transitions *instantly* (using metadata from `user.activeCourses`) while data re-validates in background. Uses **`framer-motion`** for smooth dropdown animations.

### 7.2 Edge Case Handling
*   **Zero Courses:** If `user.activeCourses` is empty -> Redirect to `/onboarding/setup`.
*   **Offline Mode:** If network fails, `CourseContext` MUST load the active syllabus from `idb-keyval` to allow continued study.
*   **Concurrent Switches:** Debounce the "Switch" action by 500ms.

---

## 9. Firebase Configuration Code

To support the new schema, we must update the Firebase config files.

### 9.1 `firestore.rules`
We must explicitly allow access to the new subcollections.

```javascript
match /users/{userId} {
  allow read, write: if isOwner(userId);

  // New Course Progress Collection
  match /progress/{courseId} {
    allow read, write: if isOwner(userId);
  }
  
  // New Global Stats
  match /stats/global {
    allow read, write: if isOwner(userId);
  }

  // ... existing wildcards ...
}
```

### 9.2 `firestore.indexes.json`
We need composite indexes for querying Missions by Course.

```json
{
  "collectionGroup": "missions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "courseId", "order": "ASCENDING" },
    { "fieldPath": "scheduledAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "missions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "courseId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

---

---

## 8. Detailed Gap Analysis & Remediation Matrix

We have audited all features to ensuring "200% certainty" of compatibility.

### 8.1 Feature-by-Feature Gap Matrix

| Feature / Component | Critical Dependency | Current Status | The Gap (What breaks?) | Remediation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Strategy Command Center**<br>`app/strategy/page.tsx` | `getAllProgress(uid)` | ❌ **Incompatible** | Calculates velocity/mastery using *all* progress data. Will mix history stats with math stats. | **Refactor:** Inject `activeCourseId` into `getAllProgress`. implementing course-specific velocity metrics. |
| **Adaptive Dashboard**<br>`SimpleAdaptiveDashboard.tsx` | `getSyllabus(uid)` | ❌ **Incompatible** | Displays "Next Topic" from *any* enrolled exam. User might see a Python topic while studying History. | **Refactor:** Subscribe to `CourseContext`. Pass `courseId` to all sub-components. |
| **Concept Review**<br>`app/review/page.tsx` | `getSyllabus(uid)` | ❌ **Incompatible** | Fetches the default exam's syllabus. If user switches course, this page will still show the old syllabus or crash. | **Update:** Change data fetching to `getSyllabus(uid, activeCourseId)`. Filter flagged items by course. |
| **Notes & Revision**<br>`app/notes-revision/page.tsx` | `getTopicNotes` | ⚠️ **Partial** | Notes are linked to `topicId`. If Topic IDs are unique (UUIDs), it works. If generic ("intro"), notes will leak across courses. | **Verify:** Ensure `topicId` is unique. **Update:** Fetch syllabus via context to group notes correctly under the active course. |
| **Quick Session Launcher**<br>`QuickSessionLauncher.tsx` | `getRecs(uid)` | ⚠️ **Partial** | Recommendation engine (`simple-learning-rec`) scans global progress. May recommend irrelevant topics. | **Update Service:** Update `simple-learning-recommendations.ts` to accept `courseId` and filter candidates. |
| **Adaptive Testing**<br>`adaptive-testing-service.ts` | `createTest` | ⚠️ **Partial** | Tests created without `courseId` will not contribute to the specific course's progress/analytics. | **Update:** Add `courseId` to `TestConfig`. Store it in Firestore `adaptive-tests` collection. |
| **Profile Settings**<br>`app/profile/page.tsx` | `user.currentExam` | ⚠️ **Partial** | UI assumes 1 active exam. "Selected Courses" logic exists but needs to align with `activeCourses` array. | **UI Polish:** Add "Courses" tab to manage existing enrollments. Update save logic to write to `activeCourses` metadata. |
| **Offline Sync**<br>`firebase-utils.ts` | `idb-keyval` | ⚠️ **Partial** | Currently might cache only the default syllabus. | **Update:** Cache key must be `syllabus_{courseId}` instead of just `syllabus`. |

### 8.2 Database Structure Gaps
| Collection | Issue | Fix |
| :--- | :--- | :--- |
| `users/{uid}/progress` (Root) | Legacy location. Mixed data. | **Deprecate.** Move to `users/{uid}/progress/{courseId}`. |
| `users/{uid}/syllabus` | Assumes single syllabus. | **Deprecate.** Move to `users/{uid}/courses/{courseId}/syllabus`. |

### 8.3 Service Layer Gaps
*   **`intelligent-analytics-service.ts`:** `getWeeklyStats` aggregates everything. Needs to filter `missions` by `courseId`.
*   **`universal-learning-analytics.ts`:** `getExamProgress` manually filters missions by string comparison. **Critical:** It acts globally. Must be refactored to query `where('courseId', '==', activeCourseId)`.

### 8.4 Hidden Dependencies & Data Fragmentation (Critical)
*   **`TopicPage.tsx` Discrepancy:** The `TopicPage` (lines 102, 165) reads/writes directly to `users/{uid}/userProgress`. However, `firebase-utils` uses `users/{uid}/progress`.
    *   **Implication:** We have fragmented data. The migration script must merge *both* `progress` and `userProgress` collections into the new `courses/{id}/progress` structure.
    *   **Fix:** Refactor `TopicPage` to use `getCourseProgress()` utility instead of direct Firestore calls.
*   **`TestConfigModal.tsx`:** Fetches global syllabus (`getSyllabus(uid)`).
    *   **Fix:** Must receive `activeCourse` from props or context to pass to `getSyllabus`.
*   **`LearningAnalyticsDashboard.tsx`:** Calls `getUnifiedProgress` which mixes all courses.
    *   **Fix:** Rename to `getCourseAnalytics(uid, courseId)` and enforce strict filtering.

---

## 10. Summary of Deliverables

To complete this migration, we will generate:
1.  `lib/contexts/CourseContext.tsx`
2.  `types/course-progress.ts`
3.  Refactored `ProgressService` class.
4.  Updated `AdaptiveDashboard` component.
5.  Updated `Navigation` component with Switcher.
6.  `components/courses/CourseSwitcher.tsx`
7.  `components/courses/AddCourseDialog.tsx`
8.  `app/(routes)/profile/CoursesTab.tsx`
9.  **Refactor `TopicPage.tsx`** (Standardize data access).
10. **Refactor `TestConfigModal.tsx`** (Inject Course Context).
11. Updated `firestore.rules` & `firestore.indexes.json`.

This specification provides the exact blueprint for the implementation phase.
