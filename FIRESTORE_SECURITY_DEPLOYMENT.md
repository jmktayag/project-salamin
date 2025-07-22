# Firestore Security Rules Deployment Guide

## ⚠️ URGENT: Security Rules Expiring in 4 Days

Your Firestore database is currently in test mode with open security rules that will automatically deny all requests in 4 days to protect your data.

## What Was Done

1. **Created Secure Rules**: `firestore.rules` - Restricts database access to authenticated users
2. **Created Firebase Config**: `firebase.json` - Links the rules file
3. **Analyzed Current Usage**: The app uses Firestore to store interview session data

## Security Rules Summary

The new rules ensure that:
- ✅ Only authenticated users can access the database
- ✅ Users can only read/write their own interview sessions
- ✅ Data structure is validated on creation
- ✅ Reasonable limits are enforced (max 50 questions per session)
- ❌ All other collections are denied by default

## Deployment Steps

### Option 1: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the contents of `firestore.rules`
5. Click **Publish** to deploy

### Option 2: Using Firebase CLI

```bash
# 1. Login to Firebase (if not already logged in)
firebase login

# 2. Initialize Firebase project (if not already done)
firebase init firestore
# Choose your existing project
# Accept default rules file (firestore.rules)
# Accept default indexes file

# 3. Deploy the rules
firebase deploy --only firestore:rules
```

## Testing the Rules

After deployment, test that your app still works:

1. Start your development server: `npm run dev`
2. Sign in to your account
3. Start a new interview session
4. Complete a few questions
5. Check that session history loads correctly
6. Try signing out and accessing the app (should be blocked)

## Troubleshooting

### If Users Can't Access Their Data:
- Ensure users are properly authenticated before accessing Firestore
- Check that the `userId` field matches the authenticated user's UID
- Verify Firebase Auth is working correctly

### If Rules Are Too Restrictive:
- Check the browser console for permission denied errors
- Verify the data structure matches the validation rules
- Ensure all required fields are present when creating sessions

### If You Need to Modify Rules:
- Edit `firestore.rules`
- Redeploy using Firebase Console or CLI
- Test thoroughly before final deployment

## Time Sensitivity

**You have 4 days** before Firebase automatically denies all requests. Deploy these rules as soon as possible to maintain app functionality.

## Questions?

If you encounter any issues during deployment, check:
1. Firebase project configuration in `.env.local`
2. User authentication status
3. Browser console for detailed error messages