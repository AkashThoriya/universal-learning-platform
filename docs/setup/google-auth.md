# Google Authentication Setup Guide

Short: Step-by-step configuration for Google OAuth with Firebase and the app.

Last updated: 2025-09-09 — See `docs/INDEX.md` for navigation.

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
