# Database Schema

Unified Firestore schema for the Exam Strategy Engine (Phase 4 Consolidated).

## Core Collections

### `users`

User profiles and settings.

- **Path**: `users/{userId}`
- **Security**: Owner-only read/write.

### `missions` (Unified)

consolidated collection for all task and goal tracking.

- **Path**: `users/{userId}/missions/{missionId}`
- **Fields**:
  - `status`: `'template' | 'draft' | 'active' | 'in_progress' | 'completed' | 'archived'` (Lifecycle)
  - `type`: `'daily' | 'exam_prep' | 'custom'`
  - `priority`: `'high' | 'medium' | 'low'`
  - `deadline`: Timestamp
  - `progress`: { metrics }
- **Indexes**: Composite indexes on `status`, `deadline`, and `priority`.

### `syllabus` (Course-Scoped)

Strategic curriculum storage.

- **Path**: `users/{userId}/courses/{courseId}/syllabus/{subjectId}`
- **Access Pattern**: Auto-resolved via `getSyllabus(userId, courseId?)`.
- **Fields**:
  - `topics`: Array of topic objects containing:
    - `id`: Topic ID
    - `status`: Completion status
    - `mastery`: 0-100 score
    - `revisionDue`: Timestamp (Spaced repetition)

### `adaptiveTests`

AI-generated adaptive test sessions.

- **Path**: `adaptiveTests/{testId}`
- **Security**: Strict `userId` ownership check.
- **Fields**:
  - `userId`: Owner
  - `config`: { subjects, difficulty, questionCount }
  - `questions`: Array of AI-generated questions (Gemini)
  - `responses`: Array of user answers (stored in subcollection or array depending on size)

## Security Model

- **Deny-by-Default**: All access denied unless explicitly allowed.
- **Isolation**: Rules strictly enforce `request.auth.uid == userId`.
- **Validation**: Service layer uses Zod schemas to validate all writes before they reach Firestore.
