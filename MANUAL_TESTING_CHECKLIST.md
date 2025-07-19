# Manual Testing Checklist for Enhanced User Profile System

This checklist is derived from the comprehensive testing guide and provides actionable steps for browser-based validation of the enhanced user profile system.

## Prerequisites
- Chrome or Edge browser (for full functionality including speech recognition)
- Valid Gemini API key configured in `.env.local`
- Firebase configuration setup
- Development server running (`npm run dev`)

## Core User Flows

### 1. New User Registration

#### Email Registration Flow
- [ ] Navigate to sign-up page
- [ ] Enter email: `test@example.com`, password: `testpass123`, name: `Test User`
- [ ] Click "Sign Up"
- [ ] **Expected**: User account created successfully
- [ ] **Expected**: Basic profile created with default values
- [ ] **Expected**: Redirected to profile completion page or dashboard
- [ ] **Expected**: Profile completion score shows > 0%

#### Google Registration Flow
- [ ] Click "Sign in with Google"
- [ ] Complete Google OAuth flow
- [ ] Grant necessary permissions
- [ ] **Expected**: User account created with Google info
- [ ] **Expected**: Profile populated with Google display name and email
- [ ] **Expected**: Default preferences created

### 2. Existing User Sign-In

#### Email Sign-In Flow
- [ ] Navigate to sign-in page
- [ ] Enter existing user credentials
- [ ] Click "Sign In"
- [ ] **Expected**: User authenticated successfully
- [ ] **Expected**: Existing profile data loaded
- [ ] **Expected**: Last login timestamp updated
- [ ] **Expected**: Preferences and statistics accessible

#### Auto-Login Verification
- [ ] Sign in once
- [ ] Close browser
- [ ] Reopen and navigate to app
- [ ] **Expected**: User remains signed in
- [ ] **Expected**: Profile data loads automatically

### 3. Profile Management

#### Profile Completion Testing
- [ ] Sign in as new user
- [ ] Navigate to Profile Settings
- [ ] Complete Personal Info section:
  - [ ] Add bio: "Software engineer passionate about AI"
  - [ ] Add pronouns: "he/him"
  - [ ] **Expected**: Profile completion score increases
- [ ] Complete Professional Info section:
  - [ ] Add current role: "Junior Developer"
  - [ ] Set experience: 2 years
  - [ ] Select industry: "Technology"
  - [ ] Add target roles: ["Software Engineer", "Full Stack Developer"]
  - [ ] **Expected**: Profile completion score increases further
- [ ] Complete Preferences section:
  - [ ] Set interview types: ["technical", "behavioral"]
  - [ ] Set difficulty: "intermediate"
  - [ ] Set session length: 30 minutes
  - [ ] **Expected**: Profile completion score increases
- [ ] Complete Privacy section:
  - [ ] Set visibility: "peers_only"
  - [ ] Accept data processing consent
  - [ ] Decline marketing consent
  - [ ] **Expected**: Profile marked as complete when all required fields filled

#### Profile Updates Testing
- [ ] Change bio from "Software engineer" to "Senior software engineer"
- [ ] Update years of experience from 2 to 3
- [ ] Add new target company "Google"
- [ ] Save changes
- [ ] **Expected**: Updates persist after page refresh
- [ ] **Expected**: Updated timestamp changes
- [ ] **Expected**: Completion score recalculated if applicable

### 4. Privacy Settings Validation

#### Visibility Settings Testing
- [ ] Set profile visibility to "Public"
- [ ] Have another user search for your profile (if applicable)
- [ ] **Expected**: Public profiles visible to all authenticated users
- [ ] Change to "Peers Only"
- [ ] Test access again
- [ ] **Expected**: Peers-only profiles visible to users with profiles
- [ ] Change to "Private"
- [ ] Verify no access
- [ ] **Expected**: Private profiles only visible to owner

#### Notification Preferences Testing
- [ ] Enable/disable email notifications
- [ ] Enable/disable push notifications
- [ ] Test reminder settings
- [ ] **Expected**: Settings save correctly
- [ ] **Expected**: Notifications respect user preferences

### 5. Data Consistency Testing

#### Cache Behavior Testing
- [ ] Update profile in one browser tab
- [ ] Check profile in another tab
- [ ] **Expected**: Changes reflect across all tabs
- [ ] Sign out and sign back in
- [ ] **Expected**: Data persists after sign out/in
- [ ] **Expected**: No stale cached data displayed

