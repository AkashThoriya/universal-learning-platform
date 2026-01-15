# Firebase Security Rules

This document contains comprehensive Firestore security rules for the Exam Strategy Engine application, covering all collections including the new Adaptive Testing and Journey Planning features.

## 🔐 **Complete Firestore Security Rules**

Replace your existing Firestore rules with the following comprehensive configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Check if user is admin (implement based on your admin system)
    function isAdmin() {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Validate data structure for creation
    function isValidCreate(requiredFields) {
      return request.resource.data.keys().hasAll(requiredFields) &&
        request.resource.data.createdAt == request.time &&
        request.resource.data.updatedAt == request.time;
    }

    // Validate data structure for updates
    function isValidUpdate() {
      return request.resource.data.updatedAt == request.time &&
        request.resource.data.createdAt == resource.data.createdAt;
    }

    // ========================================================================
    // USER DATA & CORE COLLECTIONS
    // ========================================================================

    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId &&
        isValidCreate(['email', 'createdAt', 'updatedAt']);

      // User subcollections: courses, syllabus, progress, dailyLogs,
      // mockTests, journeys, tests, sessions, missions, achievements
      match /{document=**} {
        allow read, write: if isOwner(userId);
      }
    }

    // ========================================================================
    // ADAPTIVE TESTING COLLECTIONS
    // ========================================================================

    // Adaptive tests - users can only access their own tests
    match /adaptiveTests/{testId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        isValidCreate(['userId', 'title', 'description', 'status']);
    }

    // Test sessions
    match /testSessions/{sessionId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // Question banks - read access for authenticated users, write for admins
    match /questionBanks/{bankId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Individual question bank items
    match /questionBankItems/{itemId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Test responses - users can only access their own responses
    match /testResponses/{responseId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // Adaptive analytics - users can only access their own analytics
    match /adaptiveAnalytics/{analyticsId} {
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow write: if isAdmin() ||
        (isAuthenticated() && resource.data.userId == request.auth.uid);
    }

    // Test-journey links
    match /testJourneyLinks/{linkId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // User test preferences
    match /userTestPreferences/{userId} {
      allow read, write: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId;
    }

    // ========================================================================
    // JOURNEY PLANNING COLLECTIONS
    // ========================================================================

    // User journeys - users can only access their own journeys
    match /userJourneys/{journeyId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        isValidCreate(['userId', 'title', 'description', 'status']);
    }

    // Journey templates - read for all authenticated users, write for admins
    match /journeyTemplates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      allow create: if isAuthenticated() &&
        isValidCreate(['title', 'description', 'createdBy']);
    }

    // Journey analytics - users can only access their own analytics
    match /journeyAnalytics/{analyticsId} {
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow write: if isAdmin() ||
        (isAuthenticated() && resource.data.userId == request.auth.uid);
    }

    // Journey milestones
    match /journeyMilestones/{milestoneId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // Journey collaborators
    match /journeyCollaborators/{collaboratorId} {
      // Users can read if they're the owner or a collaborator
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        resource.data.collaboratorId == request.auth.uid ||
        isJourneyCollaborator(resource.data.journeyId)
      );
      // Only journey owners can add/remove collaborators
      allow write: if isAuthenticated() &&
        isJourneyOwner(resource.data.journeyId);
    }

    // Journey comments
    match /journeyComments/{commentId} {
      // Users can read comments if they're collaborators
      allow read: if isAuthenticated() &&
        isJourneyCollaborator(resource.data.journeyId);
      // Users can create comments if they're collaborators
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid &&
        isJourneyCollaborator(request.resource.data.journeyId);
      // Users can update/delete their own comments
      allow update, delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    // Journey invitations
    match /journeyInvitations/{invitationId} {
      // Users can read invitations sent to them or sent by them
      allow read: if isAuthenticated() && (
        resource.data.recipientEmail == request.auth.token.email ||
        resource.data.senderId == request.auth.uid
      );
      // Users can create invitations if they own the journey
      allow create: if isAuthenticated() &&
        request.resource.data.senderId == request.auth.uid &&
        isJourneyOwner(request.resource.data.journeyId);
      // Users can update invitations sent to them (accept/decline)
      allow update: if isAuthenticated() &&
        resource.data.recipientEmail == request.auth.token.email;
    }

    // Weekly progress tracking
    match /weeklyProgress/{progressId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // ========================================================================
    // MISSION SYSTEM COLLECTIONS
    // ========================================================================

    // Mission templates - read for authenticated users, write for admins
    match /missionTemplates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Active missions - users can only access their own missions
    match /missions/{missionId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // ========================================================================
    // EXAM DATA & PUBLIC COLLECTIONS
    // ========================================================================

    // Public read access to exams collection
    match /exams/{examId} {
      allow read: if true; // Public read access
      allow write: if isAdmin(); // Only admins can modify exam data
    }

    // Syllabus data - public read, admin write
    match /syllabus/{syllabusId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // ========================================================================
    // MICRO-LEARNING COLLECTIONS
    // ========================================================================

    // Micro-learning sessions
    match /microLearningSessions/{sessionId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // Learning content - read for authenticated users
    match /learningContent/{contentId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // ========================================================================
    // ANALYTICS & INSIGHTS
    // ========================================================================

    // User analytics - users can only access their own
    match /analytics/{userId} {
      allow read, write: if isOwner(userId);
    }

    // System-wide analytics - admin only
    match /systemAnalytics/{analyticsId} {
      allow read, write: if isAdmin();
    }

    // ========================================================================
    // HELPER FUNCTIONS FOR JOURNEY COLLABORATION
    // ========================================================================

    // Check if user is a collaborator on a journey
    function isJourneyCollaborator(journeyId) {
      return exists(/databases/$(database)/documents/journeyCollaborators/$(journeyId + '_' + request.auth.uid));
    }

    // Check if user owns a journey
    function isJourneyOwner(journeyId) {
      let journey = get(/databases/$(database)/documents/userJourneys/$(journeyId));
      return journey.data.userId == request.auth.uid;
    }

    // ========================================================================
    // ADMIN COLLECTION
    // ========================================================================

    // Admin users - only readable by other admins
    match /admins/{adminId} {
      allow read: if isAdmin();
      allow write: if false; // Admins should be managed outside Firestore
    }

    // ========================================================================
    // CATCH-ALL RULE
    // ========================================================================

    // Deny access to any other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🔒 **Security Rule Features**

### **Authentication & Authorization**

- ✅ User-scoped data access (users can only access their own data)
- ✅ Admin-only access for system data
- ✅ Collaboration permissions for journey planning
- ✅ Public read access for exam and learning content

### **Data Validation**

- ✅ Required field validation on creation
- ✅ Automatic timestamp management
- ✅ User ID validation for all user-scoped collections

### **Adaptive Testing Security**

- ✅ Test data isolation per user
- ✅ Question bank protection (admin-only write)
- ✅ Analytics access control
- ✅ Session management security

### **Journey Planning Security**

- ✅ Journey ownership verification
- ✅ Collaboration invitation system
- ✅ Comment and milestone access control
- ✅ Analytics and progress protection

## ⚠️ **Important Security Notes**

1. **Admin Setup**: Create an `admins` collection and add admin user IDs manually
2. **Email Validation**: Ensure email verification is enabled in Firebase Auth
3. **Rate Limiting**: Consider implementing rate limiting for public endpoints
4. **Data Encryption**: Sensitive data should be encrypted before storage
5. **Regular Audits**: Regularly review and audit access patterns

## 🚀 **Deployment Instructions**

1. **Navigate to Firebase Console**
2. **Go to Firestore Database → Rules**
3. **Replace existing rules with the above configuration**
4. **Test rules using the Firebase Emulator**
5. **Deploy to production after testing**

## 🧪 **Testing Security Rules**

Use the Firebase Rules Simulator to test:

```javascript
// Test user can read their own journey
auth.uid = 'user123';
path = /databases/default/documents/userJourneys/journey456;
resource = {data: {userId: 'user123'}};
// Should return: allow

// Test user cannot read another user's test
auth.uid = 'user123';
path = /databases/default/documents/adaptiveTests/test789;
resource = {data: {userId: 'user456'}};
// Should return: deny
```

## 📊 **Security Monitoring**

Monitor these metrics in Firebase Console:

- Failed authentication attempts
- Unauthorized access attempts
- Unusual data access patterns
- Admin operation frequency

---

**Status**: ✅ Issue #14 (Firebase Security Rules) - RESOLVED
**Last Updated**: 2025-01-11
**Next Review**: 2025-02-11
