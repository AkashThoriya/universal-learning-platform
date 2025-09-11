# Environment Configuration Guide

This document outlines all environment variables required for the Exam Strategy Engine application.

## 🚀 **Quick Setup (Simplified)**

The application uses a **two-file approach**:

1. **`.env.example`** - Template (committed to GitHub)
2. **`.env`** - Your actual keys (gitignored)

```bash
# Setup in 30 seconds
npm run setup
# Edit .env with your actual keys
```

**If `.env.example` doesn't exist**, create it manually:

```env
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# LLM Integration (Required for Adaptive Testing)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Push Notifications, Error Reporting, etc.
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT=https://your-error-service.com/api/errors
```

## 🔧 **Configuration Overview**

The application requires several environment variables for proper functionality. All variables are documented in `.env.example` with clear instructions:

## 📋 **Required Environment Variables**

### **Firebase Configuration**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### **LLM Integration (Critical for Adaptive Testing)**

```env
# Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: Both public and server-side keys are required for proper LLM integration.

## 🔗 **Optional Environment Variables**

### **Firebase Analytics**

```env
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### **Push Notifications (PWA)**

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

### **Error Reporting & Monitoring**

```env
NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT=https://your-error-service.com/api/errors
NEXT_PUBLIC_BUILD_VERSION=1.0.0
```

### **Analytics & Tracking**

```env
NEXT_PUBLIC_GA_TRACKING_ID=your_ga_tracking_id_here
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-service.com/api/track
```

### **Application Configuration**

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
CUSTOM_KEY=your_custom_key_here
```

### **Database Configuration (Advanced - Optional)**

```env
DATABASE_PROVIDER=firebase
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=exam_strategy
DATABASE_USERNAME=username
DATABASE_PASSWORD=password
DATABASE_SSL=false
```

### **Feature Flags**

```env
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### **Development Tools**

```env
ANALYZE=false
DEBUG=false
```

### **Security Configuration (Production)**

```env
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT_REQUESTS_PER_MINUTE=60
WEBHOOK_SECRET=your_webhook_secret_here
```

## 🚨 **Critical Configuration Issues**

### **Issue #12: LLM Integration Not Implemented**

**Status**: ✅ RESOLVED

- Added comprehensive LLM service with provider abstraction
- Implemented Gemini API integration for question generation
- Added fallback mechanisms for when LLM is unavailable

**Required Configuration**:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_key_here
GEMINI_API_KEY=your_actual_key_here
```

### **Issue #15: Environment Configuration Gaps**

**Status**: ✅ RESOLVED

- Documented all required environment variables
- Added validation for critical configuration
- Implemented graceful degradation when optional services unavailable

## 🔐 **Security Best Practices**

1. **Never commit `.env.local`** to version control
2. **Use different keys** for development and production
3. **Regularly rotate API keys** for security
4. **Validate environment variables** on application startup
5. **Use least-privilege access** for all API keys

## 📊 **Environment Validation**

The application automatically validates critical environment variables on startup:

```typescript
// Example validation (implemented in lib/llm-service.ts)
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.warn('LLM provider not available: Missing Gemini API key');
}
```

## 🚀 **Deployment Configuration**

### **Vercel Deployment**

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Add all required environment variables
4. Redeploy your application

### **Firebase Hosting**

1. Use `firebase functions:config:set` for server-side variables
2. Configure build environment variables in `firebase.json`

### **Docker Deployment**

```dockerfile
# Example Dockerfile configuration
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY}
ENV NEXT_PUBLIC_GEMINI_API_KEY=${GEMINI_API_KEY}
```

## ⚠️ **Common Configuration Issues**

### **LLM Service Not Available**

**Symptoms**: Adaptive tests fall back to mock questions
**Solution**: Verify Gemini API key is correctly configured

### **Firebase Connection Issues**

**Symptoms**: Authentication and data sync failures
**Solution**: Verify all Firebase configuration variables are set

### **Push Notifications Not Working**

**Symptoms**: PWA notifications don't appear
**Solution**: Configure VAPID keys for push notifications

## 📚 **Getting API Keys**

### **Gemini API Key**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your environment configuration

### **Firebase Configuration**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to Project Settings → General
3. Copy configuration from "Your apps" section

### **VAPID Keys for Push Notifications**

```bash
# Generate VAPID keys using web-push
npx web-push generate-vapid-keys
```

## 🔍 **Environment Debugging**

Add this component to debug environment configuration:

```typescript
// components/EnvironmentDebug.tsx (Development Only)
export function EnvironmentDebug() {
  const configs = {
    firebase: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    gemini: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    vapid: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  };

  return (
    <div className="p-4 bg-gray-100">
      <h3>Environment Configuration Status</h3>
      {Object.entries(configs).map(([key, configured]) => (
        <div key={key}>
          {key}: {configured ? '✅' : '❌'}
        </div>
      ))}
    </div>
  );
}
```

## 📋 **Environment Checklist**

- [ ] Firebase configuration complete
- [ ] Gemini API key configured
- [ ] VAPID keys generated (if using PWA)
- [ ] Error reporting endpoint configured
- [ ] Feature flags set appropriately
- [ ] Environment variables validated on startup
- [ ] Different configurations for dev/staging/production

---

**Last Updated**: 2025-01-11
**Related Issues**: #12 (LLM Integration), #15 (Environment Configuration)
