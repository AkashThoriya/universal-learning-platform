# Google Authentication Setup Guide

This guide will help you set up Google authentication for the Exam Strategy Engine application.

## Overview

The application now supports Google authentication alongside traditional email/password authentication. Users can:

- Sign in with their Google account for quick access
- Create new accounts using Google OAuth
- Automatically sync profile information from Google

## Prerequisites

1. **Firebase Project**: Ensure you have a Firebase project set up
2. **Google Cloud Console Access**: Access to Google Cloud Console for OAuth configuration
3. **Domain Configuration**: Your domain must be authorized for Google sign-in

## Step-by-Step Setup

### 1. Enable Google Authentication in Firebase

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Find **Google** in the providers list
5. Click **Enable**
6. Add your **authorized domains** (e.g., `localhost` for development, your production domain)
7. Note down the **Web client ID** and **Web client secret** (optional for advanced configuration)

### 2. Configure OAuth Consent Screen (If Required)

If you're using a custom Google Cloud project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **OAuth consent screen**
3. Configure your app information:
   - **App name**: Exam Strategy Engine
   - **User support email**: Your support email
   - **App logo**: Your app logo (optional)
   - **Authorized domains**: Add your domains
   - **Developer contact information**: Your email

### 3. Environment Configuration

Your Firebase configuration automatically includes Google authentication. No additional environment variables are required unless you need custom settings.

**Optional**: Add to your `.env.local` file if you need custom Google OAuth configuration:

```bash
# Google OAuth Configuration (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.googleusercontent.com
```

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Click **"Continue with Google"**
4. Test the authentication flow
5. Verify user data is saved correctly in Firestore

## Features Implemented

### ✅ Core Authentication

- [x] Google OAuth popup sign-in
- [x] User data synchronization with Firestore
- [x] Automatic account creation for new users
- [x] Existing user authentication
- [x] Error handling and user feedback

### ✅ User Experience

- [x] Loading states during authentication
- [x] Comprehensive error messages
- [x] Fallback to email/password authentication
- [x] Seamless redirect handling
- [x] Mobile-friendly popup handling

### ✅ Security Features

- [x] Secure token handling
- [x] Account linking prevention for security
- [x] Popup blocking detection
- [x] Environment validation
- [x] Rate limiting awareness

### ✅ Data Management

- [x] User profile data sync (name, email, photo)
- [x] Automatic user document creation
- [x] Onboarding flow integration
- [x] Progress data preservation
- [x] Statistics initialization

## User Flow

### New User Flow

1. User clicks "Continue with Google"
2. Google OAuth popup opens
3. User selects/logs into Google account
4. Account created in Firestore with Google profile data
5. User redirected to onboarding flow
6. Complete onboarding and access dashboard

### Existing User Flow

1. User clicks "Continue with Google"
2. Google OAuth popup opens
3. User authenticates with Google
4. System recognizes existing account
5. User data updated with latest Google info
6. User redirected to dashboard

## Error Handling

The system handles various error scenarios:

- **Popup Blocked**: Clear instructions to enable popups
- **Account Conflicts**: Prevention of account linking issues
- **Network Errors**: Retry mechanism and clear error messages
- **Authentication Failures**: Fallback to email/password option
- **Invalid Configuration**: Development-time error detection

## Security Considerations

### Implemented Security Features

1. **Account Protection**: Prevents account hijacking through email verification
2. **Secure Data Storage**: User data encrypted in Firebase
3. **Token Management**: Secure handling of authentication tokens
4. **Domain Restrictions**: Only authorized domains can use Google sign-in
5. **Popup Security**: Protection against popup-based attacks

### Best Practices Followed

- ✅ Minimal permission scopes (email, profile only)
- ✅ Secure token storage and handling
- ✅ Proper error handling without information leakage
- ✅ User consent and transparency
- ✅ Regular security reviews and updates

## Testing

### Manual Testing Checklist

- [ ] Google sign-in works on desktop
- [ ] Google sign-in works on mobile
- [ ] New user account creation
- [ ] Existing user authentication
- [ ] Error handling for blocked popups
- [ ] Error handling for network issues
- [ ] Proper redirection after authentication
- [ ] User data synchronization
- [ ] Onboarding flow integration

### Automated Testing

The Google authentication service includes:

- Environment validation functions
- Popup support detection
- Configuration validation
- Error handling tests

## Troubleshooting

### Common Issues

**Issue**: "Popup blocked" error
**Solution**: Check browser popup settings, add site to allowed list

**Issue**: "Unauthorized domain" error
**Solution**: Add domain to Firebase authorized domains list

**Issue**: "Configuration error" error
**Solution**: Verify Firebase API key and project configuration

**Issue**: User data not saving
**Solution**: Check Firestore rules and database permissions

**Issue**: Redirect not working
**Solution**: Verify routing configuration and error logs

### Debug Mode

Enable debug logging in development:

```javascript
import { logGoogleAuthConfig } from '@/lib/google-auth';

// Call this in development to see configuration details
logGoogleAuthConfig();
```

## Monitoring and Analytics

### User Authentication Metrics

The system tracks:

- Google sign-in success/failure rates
- New vs returning user ratios
- Authentication method preferences
- Error frequency and types

### Performance Monitoring

- Authentication response times
- Popup loading performance
- Database write performance
- User experience metrics

## Future Enhancements

### Planned Features

- [ ] Google account linking for existing email users
- [ ] Enhanced profile sync (additional Google data)
- [ ] Google Drive integration for document storage
- [ ] Google Calendar integration for study scheduling
- [ ] SSO integration for enterprise users

### Advanced Configuration

- [ ] Custom OAuth scopes for additional permissions
- [ ] Enterprise Google Workspace integration
- [ ] Multi-domain support for white-label deployments
- [ ] Advanced user role management

## Support

### Documentation

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [React Firebase Docs](https://github.com/CSFrequency/react-firebase-hooks)

### Getting Help

- Check Firebase console for authentication logs
- Review browser console for client-side errors
- Check Firestore rules for permission issues
- Contact support with specific error messages

---

## Removed Features

### ❌ Apple Sign-In

- Removed Apple authentication to simplify the authentication flow
- Users can still use email/password or Google authentication
- Apple Sign-In can be re-added in the future if needed

**Rationale for Removal**:

- Simplified user interface with fewer options
- Reduced maintenance complexity
- Focus on most commonly used authentication methods
- Google OAuth provides excellent cross-platform support

---

_Last Updated: [Current Date]_
_Version: 1.0.0_