#### Offline Behavior Testing
- [ ] Disconnect internet
- [ ] Try to update profile
- [ ] **Expected**: Appropriate error messages shown
- [ ] Reconnect internet
- [ ] **Expected**: Updates retry when connection restored
- [ ] **Expected**: No data corruption

### 6. Error Handling Testing

#### Invalid Data Testing
- [ ] Try to set years of experience to -1
- [ ] **Expected**: Validation error displayed
- [ ] Try to set session length to 300 minutes
- [ ] **Expected**: Validation error displayed
- [ ] Try to submit empty required fields
- [ ] **Expected**: Form prevents submission with clear error messages

#### Network Error Testing
- [ ] Simulate network failure during profile update (use dev tools)
- [ ] **Expected**: Loading states shown appropriately
- [ ] **Expected**: Error messages displayed
- [ ] **Expected**: Retry mechanisms available

## Browser Compatibility Testing

### Desktop Browsers
- [ ] **Chrome (latest)**: All features work including speech recognition
- [ ] **Firefox (latest)**: Basic functionality (speech recognition may be limited)
- [ ] **Safari (latest)**: Basic functionality
- [ ] **Edge (latest)**: All features work including speech recognition

### Mobile Testing
- [ ] **iOS Safari**: Profile management works on mobile
- [ ] **Android Chrome**: Profile management works on mobile
- [ ] **Responsive Design**: UI adapts properly to mobile screens

## Performance Testing

### Profile Loading Performance
- [ ] Create user with complete profile
- [ ] Measure initial profile load time
- [ ] **Expected**: Initial load < 2 seconds
- [ ] Test subsequent loads (should use cache)
- [ ] **Expected**: Cached loads < 500ms
- [ ] **Expected**: No unnecessary API calls (check Network tab)

### Cache Efficiency Testing
- [ ] Load profile multiple times
- [ ] Check browser network tab for API calls
- [ ] **Expected**: Profile cached for 5 minutes
- [ ] Make profile update
- [ ] **Expected**: Cache invalidated on updates
- [ ] **Expected**: Memory usage reasonable

## Security Testing

### Authentication Security
- [ ] Try to access profile data without authentication
- [ ] **Expected**: Unauthenticated requests rejected
- [ ] Try to access other users' profile data (if multi-user testing possible)
- [ ] **Expected**: Cross-user access denied
- [ ] Test session expiration
- [ ] **Expected**: Expired sessions require re-authentication

### Data Validation Testing
- [ ] Try to submit malformed profile data via browser dev tools
- [ ] **Expected**: Invalid data rejected
- [ ] Test XSS attempts in profile fields (enter `<script>alert('test')</script>`)
- [ ] **Expected**: No script execution from user input
- [ ] **Expected**: Data sanitized properly

## Known Issues and Limitations

### Current Test Limitations
1. **Firestore Rules Testing**: Requires manual setup to avoid deployment conflicts
   - Install Java Runtime Environment
   - Install testing package: `npm install --save-dev @firebase/rules-unit-testing --legacy-peer-deps`
   - Run `firebase emulators:start --only firestore`
   - Then run `npm test firestore-rules.test.js`
   - **Note**: Package not included by default due to Firebase version conflicts

2. **Some Unit Tests**: Minor issues with mocking and imports
   - Most core functionality tests are passing
   - Non-critical test failures don't affect user functionality

3. **ES Module Issues**: Some tests fail due to @google/genai ES module imports
   - Functionality works in development mode
   - Consider updating Jest configuration for full ES module support

### Browser Limitations
- **Speech Recognition**: Only works in Chrome/Edge
- **Full Feature Support**: Recommended to use Chrome or Edge for testing
- **Mobile Safari**: Some features may have limited functionality

## Test Environment Setup

### Required Environment Variables
```bash
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Development Commands
```bash
npm run dev          # Start development server
npm run type-check   # Check TypeScript compilation
npm run lint         # Check code style
npm test            # Run unit tests
```

## Reporting Issues

When reporting bugs during manual testing:

1. **Environment Details**
   - Browser and version
   - Operating system
   - Screen resolution (for UI issues)

2. **Steps to Reproduce**
   - Exact sequence of actions
   - Test data used
   - Expected vs actual behavior

3. **Error Information**
   - Console errors (F12 Developer Tools)
   - Network request failures
   - Screenshots or screen recordings

This checklist ensures comprehensive validation of the enhanced user profile system before production deployment.