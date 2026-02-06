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

## 8. Final Critical Gap Analysis (Verified 2026-02-06)

We have conducted a deep code audit and identified the following **Critical Gaps** that must be resolved to ensure a 100% robust multi-course architecture.

### 8.1 Critical Architecture Violations

| Severity | Component | Issue Description | Impact |
| :--- | :--- | :--- | :--- |
| 🚨 **CRITICAL** | **Intelligent Analytics Service**<br>`intelligent-analytics-service.ts` | **Global Scope Only.** The entire service (Events, Performance, Predictions) ignores `courseId`. | All "Smart Analytics" will merge data from *all* courses. If a user studies Math and History, the AI will give nonsensical overlapping recommendations. |
| 🚨 **CRITICAL** | **Test Generation**<br>`TestConfigModal.tsx` | **Missing Context.** Creates `TestConfig` objects without `courseId`. | Tests created will be "orphaned" or assigned to a default context, breaking the ability to track test performance per course. |
| 🚨 **CRITICAL** | **Topic Progress Write**<br>`firebase-utils.ts` | **Legacy Writes.** `updateTopicProgress` writes to `users/{uid}/progress/{topicId}` (Global). | Progress is not isolated. Studying "Algebra" in Course A will mark it as done in Course B if topic IDs clash (or just pollute the data structure). |
| 🔴 **HIGH** | **Profile Page**<br>`profile/page.tsx` | **Legacy Read.** Calls `getSyllabus(uid)` without `activeCourseId`. | Profile page will always show the *Default* course's syllabus stats, ignoring the currently active course switcher. |
| 🔴 **HIGH** | **Subtopic Page**<br>`syllabus/[id]/[index]` | **Legacy Read.** Calls `getSyllabus(uid)` without `activeCourseId`. | Deep-linking to a subtopic might load the wrong course context or fail if the default course doesn't have that topic. |
| 🟡 **MEDIUM** | **Global Progress Read**<br>`firebase-utils.ts` | **Legacy Read.** `getAllProgress(uid)` is used in 5+ files. | Fetches *all* global progress. Inefficient and potentially incorrect calculations for "Course Completion %". |

### 8.2 Comprehensive Feature Map & Status

#### 1. Core Platform
*   **Authentication**: ✅ Ready
*   **Context System**: ✅ `CourseContext` implemented.
*   **Navigation**: ✅ `CourseSwitcher` implemented.

#### 2. Dashboard Engine
*   **Adaptive Dashboard**: ✅ Updated to pass `activeCourseId`.
*   **Learning Analytics**: ⚠️ **Partial**. UI passes ID, but underlying service (`IntelligentAnalytics`) ignores it.
    *   *Sub-feature: Weak Area Detection* -> ❌ Global Scope.
    *   *Sub-feature: Study Trends* -> ❌ Global Scope.

#### 3. Learning Engine
*   **Syllabus Browser**: ✅ Updated.
*   **Topic View**: ✅ Updated.
*   **Subtopic/Content View**: ❌ **Broken** (Missing courseId).
*   **Progress Tracking**: ❌ **Broken** (Writes to legacy global path).
*   **Notes System**: ⚠️ **Partial** (Reads correctly, but storage might be ambiguous).

#### 4. Testing Engine
*   **Test Configuration**: ❌ **Broken** (Missing `courseId` in config).
*   **Test Taking**: ✅ Service updated (`adaptive-testing-service`).
*   **Results Processing**: ⚠️ **Risk** (Depends on `createTest` passing metadata).

#### 5. User Profile
*   **Stats View**: ❌ **Broken** (Legacy reads).
*   **Settings**: ✅ Generic.

---

## 9. Immediate Remediation Plan (Phase 7)

To reach the "Top-Notch" goal, we must execute the following fixes immediately:

1.  **Fix Writes (Data Layer)**:
    *   Update `updateTopicProgress` to accept `courseId`.
    *   Write to `users/{uid}/courses/{courseId}/progress/{topicId}`.

2.  **Fix Reads (Data Layer)**:
    *   Update `getAllProgress` to accept `courseId` and read from the new path.
    *   *Migration:* We will strictly use the new path for active courses.

3.  **Refactor Intelligent Analytics**:
    *   Add `courseId` to `AnalyticsEvent` interface.
    *   Update `trackEvent` to require `courseId` (or infer from context).
    *   Update `getPerformanceAnalytics` to filter by `courseId`.

4.  **Fix UI Gaps**:
    *   `Profile/page.tsx`: Pass `activeCourseId`.
    *   `Subtopic/page.tsx`: Pass `activeCourseId`.
    *   `TestConfigModal.tsx`: Inject `activeCourseId` into `TestConfig`.

---

## 10. Conclusion

The "Surface" (UI) is 80% complete, but the "Brain" (Analytics & Data Writes) is still 40% legacy. **Phase 7 is critical** to prevent data corruption when users actually start using multiple courses.

